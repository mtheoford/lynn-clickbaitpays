import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites, stripeEvents, subscriptions, users } from "@/db/schema";
import { getStripe, stripeConfig, type BillingPlan } from "@/lib/stripe";

function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function siteStatusForSubscription(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "active" as const;
  if (status === "past_due" || status === "unpaid") return "past_due" as const;
  if (status === "canceled" || status === "incomplete_expired") return "canceled" as const;
  return "pending" as const;
}

async function updateSitesForCustomer(
  customerId: string,
  status: "active" | "past_due" | "canceled",
) {
  const db = await getDb();
  const linked = await db
    .select({ siteId: subscriptions.siteId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId));

  for (const item of linked) {
    await db
      .update(sites)
      .set({
        status,
        publishedAt: status === "active" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, item.siteId));
  }
}

async function handleEvent(event: Stripe.Event) {
  const db = await getDb();
  const [processed] = await db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, event.id))
    .limit(1);
  if (processed) return;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const siteId = session.metadata?.siteId ?? session.client_reference_id;
    const userId = session.metadata?.userId;
    const customerId = stripeId(session.customer);
    const subscriptionId = stripeId(session.subscription);
    const plan = session.metadata?.plan === "annual" ? "annual" : "monthly";

    if (!siteId || !userId || !customerId || !subscriptionId) {
      throw new Error("Completed Checkout session is missing provisioning metadata.");
    }

    const now = new Date();
    await db.update(users).set({ stripeCustomerId: customerId, updatedAt: now }).where(eq(users.id, userId));
    await db
      .update(sites)
      .set({ status: "active", publishedAt: now, reservationExpiresAt: null, updatedAt: now })
      .where(eq(sites.id, siteId));
    await db
      .insert(subscriptions)
      .values({
        id: crypto.randomUUID(),
        userId,
        siteId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: plan as BillingPlan,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: { status: "active", updatedAt: now },
      });
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const customerId = stripeId(invoice.customer);
    if (customerId) {
      const isPaid = event.type === "invoice.paid";
      const status = isPaid ? "active" : "past_due";
      const graceEndsAt = isPaid ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db
        .update(subscriptions)
        .set({ status, graceEndsAt, updatedAt: new Date() })
        .where(eq(subscriptions.stripeCustomerId, customerId));
      await updateSitesForCustomer(customerId, status);
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const status = siteStatusForSubscription(subscription.status);
    await db
      .update(subscriptions)
      .set({ status: subscription.status, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    const [localSubscription] = await db
      .select({ siteId: subscriptions.siteId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);
    if (localSubscription) {
      await db
        .update(sites)
        .set({ status, updatedAt: new Date() })
        .where(eq(sites.id, localSubscription.siteId));
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const siteId = session.metadata?.siteId ?? session.client_reference_id;
    if (siteId) {
      await db
        .update(sites)
        .set({ reservationExpiresAt: new Date(), updatedAt: new Date() })
        .where(eq(sites.id, siteId));
    }
  }

  await db.insert(stripeEvents).values({
    id: event.id,
    eventType: event.type,
    processedAt: new Date(),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const { webhookSecret } = stripeConfig();
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

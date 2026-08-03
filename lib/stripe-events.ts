import { and, eq, lte, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db";
import {
  customerSessions,
  magicLinkTokens,
  sites,
  stripeEvents,
  subscriptions,
  users,
} from "@/db/schema";
import {
  gracePeriodEnd,
  siteStatusForSubscription,
  siteStatusWithPublicationOverride,
  subscriptionPeriodEnd,
} from "@/lib/billing-lifecycle";
import { sendWelcomeEmail } from "@/lib/email";
import { getRuntimeEnv, type BillingQueueMessage } from "@/lib/runtime";
import { siteUrl } from "@/lib/site-config";
import { getStripe, type BillingPlan } from "@/lib/stripe";

function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function registerStripeEvent(event: Stripe.Event): Promise<{
  duplicate: boolean;
  queued: boolean;
}> {
  const db = await getDb();
  const [existing] = await db
    .select({ status: stripeEvents.status })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, event.id))
    .limit(1);

  if (existing?.status === "completed") {
    return { duplicate: true, queued: false };
  }

  const now = new Date();
  await db
    .insert(stripeEvents)
    .values({
      id: event.id,
      eventType: event.type,
      status: "pending",
      payloadJson: JSON.stringify(event),
      attempts: 0,
      receivedAt: now,
    })
    .onConflictDoUpdate({
      target: stripeEvents.id,
      set: {
        eventType: event.type,
        status: "pending",
        payloadJson: JSON.stringify(event),
        lastError: null,
      },
    });

  const env = await getRuntimeEnv();
  if (env.BILLING_QUEUE) {
    await env.BILLING_QUEUE.send({ stripeEventId: event.id });
    return { duplicate: false, queued: true };
  }

  // The existing Sites preview has no Queue binding; process synchronously there.
  await processStripeEvent(event.id);
  return { duplicate: false, queued: false };
}

export async function processBillingMessages(
  messages: Array<{ body: BillingQueueMessage; ack(): void; retry(): void }>,
): Promise<void> {
  for (const message of messages) {
    try {
      await processStripeEvent(message.body.stripeEventId);
      message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "billing queue message failed",
          stripeEventId: message.body.stripeEventId,
          error: error instanceof Error ? error.message : "Unknown queue failure",
        }),
      );
      message.retry();
    }
  }
}

export async function processStripeEvent(eventId: string): Promise<void> {
  const db = await getDb();
  const [record] = await db
    .select()
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .limit(1);
  if (!record || record.status === "completed") return;

  await db
    .update(stripeEvents)
    .set({
      status: "processing",
      attempts: sql`${stripeEvents.attempts} + 1`,
      lastError: null,
    })
    .where(eq(stripeEvents.id, eventId));

  try {
    const event = JSON.parse(record.payloadJson) as Stripe.Event;
    await applyStripeEvent(event);
    await db
      .update(stripeEvents)
      .set({ status: "completed", processedAt: new Date(), lastError: null })
      .where(eq(stripeEvents.id, eventId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe event failure";
    await db
      .update(stripeEvents)
      .set({ status: "failed", lastError: message.slice(0, 1000) })
      .where(eq(stripeEvents.id, eventId));
    throw error;
  }
}

async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    await applyCompletedCheckout(event.data.object);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const customerId = stripeId(event.data.object.customer);
    if (customerId) await reconcileCustomer(customerId, event.type === "invoice.payment_failed");
    return;
  }

  if (event.type === "customer.subscription.updated") {
    const stripe = await getStripe();
    const current = await stripe.subscriptions.retrieve(event.data.object.id);
    await applySubscription(current);
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    await applySubscription(event.data.object);
    return;
  }

  if (event.type === "checkout.session.expired") {
    const siteId = event.data.object.metadata?.siteId ?? event.data.object.client_reference_id;
    if (!siteId) return;
    const db = await getDb();
    await db
      .update(sites)
      .set({ reservationExpiresAt: new Date(), updatedAt: new Date() })
      .where(and(eq(sites.id, siteId), eq(sites.status, "pending")));
  }
}

async function applyCompletedCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const siteId = session.metadata?.siteId ?? session.client_reference_id;
  const userId = session.metadata?.userId;
  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);
  const plan: BillingPlan = session.metadata?.plan === "annual" ? "annual" : "monthly";
  if (!siteId || !userId || !customerId || !subscriptionId) {
    throw new Error("Completed Checkout session is missing provisioning metadata.");
  }

  const stripe = await getStripe();
  const remoteSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = subscriptionPeriodEnd(remoteSubscription);
  const billingStatus = siteStatusForSubscription(remoteSubscription.status, currentPeriodEnd);
  const now = new Date();
  const db = await getDb();

  const [reservation] = await db
    .select({ id: sites.id, publicationOverride: sites.publicationOverride })
    .from(sites)
    .where(
      and(
        eq(sites.id, siteId),
        eq(sites.userId, userId),
        eq(sites.stripeCheckoutSessionId, session.id),
      ),
    )
    .limit(1);
  if (!reservation) {
    throw new Error("Completed Checkout session does not match the current site reservation.");
  }
  const siteStatus = siteStatusWithPublicationOverride(
    billingStatus,
    reservation.publicationOverride,
  );

  await db
    .update(users)
    .set({ stripeCustomerId: customerId, updatedAt: now })
    .where(eq(users.id, userId));
  await db
    .update(sites)
    .set({
      status: siteStatus,
      publishedAt: siteStatus === "active" ? now : undefined,
      reservationExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(sites.id, siteId));
  const subscriptionValues = {
    userId,
    siteId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan,
    status: remoteSubscription.status,
    cancelAtPeriodEnd: remoteSubscription.cancel_at_period_end,
    currentPeriodEnd,
    graceEndsAt: siteStatus === "past_due" ? gracePeriodEnd(now) : null,
    updatedAt: now,
  };
  const [existingSubscription] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.siteId, siteId))
    .limit(1);
  if (existingSubscription) {
    await db
      .update(subscriptions)
      .set(subscriptionValues)
      .where(eq(subscriptions.id, existingSubscription.id));
  } else {
    await db.insert(subscriptions).values({
      id: crypto.randomUUID(),
      ...subscriptionValues,
      createdAt: now,
    });
  }

  if (siteStatus === "active") {
    const [account] = await db
      .select({ email: users.email, name: users.name, slug: sites.slug })
      .from(users)
      .innerJoin(sites, eq(sites.userId, users.id))
      .where(and(eq(users.id, userId), eq(sites.id, siteId)))
      .limit(1);
    if (account) {
      const marketingUrl =
        process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org";
      try {
        await sendWelcomeEmail({
          email: account.email,
          name: account.name,
          publicUrl: siteUrl(account.slug),
          manageUrl: new URL("/manage", marketingUrl).toString(),
          siteId,
        });
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "welcome email delivery failed after site activation",
            siteId,
            error: error instanceof Error ? error.message : "Unknown email failure",
          }),
        );
      }
    }
  }
}

async function reconcileCustomer(customerId: string, paymentFailed: boolean): Promise<void> {
  const db = await getDb();
  const linked = await db
    .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId));
  const stripe = await getStripe();
  for (const item of linked) {
    const current = await stripe.subscriptions.retrieve(item.stripeSubscriptionId);
    await applySubscription(current, paymentFailed);
  }
}

async function applySubscription(
  subscription: Stripe.Subscription,
  paymentFailed = false,
): Promise<void> {
  const db = await getDb();
  const [local] = await db
    .select({
      siteId: subscriptions.siteId,
      graceEndsAt: subscriptions.graceEndsAt,
      publicationOverride: sites.publicationOverride,
    })
    .from(subscriptions)
    .innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);
  if (!local) return;

  const now = new Date();
  const currentPeriodEnd = subscriptionPeriodEnd(subscription);
  const billingStatus = siteStatusForSubscription(subscription.status, currentPeriodEnd, now);
  const siteStatus = siteStatusWithPublicationOverride(
    billingStatus,
    local.publicationOverride,
  );
  const graceEndsAt =
    siteStatus === "past_due"
      ? local.graceEndsAt ?? gracePeriodEnd(now)
      : null;

  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd,
      graceEndsAt: paymentFailed ? local.graceEndsAt ?? gracePeriodEnd(now) : graceEndsAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  await db
    .update(sites)
    .set({
      status: siteStatus,
      publishedAt: siteStatus === "active" ? now : undefined,
      updatedAt: now,
    })
    .where(eq(sites.id, local.siteId));
}

export async function enforceScheduledBillingState(now = new Date()): Promise<void> {
  const db = await getDb();
  await db.delete(customerSessions).where(lte(customerSessions.expiresAt, now));
  await db.delete(magicLinkTokens).where(lte(magicLinkTokens.expiresAt, now));

  const overdue = await db
    .select({
      siteId: subscriptions.siteId,
      publicationOverride: sites.publicationOverride,
    })
    .from(subscriptions)
    .innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .where(
      and(
        or(eq(subscriptions.status, "past_due"), eq(subscriptions.status, "unpaid")),
        lte(subscriptions.graceEndsAt, now),
      ),
    );
  for (const item of overdue) {
    await db
      .update(sites)
      .set({
        status: siteStatusWithPublicationOverride(
          "suspended",
          item.publicationOverride,
        ),
        updatedAt: now,
      })
      .where(eq(sites.id, item.siteId));
  }

  const ended = await db
    .select({
      siteId: subscriptions.siteId,
      publicationOverride: sites.publicationOverride,
    })
    .from(subscriptions)
    .innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .where(
      and(
        eq(subscriptions.status, "canceled"),
        lte(subscriptions.currentPeriodEnd, now),
      ),
    );
  for (const item of ended) {
    await db
      .update(sites)
      .set({
        status: siteStatusWithPublicationOverride(
          "canceled",
          item.publicationOverride,
        ),
        updatedAt: now,
      })
      .where(eq(sites.id, item.siteId));
  }
}

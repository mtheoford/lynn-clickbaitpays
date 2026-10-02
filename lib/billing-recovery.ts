import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db";
import { billingRecovery, sites, subscriptions, users } from "@/db/schema";
import { buildBillingRecoveryEmail } from "@/lib/billing-recovery-email";
import { dueBillingNotice, invoiceSubscriptionId, recoveryStillOutstanding } from "@/lib/billing-recovery-policy";
import { billingLocale, localizedPublicUrl } from "@/lib/checkout-localization";
import { sendTransactionalEmail } from "@/lib/email";
import { localizedPath } from "@/lib/i18n";
import { runtimeValue } from "@/lib/runtime";
import { siteUrl } from "@/lib/site-config";
import { getStripe } from "@/lib/stripe";

export async function startBillingRecovery(invoice: Stripe.Invoice, subscription: Stripe.Subscription): Promise<void> {
  const latestId = typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id;
  if (invoiceSubscriptionId(invoice) !== subscription.id || invoice.id !== latestId) return;
  const db = await getDb();
  const [account] = await db.select({ siteId: sites.id, graceEndsAt: subscriptions.graceEndsAt, status: subscriptions.status,
    customerId: subscriptions.stripeCustomerId })
    .from(subscriptions).innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1);
  if (!account?.graceEndsAt || !["past_due", "unpaid"].includes(account.status)) return;
  if (!recoveryStillOutstanding({ invoiceId: invoice.id, subscriptionId: subscription.id,
    customerId: account.customerId, invoice, subscription })) return;
  await db.insert(billingRecovery).values({
    invoiceId: invoice.id, siteId: account.siteId, stripeSubscriptionId: subscription.id,
    graceEndsAt: account.graceEndsAt, locale: billingLocale(subscription.metadata.locale), createdAt: new Date(),
  }).onConflictDoNothing();
  // Stripe sends the initial payment-failure email. Our durable record schedules
  // the site-specific reminder and suspension notice independently of billing.
  await deliverDueBillingRecoveryNotices(new Date(), invoice.id);
}

export async function closeBillingRecovery(invoiceId: string): Promise<void> {
  const db = await getDb();
  await db.update(billingRecovery).set({ closedAt: new Date() }).where(eq(billingRecovery.invoiceId, invoiceId));
}

// Existing overdue accounts can join the reminder process after deployment,
// using their original deadline rather than starting another grace period.
export async function seedMissingBillingRecovery(): Promise<void> {
  const db = await getDb();
  const candidates = await db.select({ subscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions).innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .leftJoin(billingRecovery, eq(billingRecovery.stripeSubscriptionId, subscriptions.stripeSubscriptionId))
    .where(and(isNull(billingRecovery.invoiceId), isNull(sites.publicationOverride),
      or(eq(subscriptions.status, "past_due"), eq(subscriptions.status, "unpaid")),
      or(eq(sites.status, "past_due"), eq(sites.status, "suspended"))))
    .limit(100);
  for (const account of candidates) {
    try {
      const stripe = await getStripe();
      const subscription = await stripe.subscriptions.retrieve(account.subscriptionId);
      if (!["past_due", "unpaid"].includes(subscription.status)) continue;
      const invoiceId = typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id;
      if (invoiceId) await startBillingRecovery(await stripe.invoices.retrieve(invoiceId), subscription);
    } catch (error) {
      console.error(JSON.stringify({ message: "billing recovery scheduling failed", subscriptionId: account.subscriptionId,
        error: error instanceof Error ? error.message : "Unknown Stripe error" }));
    }
  }
}

export async function deliverDueBillingRecoveryNotices(now = new Date(), invoiceId?: string): Promise<number> {
  const db = await getDb();
  const candidates = await db.select({ recovery: billingRecovery, email: users.email, name: users.name,
    slug: sites.slug, siteStatus: sites.status, publicationOverride: sites.publicationOverride,
    customerId: subscriptions.stripeCustomerId,
  }).from(billingRecovery).innerJoin(sites, eq(sites.id, billingRecovery.siteId))
    .innerJoin(users, eq(users.id, sites.userId))
    .innerJoin(subscriptions, and(eq(subscriptions.siteId, sites.id), eq(subscriptions.stripeSubscriptionId, billingRecovery.stripeSubscriptionId)))
    .where(and(isNull(billingRecovery.closedAt), isNull(sites.publicationOverride),
      or(
        and(eq(sites.status, "past_due"), gt(billingRecovery.graceEndsAt, now), lte(billingRecovery.graceEndsAt, new Date(now.getTime() + 24 * 60 * 60 * 1000)), isNull(billingRecovery.reminderSentAt)),
        and(eq(sites.status, "suspended"), lte(billingRecovery.graceEndsAt, now), isNull(billingRecovery.suspensionSentAt)),
      ), ...(invoiceId ? [eq(billingRecovery.invoiceId, invoiceId)] : [])))
    .limit(100);
  let sent = 0;
  for (const account of candidates) {
    const notice = dueBillingNotice(account.recovery, account.siteStatus, now);
    if (!notice || account.publicationOverride) continue;
    try {
      const stripe = await getStripe();
      const [invoice, subscription] = await Promise.all([
        stripe.invoices.retrieve(account.recovery.invoiceId),
        stripe.subscriptions.retrieve(account.recovery.stripeSubscriptionId),
      ]);
      if (!recoveryStillOutstanding({ invoiceId: account.recovery.invoiceId,
        subscriptionId: account.recovery.stripeSubscriptionId, customerId: account.customerId, invoice, subscription })) {
        await closeBillingRecovery(account.recovery.invoiceId);
        continue;
      }
      const [marketingUrl, supportEmail] = await Promise.all([
        runtimeValue("NEXT_PUBLIC_MARKETING_URL"), runtimeValue("NEXT_PUBLIC_SUPPORT_EMAIL"),
      ]);
      const locale = account.recovery.locale;
      const manageUrl = new URL(localizedPath(locale, "/manage"), marketingUrl || "https://cbp.proneurs.org").toString();
      const content = buildBillingRecoveryEmail({ notice, name: account.name,
        siteAddress: localizedPublicUrl(siteUrl(account.slug), locale).replace(/^https?:\/\//, ""),
        graceEndsAt: account.recovery.graceEndsAt, paymentUrl: invoice.hosted_invoice_url ?? null,
        manageUrl, supportEmail: supportEmail || "support@proneurs.org", locale,
      });
      await sendTransactionalEmail({ to: account.email, ...content, idempotencyKey: `billing-${notice}-${invoice.id}` });
      const sentColumn = { reminder: "reminderSentAt", suspension: "suspensionSentAt" }[notice];
      await db.update(billingRecovery).set({ [sentColumn]: now, ...(notice === "suspension" ? { closedAt: now } : {}) })
        .where(eq(billingRecovery.invoiceId, invoice.id));
      sent += 1;
    } catch (error) {
      console.error(JSON.stringify({ message: "billing recovery email failed", invoiceId: account.recovery.invoiceId,
        notice, error: error instanceof Error ? error.message : "Unknown delivery error" }));
    }
  }
  return sent;
}

import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, sites, stripeEvents, welcomeEmailDeliveries } from "@/db/schema";
import { runtimeValue } from "@/lib/runtime";
import { sendTransactionalEmail } from "@/lib/email";
import {
  BILLING_ATTENTION_AFTER_MS,
  BILLING_MAX_ATTEMPTS,
  billingAlertId,
  validBillingAlertRecipient,
} from "@/lib/billing-health-policy";

export async function getBillingHealth(now = new Date()) {
  const db = await getDb();
  const cutoff = new Date(now.getTime() - BILLING_ATTENTION_AFTER_MS);
  const eventNeedsAttention = and(
    ne(stripeEvents.status, "completed"),
    or(lte(stripeEvents.receivedAt, cutoff), gte(stripeEvents.attempts, BILLING_MAX_ATTEMPTS)),
  );
  const paidSiteNeedsAttention = and(
    eq(sites.status, "pending"),
    or(eq(sites.checkoutPaymentStatus, "paid"),
      and(eq(sites.checkoutPaymentStatus, "no_payment_required"), isNotNull(sites.checkoutCompletedAt))),
    sql`COALESCE(${sites.checkoutCompletedAt}, ${sites.createdAt}) <= ${cutoff.getTime()}`,
    isNull(sites.publicationOverride),
    isNull(sites.deletionScheduledAt),
    eq(sites.isDemo, false),
  );
  const emailNeedsAttention = or(
    inArray(welcomeEmailDeliveries.status, ["needs_review", "bounced", "complained"]),
    and(
      inArray(welcomeEmailDeliveries.status, ["pending", "sending", "failed"]),
      lte(welcomeEmailDeliveries.createdAt, cutoff),
    ),
  );
  const [eventCount, siteCount, emailCount, events, paidSites, emails] = await Promise.all([
    db.select({ value: count() }).from(stripeEvents).where(eventNeedsAttention),
    db.select({ value: count() }).from(sites).where(paidSiteNeedsAttention),
    db.select({ value: count() }).from(welcomeEmailDeliveries).where(emailNeedsAttention),
    db.select({ id: stripeEvents.id, eventType: stripeEvents.eventType, status: stripeEvents.status,
      attempts: stripeEvents.attempts, receivedAt: stripeEvents.receivedAt,
      nextAttemptAt: stripeEvents.nextAttemptAt }).from(stripeEvents)
      .where(eventNeedsAttention).orderBy(stripeEvents.receivedAt).limit(50),
    db.select({ id: sites.id, slug: sites.slug, displayName: sites.displayName,
      checkedAt: sites.checkoutLastCheckedAt }).from(sites)
      .where(paidSiteNeedsAttention).orderBy(sites.createdAt).limit(50),
    db.select({ id: welcomeEmailDeliveries.id, siteId: welcomeEmailDeliveries.siteId,
      status: welcomeEmailDeliveries.status, attempts: welcomeEmailDeliveries.attempts,
      createdAt: welcomeEmailDeliveries.createdAt }).from(welcomeEmailDeliveries)
      .where(emailNeedsAttention).orderBy(welcomeEmailDeliveries.createdAt).limit(50),
  ]);
  return {
    checkedAt: now,
    counts: { events: eventCount[0]?.value ?? 0, paidSites: siteCount[0]?.value ?? 0,
      emails: emailCount[0]?.value ?? 0 },
    events, paidSites, emails,
  };
}

/** At most one notification per UTC day; provider key also protects an uncertain DB write. */
export async function sendBillingHealthAlert(now = new Date()): Promise<"disabled" | "healthy" | "already_sent" | "sent"> {
  const recipient = (await runtimeValue("BILLING_ALERT_EMAIL")).trim();
  if (!recipient) return "disabled";
  if (!validBillingAlertRecipient(recipient)) throw new Error("Billing alert recipient is invalid.");
  const health = await getBillingHealth(now);
  if (!Object.values(health.counts).some(value => value > 0)) return "healthy";
  const db = await getDb();
  const appEnv = (await runtimeValue("APP_ENV")) || "local";
  const deliveryId = billingAlertId(appEnv, now);
  const [existing] = await db.select({ id: auditLogs.id }).from(auditLogs)
    .where(eq(auditLogs.id, deliveryId)).limit(1);
  if (existing) return "already_sent";

  // Keep the entire payload stable throughout the idempotency window. The
  // authenticated page shows current counts; email contains no customer data.
  const adminUrl = "https://admin.cbp.proneurs.org/admin/billing";
  await sendTransactionalEmail({
    to: recipient,
    subject: "ProNeurs billing processing needs attention",
    text: `Some billing or welcome-email work needs review. Open the protected billing health page: ${adminUrl}\n\nThis alert concerns application processing or email delivery. It does not mean a new customer charge failed. Automatic recovery will continue where safe.`,
    html: `<p>Some billing or welcome-email work needs review.</p><p><a href="${adminUrl}">Open the protected billing health page</a>.</p><p>This alert concerns application processing or email delivery. It does not mean a new customer charge failed. Automatic recovery will continue where safe.</p>`,
    idempotencyKey: deliveryId,
  });
  await db.insert(auditLogs).values({
    id: deliveryId, actorEmail: "system", action: "billing.health_alert.sent",
    targetType: "billing", targetId: "operations", createdAt: now,
    afterJson: JSON.stringify({ counts: health.counts }),
  }).onConflictDoNothing();
  return "sent";
}

export async function lastBillingHealthAlert() {
  const db = await getDb();
  const [row] = await db.select({ createdAt: auditLogs.createdAt }).from(auditLogs)
    .where(eq(auditLogs.action, "billing.health_alert.sent"))
    .orderBy(desc(auditLogs.createdAt)).limit(1);
  return row?.createdAt ?? null;
}

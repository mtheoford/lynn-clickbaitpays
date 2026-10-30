import { and, asc, eq, inArray, isNotNull, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db";
import {
  auditLogs,
  customerSessions,
  magicLinkTokens,
  sites,
  stripeEvents,
  subscriptions,
  users,
} from "@/db/schema";
import {
  gracePeriodEnd,
  graceHasExpired,
  siteStatusForSubscription,
  subscriptionPeriodEnd,
} from "@/lib/billing-lifecycle";
import {
  deliverCheckoutReminderForSite,
  deliverDueCheckoutReminders,
  deliverWelcomeEmailForSite,
  deliverDueWelcomeEmails,
  refreshWelcomeEmailStatuses,
  enqueueWelcomeEmail,
} from "@/lib/email";
import { getRuntimeEnv, type BillingQueueMessage } from "@/lib/runtime";
import { getStripe, type BillingPlan } from "@/lib/stripe";
import { purgeExpiredCheckoutReservations } from "@/lib/checkout-cleanup";
import { billingLocale } from "@/lib/checkout-localization";
import { signupAnalyticsContextFromMetadata, signupLifecycleAnalyticsEvent, isSignupAnalyticsPlan } from "@/lib/signup-page-analytics";
import { recordSignupServerEvent } from "@/lib/signup-analytics-server";
import { startBillingRecovery, closeBillingRecovery, deliverDueBillingRecoveryNotices, seedMissingBillingRecovery } from "@/lib/billing-recovery";
import { invoiceSubscriptionId } from "@/lib/billing-recovery-policy";
import { sendBillingHealthAlert } from "@/lib/billing-health";
import {
  assertBillingLease, billingLeaseCondition, billingRetryDelayMs, eventClaimCondition,
  BILLING_LEASE_MS, MAX_BILLING_EVENT_ATTEMPTS, BillingResourceBusyError,
  withBillingResourceLease, type BillingLease, type EventClaim,
} from "@/lib/billing-work-lease";

function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function settledCheckout(session: Stripe.Checkout.Session): boolean {
  return session.status === "complete" && (session.payment_status === "paid" ||
    (session.payment_status === "no_payment_required" && session.amount_total === 0));
}

// The Stripe account also serves the independent Shift funnel. Only its
// explicit namespace is excluded; legacy CBP events still run every existing
// reservation and provisioning check when application metadata is absent.
function isShiftFunnelEvent(event: Stripe.Event): boolean {
  const object = event.data.object as {
    metadata?: { app?: string } | null;
    parent?: { subscription_details?: { metadata?: { app?: string } | null } | null } | null;
    subscription_details?: { metadata?: { app?: string } | null } | null;
  };
  if (event.type.startsWith("checkout.session.") || event.type.startsWith("customer.subscription.")) {
    return object.metadata?.app === "shift-funnel";
  }
  if (event.type.startsWith("invoice.")) {
    return object.metadata?.app === "shift-funnel" ||
      object.parent?.subscription_details?.metadata?.app === "shift-funnel" ||
      object.subscription_details?.metadata?.app === "shift-funnel";
  }
  return false;
}

export async function registerStripeEvent(event: Stripe.Event): Promise<{
  duplicate: boolean;
  queued: boolean;
  ignored?: boolean;
}> {
  if (isShiftFunnelEvent(event)) return { duplicate: false, queued: false, ignored: true };
  const db = await getDb();
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
    .onConflictDoNothing();

  // A duplicate delivery must never reset a worker's lease or replace evidence.
  const [existing] = await db.select({ status: stripeEvents.status })
    .from(stripeEvents).where(eq(stripeEvents.id, event.id)).limit(1);
  if (existing?.status === "completed") return { duplicate: true, queued: false };

  // Signed payment evidence is visible even if the later provisioning job stops.
  // This only records evidence; publication still requires current Stripe state.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const siteId = session.metadata?.siteId ?? session.client_reference_id;
    const userId = session.metadata?.userId;
    if (siteId && userId && settledCheckout(session)) {
      const completedAt = Number.isFinite(event.created) && event.created > 0 ? event.created * 1000 : now.getTime();
      await db.update(sites).set({ checkoutPaymentStatus: session.payment_status,
        checkoutCompletedAt: sql`COALESCE(${sites.checkoutCompletedAt}, ${completedAt})` })
        .where(and(eq(sites.id, siteId), eq(sites.userId, userId),
          eq(sites.stripeCheckoutSessionId, session.id), ne(sites.status, "deleted"),
          sql`NOT EXISTS (SELECT 1 FROM ${subscriptions} WHERE ${subscriptions.siteId} = ${sites.id})`));
    }
  }

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
      if (message.body.type === "welcome_email") {
        await deliverWelcomeEmailForSite(
          message.body.siteId,
          message.body.deliveryId,
          message.body.locale,
        );
      } else if (message.body.type === "checkout_reminder") {
        await deliverCheckoutReminderForSite(
          message.body.siteId,
          message.body.deliveryId,
          message.body.locale,
        );
      } else {
        await processStripeEvent(message.body.stripeEventId);
      }
      message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "billing queue message failed",
          jobType: message.body.type ?? "stripe_event",
          jobId:
            message.body.type === "welcome_email" ||
            message.body.type === "checkout_reminder"
              ? message.body.siteId
              : message.body.stripeEventId,
          error: error instanceof Error ? error.message : "Unknown queue failure",
        }),
      );
      message.retry();
    }
  }
}

function recoverableEvent(now: Date) {
  return and(lt(stripeEvents.attempts, MAX_BILLING_EVENT_ATTEMPTS), or(
    and(inArray(stripeEvents.status, ["pending", "failed"]),
      or(isNull(stripeEvents.nextAttemptAt), lte(stripeEvents.nextAttemptAt, now))),
    and(eq(stripeEvents.status, "processing"), or(lte(stripeEvents.leaseExpiresAt, now),
      and(isNull(stripeEvents.leaseExpiresAt), lte(stripeEvents.receivedAt, new Date(now.getTime() - BILLING_LEASE_MS))))),
  ));
}

export type StripeProcessingResult = "completed" | "skipped" | "deferred";

export async function processStripeEvent(eventId: string, now = new Date()): Promise<StripeProcessingResult> {
  const db = await getDb();
  const attemptedAt = new Date();
  const claim: EventClaim = { id: eventId, token: crypto.randomUUID() };
  const [record] = await db
    .update(stripeEvents)
    .set({
      status: "processing",
      attempts: sql`${stripeEvents.attempts} + 1`,
      lastError: null,
      processingToken: claim.token,
      leaseExpiresAt: new Date(attemptedAt.getTime() + BILLING_LEASE_MS),
      lastAttemptAt: attemptedAt,
      nextAttemptAt: null,
    })
    .where(and(eq(stripeEvents.id, eventId), recoverableEvent(now)))
    .returning();
  if (!record) return "skipped";
  const stillOwned = and(eq(stripeEvents.id, eventId), eq(stripeEvents.processingToken, claim.token));

  try {
    const event = JSON.parse(record.payloadJson) as Stripe.Event;
    await applyStripeEvent(event, claim);
    const completed = await db
      .update(stripeEvents)
      .set({ status: "completed", processedAt: new Date(), lastError: null,
        processingToken: null, leaseExpiresAt: null, nextAttemptAt: null })
      .where(stillOwned).returning({ id: stripeEvents.id });
    return completed.length ? "completed" : "deferred";
  } catch (error) {
    if (error instanceof BillingResourceBusyError) {
      await db.update(stripeEvents).set({ status: "pending", attempts: sql`${stripeEvents.attempts} - 1`,
        processingToken: null, leaseExpiresAt: null, nextAttemptAt: new Date(Date.now() + 60_000) }).where(stillOwned);
      return "deferred";
    }
    const message = error instanceof Error ? error.message : "Unknown Stripe event failure";
    await db
      .update(stripeEvents)
      .set({ status: "failed", lastError: message.slice(0, 1000), processingToken: null, leaseExpiresAt: null,
        nextAttemptAt: record.attempts < MAX_BILLING_EVENT_ATTEMPTS
          ? new Date(Date.now() + billingRetryDelayMs(record.attempts)) : null })
      .where(stillOwned);
    throw error;
  }
}

async function applyStripeEvent(event: Stripe.Event, claim: EventClaim): Promise<void> {
  // Also acknowledge Shift events that were queued before the namespace filter.
  if (isShiftFunnelEvent(event)) return;
  await trackStripeSignupLifecycle(event);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await applyCompletedCheckout(event.data.object, claim);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (subscriptionId) {
      await withBillingResourceLease(`subscription:${subscriptionId}`, claim, async lease => {
        const stripe = await getStripe();
        const current = await stripe.subscriptions.retrieve(subscriptionId);
        if (current.metadata?.app === "shift-funnel") return;
        await applySubscription(current, lease);
        await assertBillingLease(lease);
        if (event.type === "invoice.payment_failed") await startBillingRecovery(invoice, current);
        if (event.type === "invoice.paid") await closeBillingRecovery(invoice.id);
      });
    } else if (event.type === "invoice.paid") {
      const customerId = stripeId(invoice.customer);
      if (customerId) await reconcileCustomer(customerId, claim);
      await closeBillingRecovery(invoice.id);
    }
    return;
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await withBillingResourceLease(`subscription:${event.data.object.id}`, claim, async lease => {
      const stripe = await getStripe();
      const current = await stripe.subscriptions.retrieve(event.data.object.id);
      await applySubscription(current, lease);
    });
    return;
  }

  if (event.type === "checkout.session.expired") {
    const siteId = event.data.object.metadata?.siteId ?? event.data.object.client_reference_id;
    if (!siteId) return;
    const db = await getDb();
    await db
      .update(sites)
      .set({ reservationExpiresAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(sites.id, siteId),
          eq(sites.status, "pending"),
          eq(sites.stripeCheckoutSessionId, event.data.object.id),
          eventClaimCondition(claim),
        ),
      );
  }
}

async function originalGraceDeadline(subscription: Stripe.Subscription, prior: Date | null, customerId: string): Promise<Date> {
  if (prior) return prior;
  // Replaying an old failure must not restart the seven-day grace period.
  // The current subscription's outstanding invoice supplies the original date.
  const latestInvoiceId = stripeId(subscription.latest_invoice);
  if (!latestInvoiceId) throw new Error("The original overdue invoice deadline could not be verified.");
  const stripe = await getStripe();
  const invoice = await stripe.invoices.retrieve(latestInvoiceId);
  const failureAnchor = invoice.status_transitions?.finalized_at ?? invoice.created;
  if (invoiceSubscriptionId(invoice) !== subscription.id || stripeId(invoice.customer) !== customerId ||
    invoice.status !== "open" || invoice.amount_remaining <= 0 || !Number.isFinite(failureAnchor) || failureAnchor <= 0) {
    throw new Error("The original overdue invoice deadline could not be verified.");
  }
  return gracePeriodEnd(new Date(failureAnchor * 1000));
}

async function applyCompletedCheckout(session: Stripe.Checkout.Session, claim?: EventClaim): Promise<boolean> {
  // Completion alone is insufficient for delayed payment methods. Zero-dollar
  // checkouts remain supported for existing promotion codes/trials.
  if (!settledCheckout(session)) return false;
  const siteId = session.metadata?.siteId ?? session.client_reference_id;
  const userId = session.metadata?.userId;
  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);
  const plan: BillingPlan = session.metadata?.plan === "annual" ? "annual" : "monthly";
  const locale = billingLocale(session.metadata?.locale);
  if (!siteId || !userId || !customerId || !subscriptionId) {
    throw new Error("Completed Checkout session is missing provisioning metadata.");
  }
  if (session.metadata?.app === "shift-funnel") return false;

  return withBillingResourceLease(`subscription:${subscriptionId}`, claim, async lease => {
    const stripe = await getStripe();
    const remote = await stripe.subscriptions.retrieve(subscriptionId);
    if (remote.metadata?.app === "shift-funnel") return false;
    if (stripeId(remote.customer) !== customerId ||
      (remote.metadata?.siteId && remote.metadata.siteId !== siteId) ||
      (remote.metadata?.userId && remote.metadata.userId !== userId)) {
      throw new Error("Checkout and subscription identities do not match.");
    }
    const now = new Date();
    const db = await getDb();
    const [reservation] = await db.select({ id: sites.id, status: sites.status, deletionScheduledAt: sites.deletionScheduledAt })
      .from(sites).where(and(eq(sites.id, siteId), eq(sites.userId, userId), eq(sites.stripeCheckoutSessionId, session.id))).limit(1);
    if (!reservation) throw new Error("Completed Checkout session does not match the current site reservation.");
    // A replay must never restore a deleted account or cancel a scheduled deletion.
    if (reservation.status === "deleted" || reservation.deletionScheduledAt) return false;
    const linked = await db.select().from(subscriptions)
      .where(or(eq(subscriptions.siteId, siteId), eq(subscriptions.stripeSubscriptionId, subscriptionId))).limit(3);
    if (linked.some(row => row.siteId !== siteId || row.stripeSubscriptionId !== subscriptionId)) {
      throw new Error("Checkout subscription is already linked to a different site or subscription.");
    }
    const existing = linked[0];
    const currentPeriodEnd = subscriptionPeriodEnd(remote);
    const billingStatus = siteStatusForSubscription(remote.status, currentPeriodEnd, now);
    const graceEndsAt = billingStatus === "past_due"
      ? await originalGraceDeadline(remote, existing?.graceEndsAt ?? null, customerId) : null;
    const effectiveBillingStatus = billingStatus === "past_due" && graceHasExpired(graceEndsAt, now) ? "suspended" : billingStatus;
    const writableSite = () => and(eq(sites.id, siteId), eq(sites.userId, userId),
      eq(sites.stripeCheckoutSessionId, session.id), ne(sites.status, "deleted"),
      isNull(sites.deletionScheduledAt), billingLeaseCondition(lease));
    const siteStillWritable = () => sql`EXISTS (SELECT 1 FROM ${sites} WHERE ${writableSite()})`;

    await assertBillingLease(lease);
    await db.update(users).set({ stripeCustomerId: customerId, updatedAt: now })
      .where(and(eq(users.id, userId), siteStillWritable()));
    // INSERT ... SELECT keeps the lease/tombstone checks in the same SQL statement
    // as the write. A check made before an awaited query is not a fencing guard.
    if (existing) {
      await db.update(subscriptions).set({ stripeCustomerId: customerId, plan, status: remote.status,
        cancelAtPeriodEnd: remote.cancel_at_period_end, currentPeriodEnd, graceEndsAt, updatedAt: now })
        .where(and(eq(subscriptions.id, existing.id), siteStillWritable()));
    } else {
      await db.run(sql`INSERT INTO subscriptions
        (id,user_id,site_id,stripe_customer_id,stripe_subscription_id,plan,status,cancel_at_period_end,current_period_end,grace_ends_at,created_at,updated_at)
        SELECT ${crypto.randomUUID()},${userId},${siteId},${customerId},${subscriptionId},${plan},${remote.status},${remote.cancel_at_period_end ? 1 : 0},${currentPeriodEnd?.getTime() ?? null},${graceEndsAt?.getTime() ?? null},${now.getTime()},${now.getTime()}
        WHERE ${siteStillWritable()}
        ON CONFLICT(stripe_subscription_id) DO NOTHING`);
    }
    const [updated] = await db.update(sites).set({
      status: sql`COALESCE(${sites.publicationOverride}, ${effectiveBillingStatus})`,
      publishedAt: sql`CASE WHEN COALESCE(${sites.publicationOverride}, ${effectiveBillingStatus}) = 'active'
        THEN COALESCE(${sites.publishedAt}, ${now.getTime()}) ELSE ${sites.publishedAt} END`,
      reservationExpiresAt: null, checkoutPaymentStatus: session.payment_status,
      checkoutCompletedAt: sql`COALESCE(${sites.checkoutCompletedAt}, ${now.getTime()})`,
      checkoutLastCheckedAt: now, checkoutNextCheckAt: null, checkoutRecoveryError: null, updatedAt: now,
    }).where(writableSite()).returning({ status: sites.status });
    await assertBillingLease(lease);
    if (!updated) return false;
    if (updated.status === "active") {
      const analyticsContext = signupAnalyticsContextFromMetadata(session.metadata);
      if (analyticsContext) await recordSignupServerEvent({ eventType: "site_activated", dedupeKey: siteId,
        context: analyticsContext, plan, source: session.metadata?.sourceSlug || null, createdAt: now });
      await assertBillingLease(lease);
      await enqueueWelcomeEmail(siteId, `welcome-${siteId}`, locale);
    }
    return updated.status === "active";
  });
}

async function reconcileCustomer(customerId: string, claim: EventClaim): Promise<void> {
  const db = await getDb();
  const linked = await db.select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId));
  for (const item of linked) {
    await withBillingResourceLease(`subscription:${item.stripeSubscriptionId}`, claim, async lease => {
      const stripe = await getStripe();
      await applySubscription(await stripe.subscriptions.retrieve(item.stripeSubscriptionId), lease);
    });
  }
}

async function applySubscription(subscription: Stripe.Subscription, lease: BillingLease): Promise<void> {
  if (subscription.metadata?.app === "shift-funnel") return;
  const db = await getDb();
  const [local] = await db.select({ siteId: subscriptions.siteId, siteStatus: sites.status,
    graceEndsAt: subscriptions.graceEndsAt, customerId: subscriptions.stripeCustomerId })
    .from(subscriptions).innerJoin(sites, eq(sites.id, subscriptions.siteId))
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1);
  if (!local) return;
  if (stripeId(subscription.customer) !== local.customerId) throw new Error("Subscription customer identity changed.");
  const now = new Date();
  const currentPeriodEnd = subscriptionPeriodEnd(subscription);
  const billingStatus = siteStatusForSubscription(subscription.status, currentPeriodEnd, now);
  const graceEndsAt = billingStatus === "past_due"
    ? await originalGraceDeadline(subscription, local.graceEndsAt, local.customerId) : null;
  const effectiveStatus = billingStatus === "past_due" && graceHasExpired(graceEndsAt, now) ? "suspended" : billingStatus;
  await assertBillingLease(lease);
  await db.update(subscriptions).set({ status: subscription.status, cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd, graceEndsAt, updatedAt: now })
    .where(and(eq(subscriptions.stripeSubscriptionId, subscription.id), billingLeaseCondition(lease)));
  const [updated] = await db.update(sites).set({
    status: sql`COALESCE(${sites.publicationOverride}, ${effectiveStatus})`,
    publishedAt: sql`CASE WHEN COALESCE(${sites.publicationOverride}, ${effectiveStatus}) = 'active'
      THEN COALESCE(${sites.publishedAt}, ${now.getTime()}) ELSE ${sites.publishedAt} END`,
    updatedAt: now,
  }).where(and(eq(sites.id, local.siteId), ne(sites.status, "deleted"), isNull(sites.deletionScheduledAt),
    billingLeaseCondition(lease))).returning({ status: sites.status });
  await assertBillingLease(lease);
  if (updated?.status === "active" && local.siteStatus !== "active") {
    const analyticsContext = signupAnalyticsContextFromMetadata(subscription.metadata);
    if (analyticsContext) await recordSignupServerEvent({ eventType: "site_activated", dedupeKey: local.siteId,
      context: analyticsContext, plan: isSignupAnalyticsPlan(subscription.metadata.plan) ? subscription.metadata.plan : null,
      source: subscription.metadata.sourceSlug || null, createdAt: now });
  }
}

export type BillingRecoverySummary = {
  eventsAttempted: number; eventsCompleted: number; eventsFailed: number; eventsDeferred: number;
  checkoutsChecked: number; checkoutsRecovered: number; checkoutsFailed: number;
};

/** Bounded recovery is independent of Queue redelivery and cannot create charges. */
export async function recoverBillingWork({ now = new Date(), limit = 10 }: { now?: Date; limit?: number } = {}): Promise<BillingRecoverySummary> {
  const bound = Math.max(0, Math.min(10, Math.floor(limit)));
  const summary: BillingRecoverySummary = { eventsAttempted: 0, eventsCompleted: 0, eventsFailed: 0, eventsDeferred: 0,
    checkoutsChecked: 0, checkoutsRecovered: 0, checkoutsFailed: 0 };
  if (!bound) return summary;
  const db = await getDb();
  const candidates = await db.select({ id: stripeEvents.id }).from(stripeEvents)
    .where(recoverableEvent(now)).orderBy(asc(stripeEvents.receivedAt), asc(stripeEvents.id)).limit(bound);
  for (const candidate of candidates) {
    summary.eventsAttempted++;
    try {
      const outcome = await processStripeEvent(candidate.id, now);
      if (outcome === "completed") summary.eventsCompleted++;
      else summary.eventsDeferred++;
    } catch { summary.eventsFailed++; }
  }

  // Rotate through old reservations fairly; unpaid/temporarily unavailable sessions
  // cannot monopolize every run. Lock the session scan as well as its subscription.
  const pending = await db.select({ id: sites.id, userId: sites.userId, sessionId: sites.stripeCheckoutSessionId,
    createdAt: sites.createdAt, paymentStatus: sites.checkoutPaymentStatus })
    .from(sites).where(and(eq(sites.status, "pending"), eq(sites.isDemo, false), isNull(sites.deletionScheduledAt),
      isNotNull(sites.stripeCheckoutSessionId), or(isNull(sites.checkoutNextCheckAt), lte(sites.checkoutNextCheckAt, now))))
    .orderBy(asc(sites.checkoutLastCheckedAt), asc(sites.createdAt), asc(sites.id)).limit(bound);
  for (const candidate of pending) {
    try {
      await withBillingResourceLease(`checkout:${candidate.sessionId}`, undefined, async lease => {
        summary.checkoutsChecked++;
        const recentOrPaid = now.getTime() - candidate.createdAt.getTime() < 24 * 60 * 60 * 1000 || candidate.paymentStatus === "paid" || candidate.paymentStatus === "no_payment_required";
        const nextCheck = new Date(now.getTime() + (recentOrPaid ? 15 : 60) * 60 * 1000);
        const writable = () => and(eq(sites.id, candidate.id), eq(sites.userId, candidate.userId),
          eq(sites.stripeCheckoutSessionId, candidate.sessionId!), eq(sites.status, "pending"),
          isNull(sites.deletionScheduledAt), billingLeaseCondition(lease));
        // Persist polling backoff before network work, including interrupted scans.
        await db.update(sites).set({ checkoutLastCheckedAt: now, checkoutNextCheckAt: nextCheck }).where(writable());
        try {
          const stripe = await getStripe();
          const session = await stripe.checkout.sessions.retrieve(candidate.sessionId!);
          if ((session.metadata?.siteId ?? session.client_reference_id) !== candidate.id || session.metadata?.userId !== candidate.userId || session.metadata?.app === "shift-funnel") {
            throw new Error("Checkout reconciliation identity does not match the reserved site.");
          }
          await db.update(sites).set({ checkoutPaymentStatus: session.payment_status, checkoutRecoveryError: null,
            ...(settledCheckout(session) ? { checkoutCompletedAt: sql`COALESCE(${sites.checkoutCompletedAt}, ${now.getTime()})`,
              checkoutNextCheckAt: new Date(now.getTime() + 15 * 60 * 1000) } : {}),
          }).where(writable());
          await assertBillingLease(lease);
          if (settledCheckout(session)) {
            if (await applyCompletedCheckout(session)) summary.checkoutsRecovered++;
          }
        } catch (error) {
          if (!(error instanceof BillingResourceBusyError)) {
            summary.checkoutsFailed++;
            await db.update(sites).set({ checkoutRecoveryError: (error instanceof Error ? error.message : "Checkout recovery failed").slice(0, 500) }).where(writable());
          }
        }
      });
    } catch (error) {
      if (!(error instanceof BillingResourceBusyError)) summary.checkoutsFailed++;
    }
  }
  return summary;
}

async function billingMaintenanceStep(name: string, work: () => Promise<unknown>): Promise<void> {
  try { await work(); }
  catch (error) {
    console.error(JSON.stringify({ message: "billing maintenance step failed", step: name,
      error: error instanceof Error ? error.message : "Unknown maintenance failure" }));
  }
}

export async function enforceScheduledBillingState(now = new Date()): Promise<void> {
  // Each section can fail independently. In particular, reservation cleanup and
  // email failures must not prevent paid account recovery or operational alerts.
  await billingMaintenanceStep("recover_billing_work", () => recoverBillingWork({ now }));
  await billingMaintenanceStep("checkout_cleanup", () => purgeExpiredCheckoutReservations(now));
  await billingMaintenanceStep("checkout_reminders", () => deliverDueCheckoutReminders(now));
  await billingMaintenanceStep("expired_sessions", async () => {
    const db = await getDb();
    await db.delete(customerSessions).where(lte(customerSessions.expiresAt, now));
    await db.delete(magicLinkTokens).where(lte(magicLinkTokens.expiresAt, now));
  });
  await billingMaintenanceStep("billing_expiration", async () => {
    const db = await getDb();
    // Check current local billing state inside the mutation, so a concurrent paid
    // webhook cannot be undone by a stale list captured at the start of this cron.
    await db.update(sites).set({ status: sql`COALESCE(${sites.publicationOverride}, 'suspended')`, updatedAt: now })
      .where(and(ne(sites.status, "deleted"), isNull(sites.deletionScheduledAt), sql`EXISTS (
        SELECT 1 FROM ${subscriptions} WHERE ${subscriptions.siteId} = ${sites.id}
          AND ${subscriptions.status} IN ('past_due','unpaid') AND ${subscriptions.graceEndsAt} <= ${now.getTime()})`));
    await db.update(sites).set({ status: sql`COALESCE(${sites.publicationOverride}, 'canceled')`, updatedAt: now })
      .where(and(ne(sites.status, "deleted"), isNull(sites.deletionScheduledAt), sql`EXISTS (
        SELECT 1 FROM ${subscriptions} WHERE ${subscriptions.siteId} = ${sites.id}
          AND ${subscriptions.status} = 'canceled' AND ${subscriptions.currentPeriodEnd} <= ${now.getTime()})`));
  });
  await billingMaintenanceStep("seed_payment_recovery", () => seedMissingBillingRecovery());
  await billingMaintenanceStep("payment_recovery_notices", () => deliverDueBillingRecoveryNotices(now));
  await billingMaintenanceStep("welcome_delivery", () => deliverDueWelcomeEmails(now));
  await billingMaintenanceStep("welcome_delivery_status", () => refreshWelcomeEmailStatuses(now));
  await billingMaintenanceStep("scheduled_deletions", () => purgeScheduledAccountData(now));
  await billingMaintenanceStep("billing_health_alert", () => sendBillingHealthAlert(now));
}

export async function purgeScheduledAccountData(now = new Date()): Promise<void> {
  const db = await getDb();
  const due = await db
    .select({ siteId: sites.id, userId: sites.userId })
    .from(sites)
    .where(lte(sites.deletionScheduledAt, now));

  for (const item of due) {
    const billingRecords = await db
      .select({
        stripeCustomerId: subscriptions.stripeCustomerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.siteId, item.siteId));

    const stripeIdentifiers = new Set(
      billingRecords.flatMap((record) => [
        record.stripeCustomerId,
        record.stripeSubscriptionId,
      ]),
    );
    for (const identifier of stripeIdentifiers) {
      await db
        .delete(stripeEvents)
        .where(sql`instr(${stripeEvents.payloadJson}, ${identifier}) > 0`);
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorEmail: "system",
      action: "site.data_deletion.completed",
      targetType: "site",
      targetId: item.siteId,
      beforeJson: JSON.stringify({ deletionScheduled: true }),
      afterJson: JSON.stringify({
        siteRemoved: true,
        customerRemovedWhenNoSitesRemain: true,
        retainedRecords: ["stripe_financial_records", "non_personal_audit_log"],
      }),
      createdAt: now,
    });

    await db.delete(sites).where(eq(sites.id, item.siteId));
    const [remainingSite] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.userId, item.userId))
      .limit(1);
    if (!remainingSite) {
      await db.delete(users).where(eq(users.id, item.userId));
    }
  }
}


/** Analytics observes payment facts independently of provisioning/retry success. */
async function trackStripeSignupLifecycle(event: Stripe.Event): Promise<void> {
  try {
    const analyticsEvent = signupLifecycleAnalyticsEvent(event);
    if (analyticsEvent) await recordSignupServerEvent(analyticsEvent);
  } catch {
    console.error(JSON.stringify({ message: "signup lifecycle analytics unavailable", eventType: event.type }));
  }
}

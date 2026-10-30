import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lte, ne, or } from "drizzle-orm";
import { getDb } from "@/db";
import { sites, subscriptions, users, welcomeEmailDeliveries } from "@/db/schema";
import { billingLocale, localizedPublicUrl } from "@/lib/checkout-localization";
import { localizedPath, type SiteLocale } from "@/lib/i18n";
import { getRuntimeEnv, runtimeValue } from "@/lib/runtime";
import { siteUrl } from "@/lib/site-config";
import { getStripe } from "@/lib/stripe";
import { buildWelcomeEmail } from "@/lib/welcome-email";
import { retrieveEmailDeliveryEvent, sendTransactionalEmail, TransactionalEmailError, type TransactionalEmailInput } from "@/lib/transactional-email";
import { WELCOME_SEND_LEASE_MS, WELCOME_STATUS_POLL_MS, WELCOME_STATUS_WINDOW_MS, welcomeRetryDelayMs, welcomeSendNeedsReview, welcomeStatusForProviderEvent } from "@/lib/welcome-delivery-policy";

type Delivery = typeof welcomeEmailDeliveries.$inferSelect;
const SENDABLE = ["pending", "sending", "failed"] as const;

async function ensureWelcomeDelivery(siteId: string, deliveryId: string, locale?: SiteLocale): Promise<Delivery> {
  const db = await getDb();
  const [existing] = await db.select().from(welcomeEmailDeliveries).where(eq(welcomeEmailDeliveries.id, deliveryId)).limit(1);
  if (existing) {
    if (existing.siteId !== siteId) throw new Error("welcome_delivery_site_mismatch");
    return existing;
  }
  // An administrator may have already recovered a missing initial email using
  // a fresh delivery ID. Automatic checkout replay must reuse that record.
  if (deliveryId === `welcome-${siteId}`) {
    const [prior] = await db.select().from(welcomeEmailDeliveries)
      .where(eq(welcomeEmailDeliveries.siteId, siteId)).orderBy(desc(welcomeEmailDeliveries.createdAt)).limit(1);
    if (prior) return prior;
  }
  const [account] = await db.select({ email: users.email, name: users.name, slug: sites.slug,
    status: sites.status, publicationOverride: sites.publicationOverride, sessionId: sites.stripeCheckoutSessionId })
    .from(sites).innerJoin(users, eq(users.id, sites.userId)).where(eq(sites.id, siteId)).limit(1);
  if (!account) throw new Error("welcome_site_not_found");
  let effectiveLocale = locale;
  if (!effectiveLocale && account.sessionId) {
    try { effectiveLocale = billingLocale((await (await getStripe()).checkout.sessions.retrieve(account.sessionId)).metadata?.locale); }
    catch { effectiveLocale = "en"; }
  }
  effectiveLocale = billingLocale(effectiveLocale);
  const [configuredUrl, configuredSupport, from] = await Promise.all([
    runtimeValue("NEXT_PUBLIC_MARKETING_URL"), runtimeValue("NEXT_PUBLIC_SUPPORT_EMAIL"), runtimeValue("EMAIL_FROM"),
  ]);
  const content = buildWelcomeEmail({ name: account.name,
    publicUrl: localizedPublicUrl(siteUrl(account.slug), effectiveLocale),
    manageUrl: new URL(localizedPath(effectiveLocale, "/manage"), configuredUrl || "https://cbp.proneurs.org").toString(),
    supportEmail: configuredSupport || "support@proneurs.org", locale: effectiveLocale,
  });
  const now = new Date();
  const publishable = ["active", "past_due"].includes(account.status) && !account.publicationOverride;
  // Freeze the full request. Reusing a key with changed account details would
  // violate the provider's idempotency contract and may address the wrong person.
  const payload: TransactionalEmailInput = { to: account.email, ...content, from, idempotencyKey: deliveryId };
  await db.insert(welcomeEmailDeliveries).values({ id: deliveryId, siteId, locale: effectiveLocale,
    status: publishable ? "pending" : "canceled", payloadJson: JSON.stringify(payload),
    nextAttemptAt: now, lastError: publishable ? null : "site_unavailable", createdAt: now, updatedAt: now,
  }).onConflictDoNothing();
  const [record] = await db.select().from(welcomeEmailDeliveries).where(eq(welcomeEmailDeliveries.id, deliveryId)).limit(1);
  if (!record || record.siteId !== siteId) throw new Error("welcome_delivery_site_mismatch");
  return record;
}

/** Persist before enqueueing; cron recovers a failed queue publish. */
export async function enqueueWelcomeEmail(siteId: string, deliveryId = `welcome-${siteId}-${crypto.randomUUID()}`, locale?: SiteLocale): Promise<"queued" | "sent" | "recorded"> {
  const record = await ensureWelcomeDelivery(siteId, deliveryId, locale);
  if (record.status === "accepted" || record.status === "delivered") return "sent";
  if (!SENDABLE.includes(record.status as typeof SENDABLE[number])) return "recorded";
  const env = await getRuntimeEnv();
  if (env.BILLING_QUEUE) {
    await env.BILLING_QUEUE.send({ type: "welcome_email", siteId, deliveryId: record.id, locale: record.locale });
    return "queued";
  }
  await processWelcomeDelivery(record.id);
  return "sent";
}

export async function deliverWelcomeEmailForSite(siteId: string, deliveryId = `welcome-${siteId}`, locale?: SiteLocale): Promise<void> {
  const record = await ensureWelcomeDelivery(siteId, deliveryId, locale);
  await processWelcomeDelivery(record.id);
}

export async function processWelcomeDelivery(deliveryId: string, now = new Date()): Promise<void> {
  const db = await getDb();
  const [record] = await db.select().from(welcomeEmailDeliveries).where(eq(welcomeEmailDeliveries.id, deliveryId)).limit(1);
  if (!record || !SENDABLE.includes(record.status as typeof SENDABLE[number])) return;
  // A scheduled selection cutoff can be old after earlier maintenance work.
  // Start each lease from the current time, retaining future test cutoffs.
  now = new Date(Math.max(now.getTime(), Date.now()));
  if (record.leaseExpiresAt && record.leaseExpiresAt > now) return;
  if (record.nextAttemptAt && record.nextAttemptAt > now && record.status !== "sending") return;
  const token = crypto.randomUUID();
  const [claimed] = await db.update(welcomeEmailDeliveries).set({ status: "sending", leaseToken: token,
    leaseExpiresAt: new Date(now.getTime() + WELCOME_SEND_LEASE_MS), updatedAt: now,
  }).where(and(eq(welcomeEmailDeliveries.id, deliveryId), inArray(welcomeEmailDeliveries.status, [...SENDABLE]),
    eq(welcomeEmailDeliveries.attempts, record.attempts),
    or(isNull(welcomeEmailDeliveries.leaseExpiresAt), lte(welcomeEmailDeliveries.leaseExpiresAt, now)),
  )).returning({ id: welcomeEmailDeliveries.id });
  if (!claimed) return;
  const owned = and(eq(welcomeEmailDeliveries.id, deliveryId), eq(welcomeEmailDeliveries.leaseToken, token));
  const finishWithoutSend = async (status: "needs_review" | "canceled", lastError: string) => {
    await db.update(welcomeEmailDeliveries).set({ status, lastError, leaseToken: null, leaseExpiresAt: null,
      nextAttemptAt: null, updatedAt: now }).where(owned);
  };
  if (welcomeSendNeedsReview(record.attempts, record.firstAttemptAt, now)) {
    await finishWithoutSend("needs_review", "automatic_send_limit_reached");
    return;
  }
  if (!record.payloadJson) { await finishWithoutSend("needs_review", "welcome_payload_unavailable"); return; }
  let payload: TransactionalEmailInput;
  try { payload = JSON.parse(record.payloadJson) as TransactionalEmailInput; }
  catch { await finishWithoutSend("needs_review", "welcome_payload_invalid"); return; }
  if (payload.idempotencyKey !== deliveryId || !payload.to || !payload.subject || !payload.html || !payload.text) {
    await finishWithoutSend("needs_review", "welcome_payload_invalid"); return;
  }
  const [account] = await db.select({ status: sites.status, publicationOverride: sites.publicationOverride, email: users.email })
    .from(sites).innerJoin(users, eq(users.id, sites.userId)).where(eq(sites.id, record.siteId)).limit(1);
  if (!account || !["active", "past_due"].includes(account.status) || account.publicationOverride) {
    await finishWithoutSend("canceled", "site_unavailable"); return;
  }
  if (account.email !== payload.to) { await finishWithoutSend("needs_review", "welcome_recipient_changed"); return; }
  const attempts = record.attempts + 1;
  const attemptAt = new Date(Math.max(now.getTime(), Date.now()));
  const [started] = await db.update(welcomeEmailDeliveries).set({ attempts, firstAttemptAt: record.firstAttemptAt ?? attemptAt,
    lastAttemptAt: attemptAt, lastError: null }).where(and(owned, gt(welcomeEmailDeliveries.leaseExpiresAt, attemptAt)))
    .returning({ id: welcomeEmailDeliveries.id });
  if (!started) return;
  try {
    const result = await sendTransactionalEmail(payload);
    await db.update(welcomeEmailDeliveries).set({ status: "accepted", providerMessageId: result.providerMessageId,
      providerEvent: "sent", acceptedAt: now, nextAttemptAt: null, leaseToken: null, leaseExpiresAt: null,
      lastError: result.providerMessageId ? null : "provider_message_id_unavailable", updatedAt: now,
    }).where(owned);
    console.info(JSON.stringify({ message: "welcome email accepted", deliveryId, providerMessageId: result.providerMessageId }));
  } catch (error) {
    const needsReview = error instanceof TransactionalEmailError && error.requiresReview || welcomeSendNeedsReview(attempts, record.firstAttemptAt ?? now, now);
    const lastError = error instanceof TransactionalEmailError ? error.code : "welcome_send_unconfirmed";
    await db.update(welcomeEmailDeliveries).set({ status: needsReview ? "needs_review" : "failed", lastError,
      nextAttemptAt: needsReview ? null : new Date(now.getTime() + welcomeRetryDelayMs(attempts)),
      leaseToken: null, leaseExpiresAt: null, updatedAt: now,
    }).where(owned);
    throw new Error(lastError);
  }
}

/** Recover a crash after activation but before the initial outbox insert. */
export async function seedMissingWelcomeDeliveries(limit = 10): Promise<number> {
  const db = await getDb();
  const rows = await db.selectDistinct({ siteId: sites.id }).from(sites)
    .innerJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .leftJoin(welcomeEmailDeliveries, eq(welcomeEmailDeliveries.siteId, sites.id))
    .where(and(isNull(welcomeEmailDeliveries.id), eq(sites.isDemo, false),
      inArray(sites.status, ["active", "past_due"]), or(
        inArray(subscriptions.status, ["active", "trialing", "past_due"]),
        and(eq(subscriptions.status, "canceled"), gt(subscriptions.currentPeriodEnd, new Date())),
      ),
      isNotNull(sites.publishedAt), isNull(sites.publicationOverride), isNull(sites.deletionScheduledAt)))
    .orderBy(asc(sites.publishedAt)).limit(Math.max(1, Math.min(limit, 10)));
  for (const row of rows) {
    try { await ensureWelcomeDelivery(row.siteId, `welcome-${row.siteId}`); }
    catch { console.error(JSON.stringify({ message: "welcome email outbox recovery failed", siteId: row.siteId })); }
  }
  return rows.length;
}

export async function deliverDueWelcomeEmails(now = new Date(), limit = 10): Promise<number> {
  await seedMissingWelcomeDeliveries(limit);
  const db = await getDb();
  const rows = await db.select({ id: welcomeEmailDeliveries.id }).from(welcomeEmailDeliveries)
    .where(or(
      and(inArray(welcomeEmailDeliveries.status, ["pending", "failed"]), or(isNull(welcomeEmailDeliveries.nextAttemptAt), lte(welcomeEmailDeliveries.nextAttemptAt, now))),
      and(eq(welcomeEmailDeliveries.status, "sending"), or(isNull(welcomeEmailDeliveries.leaseExpiresAt), lte(welcomeEmailDeliveries.leaseExpiresAt, now))),
    )).orderBy(asc(welcomeEmailDeliveries.createdAt)).limit(Math.max(1, Math.min(limit, 10)));
  for (const row of rows) {
    try { await processWelcomeDelivery(row.id); }
    catch { console.error(JSON.stringify({ message: "welcome email retry failed", deliveryId: row.id })); }
  }
  return rows.length;
}

/** Poll delivery separately: lack of read permission must never cause a resend. */
export async function refreshWelcomeEmailStatuses(now = new Date(), limit = 10): Promise<number> {
  const db = await getDb();
  const rows = await db.select().from(welcomeEmailDeliveries).where(and(
    eq(welcomeEmailDeliveries.status, "accepted"), isNotNull(welcomeEmailDeliveries.providerMessageId),
    gte(welcomeEmailDeliveries.acceptedAt, new Date(now.getTime() - WELCOME_STATUS_WINDOW_MS)), lte(welcomeEmailDeliveries.acceptedAt, now),
    or(isNull(welcomeEmailDeliveries.lastCheckedAt), and(
      lte(welcomeEmailDeliveries.lastCheckedAt, new Date(now.getTime() - WELCOME_STATUS_POLL_MS)),
      or(isNull(welcomeEmailDeliveries.lastError), ne(welcomeEmailDeliveries.lastError, "email_status_http_403"),
        lte(welcomeEmailDeliveries.lastCheckedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))),
    )),
  )).orderBy(asc(welcomeEmailDeliveries.lastCheckedAt)).limit(Math.max(1, Math.min(limit, 10)));
  let checked = 0;
  for (const row of rows) {
    // Record the polling attempt before I/O, so outages do not hammer the API.
    const [claimed] = await db.update(welcomeEmailDeliveries).set({ lastCheckedAt: now })
      .where(and(eq(welcomeEmailDeliveries.id, row.id), eq(welcomeEmailDeliveries.status, "accepted"),
        row.lastCheckedAt ? eq(welcomeEmailDeliveries.lastCheckedAt, row.lastCheckedAt) : isNull(welcomeEmailDeliveries.lastCheckedAt)))
      .returning({ id: welcomeEmailDeliveries.id });
    if (!claimed) continue;
    checked += 1;
    try {
      const event = await retrieveEmailDeliveryEvent(row.providerMessageId!);
      const status = welcomeStatusForProviderEvent(event);
      const knownEvents = new Set(["sent", "delivered", "delivery_delayed", "opened", "clicked", "bounced", "complained", "failed", "suppressed", "scheduled", "canceled"]);
      await db.update(welcomeEmailDeliveries).set({ status,
        providerEvent: event && knownEvents.has(event) ? event : "unknown",
        deliveredAt: status === "delivered" ? now : row.deliveredAt,
        lastError: status === "needs_review" ? "provider_delivery_failed" : null, updatedAt: now,
      }).where(and(eq(welcomeEmailDeliveries.id, row.id), eq(welcomeEmailDeliveries.status, "accepted")));
    } catch (error) {
      await db.update(welcomeEmailDeliveries).set({ lastError: error instanceof TransactionalEmailError ? error.code : "email_status_unavailable", updatedAt: now })
        .where(and(eq(welcomeEmailDeliveries.id, row.id), eq(welcomeEmailDeliveries.status, "accepted")));
    }
  }
  return checked;
}

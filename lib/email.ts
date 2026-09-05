import { and, eq, gt, isNotNull, isNull, lte, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, sites, subscriptions, users } from "@/db/schema";
import { buildCheckoutReminderEmail } from "@/lib/checkout-reminder-email";
import { localizedPath, type SiteLocale } from "@/lib/i18n";
import { getRuntimeEnv, runtimeValue } from "@/lib/runtime";
import { siteUrl } from "@/lib/site-config";
import { getStripe } from "@/lib/stripe";
import { buildWelcomeEmail } from "@/lib/welcome-email";
import { billingLocale, localizedPublicUrl } from "@/lib/checkout-localization";

const CHECKOUT_REMINDER_ACTION = "site.checkout_reminder.sent";
export const CHECKOUT_REMINDER_DELAY_SECONDS = 30 * 60;

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

function localizedPublicSiteUrl(slug: string, locale: SiteLocale): string {
  return localizedPublicUrl(siteUrl(slug), locale);
}

function localizedMarketingUrl(
  marketingUrl: string,
  pathname: string,
  locale: SiteLocale,
): string {
  return new URL(localizedPath(locale, pathname), marketingUrl).toString();
}

async function resolveWelcomeLocale(
  locale: SiteLocale | undefined,
  checkoutSessionId: string | null,
): Promise<SiteLocale> {
  if (locale && billingLocale(locale) === locale) return locale;
  if (!checkoutSessionId) return "en";

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    return billingLocale(session.metadata?.locale);
  } catch {
    // Legacy queue messages did not include a locale. Email delivery should
    // remain available even if the old Checkout session can no longer be read.
    return "en";
  }
}

export async function sendTransactionalEmail(input: EmailInput): Promise<void> {
  const [apiKey, from, appEnv] = await Promise.all([
    runtimeValue("RESEND_API_KEY"),
    runtimeValue("EMAIL_FROM"),
    runtimeValue("APP_ENV"),
  ]);

  if (!apiKey || !from) {
    if (!appEnv || appEnv === "local" || appEnv === "development") {
      console.info(`[email:${input.idempotencyKey}] ${input.subject} -> ${input.to}`);
      return;
    }
    throw new Error("Transactional email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Transactional email failed (${response.status}): ${detail}`);
  }
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
  publicUrl: string;
  manageUrl: string;
  siteId: string;
  deliveryId?: string;
  locale?: SiteLocale;
}) {
  const supportEmail =
    (await runtimeValue("NEXT_PUBLIC_SUPPORT_EMAIL")) || "support@proneurs.org";
  const content = buildWelcomeEmail({
    name: input.name,
    publicUrl: input.publicUrl,
    manageUrl: input.manageUrl,
    supportEmail,
    locale: input.locale,
  });
  await sendTransactionalEmail({
    to: input.email,
    subject: content.subject,
    idempotencyKey: input.deliveryId ?? `welcome-${input.siteId}`,
    text: content.text,
    html: content.html,
  });
}

export async function deliverWelcomeEmailForSite(
  siteId: string,
  deliveryId = `welcome-${siteId}`,
  locale?: SiteLocale,
): Promise<void> {
  const db = await getDb();
  const [account] = await db
    .select({
      email: users.email,
      name: users.name,
      slug: sites.slug,
      stripeCheckoutSessionId: sites.stripeCheckoutSessionId,
    })
    .from(users)
    .innerJoin(sites, eq(sites.userId, users.id))
    .where(and(eq(sites.id, siteId), ne(sites.status, "deleted")))
    .limit(1);
  if (!account) throw new Error("Welcome email account was not found.");

  const marketingUrl =
    (await runtimeValue("NEXT_PUBLIC_MARKETING_URL")) || "https://cbp.proneurs.org";
  const effectiveLocale = await resolveWelcomeLocale(
    locale,
    account.stripeCheckoutSessionId,
  );
  await sendWelcomeEmail({
    email: account.email,
    name: account.name,
    publicUrl: localizedPublicSiteUrl(account.slug, effectiveLocale),
    manageUrl: localizedMarketingUrl(marketingUrl, "/manage", effectiveLocale),
    siteId,
    deliveryId,
    locale: effectiveLocale,
  });
}

export async function enqueueWelcomeEmail(
  siteId: string,
  deliveryId = `welcome-${siteId}-${crypto.randomUUID()}`,
  locale?: SiteLocale,
): Promise<"queued" | "sent"> {
  const env = await getRuntimeEnv();
  if (env.BILLING_QUEUE) {
    await env.BILLING_QUEUE.send({
      type: "welcome_email",
      siteId,
      deliveryId,
      ...(locale ? { locale } : {}),
    });
    return "queued";
  }
  await deliverWelcomeEmailForSite(siteId, deliveryId, locale);
  return "sent";
}

export async function deliverCheckoutReminderForSite(
  siteId: string,
  deliveryId = `checkout-reminder-${siteId}`,
  locale?: SiteLocale,
): Promise<"sent" | "skipped"> {
  const db = await getDb();
  const [existingDelivery] = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(eq(auditLogs.id, deliveryId))
    .limit(1);
  if (existingDelivery) return "skipped";

  const [account] = await db
    .select({
      email: users.email,
      name: users.name,
      slug: sites.slug,
      stripeCheckoutSessionId: sites.stripeCheckoutSessionId,
    })
    .from(sites)
    .innerJoin(users, eq(users.id, sites.userId))
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .where(
      and(
        eq(sites.id, siteId),
        eq(sites.status, "pending"),
        isNull(subscriptions.id),
        isNotNull(sites.stripeCheckoutSessionId),
      ),
    )
    .limit(1);
  if (!account?.stripeCheckoutSessionId) return "skipped";

  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(
    account.stripeCheckoutSessionId,
  );
  if (session.status !== "open" || !session.url) return "skipped";
  const effectiveLocale =
    locale && billingLocale(locale) === locale
      ? locale
      : billingLocale(session.metadata?.locale);

  const [configuredSupportEmail, configuredMarketingUrl] = await Promise.all([
    runtimeValue("NEXT_PUBLIC_SUPPORT_EMAIL"),
    runtimeValue("NEXT_PUBLIC_MARKETING_URL"),
  ]);
  const supportEmail = configuredSupportEmail || "support@proneurs.org";
  const marketingUrl = configuredMarketingUrl || "https://cbp.proneurs.org";
  const content = buildCheckoutReminderEmail({
    name: account.name,
    siteAddress: localizedPublicSiteUrl(account.slug, effectiveLocale).replace(
      /^https?:\/\//,
      "",
    ),
    checkoutUrl: session.url,
    supportEmail,
    manageUrl: localizedMarketingUrl(
      marketingUrl,
      "/manage/sign-in",
      effectiveLocale,
    ),
    locale: effectiveLocale,
  });
  await sendTransactionalEmail({
    to: account.email,
    subject: content.subject,
    idempotencyKey: deliveryId,
    text: content.text,
    html: content.html,
  });

  await db
    .insert(auditLogs)
    .values({
      id: deliveryId,
      actorEmail: "system",
      action: CHECKOUT_REMINDER_ACTION,
      targetType: "site",
      targetId: siteId,
      afterJson: JSON.stringify({ delivered: true, locale: effectiveLocale }),
      createdAt: new Date(),
    })
    .onConflictDoNothing();
  return "sent";
}

export async function enqueueCheckoutReminder(
  siteId: string,
  deliveryId = `checkout-reminder-${siteId}`,
  locale?: SiteLocale,
): Promise<"queued" | "deferred_to_cron"> {
  const env = await getRuntimeEnv();
  if (!env.BILLING_QUEUE) return "deferred_to_cron";

  await env.BILLING_QUEUE.send(
    {
      type: "checkout_reminder",
      siteId,
      deliveryId,
      ...(locale ? { locale } : {}),
    },
    { delaySeconds: CHECKOUT_REMINDER_DELAY_SECONDS },
  );
  return "queued";
}

export async function deliverDueCheckoutReminders(now = new Date()): Promise<number> {
  const db = await getDb();
  const reminderCutoff = new Date(
    now.getTime() - CHECKOUT_REMINDER_DELAY_SECONDS * 1000,
  );
  const candidates = await db
    .select({ siteId: sites.id })
    .from(sites)
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .leftJoin(
      auditLogs,
      and(
        eq(auditLogs.action, CHECKOUT_REMINDER_ACTION),
        eq(auditLogs.targetType, "site"),
        eq(auditLogs.targetId, sites.id),
      ),
    )
    .where(
      and(
        eq(sites.status, "pending"),
        lte(sites.createdAt, reminderCutoff),
        gt(sites.reservationExpiresAt, now),
        isNotNull(sites.stripeCheckoutSessionId),
        isNull(subscriptions.id),
        isNull(auditLogs.id),
      ),
    )
    .limit(100);

  let delivered = 0;
  for (const candidate of candidates) {
    try {
      if ((await deliverCheckoutReminderForSite(candidate.siteId)) === "sent") {
        delivered += 1;
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "checkout reminder delivery failed",
          siteId: candidate.siteId,
          error: error instanceof Error ? error.message : "Unknown email failure",
        }),
      );
    }
  }
  return delivered;
}

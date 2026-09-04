import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites, users } from "@/db/schema";
import {
  generatedSponsorBio,
  normalizeSiteSlug,
  validateReferralUrl,
  validateSiteSlug,
} from "@/lib/site-config";
import {
  getStripe,
  isBillingConfigured,
  priceForPlan,
  type BillingPlan,
} from "@/lib/stripe";
import { isSameOriginMutation } from "@/lib/request-security";
import {
  checkoutReservationDecision,
  ownedReservationDecision,
} from "@/lib/checkout-reservation";
import { purgeExpiredCheckoutReservations } from "@/lib/checkout-cleanup";
import { resolveSiteIdentity } from "@/lib/site-identity";
import { enqueueCheckoutReminder } from "@/lib/email";

type CheckoutInput = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  displayNameType?: string;
  email?: string;
  phone?: string;
  slug?: string;
  referralUrl?: string;
  source?: string;
  plan?: string;
  acceptedTerms?: boolean;
  locale?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CheckoutErrorCode = "email_has_site" | "site_unavailable" | "checkout_processing";

function error(message: string, status = 400, code?: CheckoutErrorCode) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return error("Request origin could not be verified.", 403);
  if (!(await isBillingConfigured())) {
    return error(
      "Checkout is being connected now. Your information has not been submitted or saved.",
      503,
    );
  }

  let input: CheckoutInput;
  try {
    input = await request.json();
  } catch {
    return error("The signup details could not be read.");
  }

  const identityResult = resolveSiteIdentity(input);
  if (!identityResult.identity) return error(identityResult.error);
  const identity = identityResult.identity;
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";
  const slug = normalizeSiteSlug(identity.displayName);
  const referralUrl = input.referralUrl?.trim() ?? "";
  const sourceSlug = normalizeSiteSlug(input.source ?? "");
  const plan: BillingPlan = input.plan === "annual" ? "annual" : "monthly";
  const locale = input.locale === "fr" ? "fr" : "en";

  if (!EMAIL_PATTERN.test(email)) return error("Enter a valid email address.");
  if (phone.replace(/\D/g, "").length < 10) return error("Enter a valid phone number.");
  const slugError = validateSiteSlug(slug);
  if (slugError) return error(slugError);
  const referralError = validateReferralUrl(referralUrl);
  if (referralError) return error(referralError);
  if (!input.acceptedTerms) return error("Accept the service terms and disclosures to continue.");

  const db = await getDb();
  const now = new Date();
  await purgeExpiredCheckoutReservations(now);
  const [existingSite] = await db
    .select({
      id: sites.id,
      userId: sites.userId,
      status: sites.status,
      reservationExpiresAt: sites.reservationExpiresAt,
      stripeCheckoutSessionId: sites.stripeCheckoutSessionId,
      updatedAt: sites.updatedAt,
    })
    .from(sites)
    .where(eq(sites.slug, slug))
    .limit(1);

  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const [existingOwnedSite] = existingUser
    ? await db
        .select({
          id: sites.id,
          userId: sites.userId,
          slug: sites.slug,
          status: sites.status,
          reservationExpiresAt: sites.reservationExpiresAt,
          stripeCheckoutSessionId: sites.stripeCheckoutSessionId,
          updatedAt: sites.updatedAt,
        })
        .from(sites)
        .where(eq(sites.userId, existingUser.id))
        .limit(1)
    : [];

  const ownedDecision = ownedReservationDecision(existingOwnedSite, existingSite?.id);
  if (existingOwnedSite && ownedDecision === "retained") {
    return error(
      `That email already manages ${existingOwnedSite.slug}. Sign in to update or reactivate the existing site.`,
      409,
      "email_has_site",
    );
  }

  const requestedAddressDecision = checkoutReservationDecision(
    existingSite,
    existingUser?.id,
    now,
  );
  if (requestedAddressDecision === "retained") {
    return error(
      "That site address already belongs to an active or retained account.",
      409,
      "site_unavailable",
    );
  }
  if (requestedAddressDecision === "reserved") {
    return error(
      "That site address is already reserved. Please choose another.",
      409,
      "site_unavailable",
    );
  }

  const reservationSite = ownedDecision === "rename" ? existingOwnedSite : existingSite;
  const renamingOwnedReservation = ownedDecision === "rename";
  const reservationDecision = checkoutReservationDecision(
    reservationSite,
    existingUser?.id,
    now,
  );

  const reservationExpiresAt =
    reservationSite && reservationDecision === "reuse" && !renamingOwnedReservation
      ? reservationSite.reservationExpiresAt!
      : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const userId = existingUser?.id ?? crypto.randomUUID();
  const siteId = reservationSite?.id ?? crypto.randomUUID();
  const [sourceSite] = sourceSlug
    ? await db
        .select({ id: sites.id })
        .from(sites)
        .where(and(eq(sites.slug, sourceSlug), eq(sites.status, "active")))
        .limit(1)
    : [];

  const siteValues = {
    userId,
    slug,
    displayName: identity.displayName,
    companyName: identity.companyName,
    displayNameType: identity.displayNameType,
    initials: identity.initials,
    publicEmail: email,
    publicPhone: phone,
    showEmail: true,
    showPhone: true,
    bio: generatedSponsorBio(locale, identity.displayName),
    referralUrl,
    status: "pending" as const,
    publicationOverride: null,
    sourceSiteId: sourceSite?.id ?? null,
    reservationExpiresAt,
    updatedAt: now,
  };

  const stripe = await getStripe();
  if (renamingOwnedReservation && reservationSite?.stripeCheckoutSessionId) {
    const previousSession = await stripe.checkout.sessions.retrieve(
      reservationSite.stripeCheckoutSessionId,
    );
    if (previousSession.status === "complete") {
      return error(
        "Your previous checkout has completed and the site is still being activated. Please wait a moment, then sign in.",
        409,
        "checkout_processing",
      );
    }
    if (previousSession.status === "open") {
      await stripe.checkout.sessions.expire(previousSession.id);
    }
  }

  if (existingUser) {
    await db
      .update(users)
      .set({
        name: identity.fullName,
        firstName: identity.firstName,
        lastName: identity.lastName,
        phone,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      email,
      name: identity.fullName,
      firstName: identity.firstName,
      lastName: identity.lastName,
      phone,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (reservationSite) {
    const updated = await db
      .update(sites)
      .set(siteValues)
      .where(and(eq(sites.id, siteId), eq(sites.updatedAt, reservationSite.updatedAt)))
      .returning({ id: sites.id });
    if (updated.length === 0) {
      return error(
        "That site address was just claimed. Please enter another name.",
        409,
        "site_unavailable",
      );
    }
  } else {
    try {
      await db.insert(sites).values({
        id: siteId,
        ...siteValues,
        createdAt: now,
      });
    } catch (cause) {
      const [conflictingSite] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.slug, slug))
        .limit(1);
      if (conflictingSite) {
        return error(
          "That site address was just claimed. Please enter another name.",
          409,
          "site_unavailable",
        );
      }
      throw cause;
    }
  }

  const origin = new URL(request.url).origin;
  const checkoutBasePath = locale === "fr" ? "/fr/get-your-site" : "/get-your-site";
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      locale: locale === "fr" ? "fr" : "auto",
      ...(existingUser?.stripeCustomerId
        ? { customer: existingUser.stripeCustomerId }
        : { customer_email: email }),
      client_reference_id: siteId,
      line_items: [{ price: await priceForPlan(plan), quantity: 1 }],
      allow_promotion_codes: true,
      expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
      success_url: `${origin}${checkoutBasePath}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${checkoutBasePath}?checkout=canceled&site=${encodeURIComponent(slug)}`,
      metadata: { siteId, userId, plan, sourceSlug, locale },
      subscription_data: { metadata: { siteId, userId, plan, sourceSlug, locale } },
    },
    {
      idempotencyKey: `site-checkout-${siteId}-${plan}-${reservationExpiresAt.getTime()}`,
    },
  );

  if (!session.url) return error("Stripe did not return a checkout address.", 502);

  await db
    .update(sites)
    .set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() })
    .where(eq(sites.id, siteId));

  try {
    await enqueueCheckoutReminder(siteId, undefined, locale);
  } catch (cause) {
    console.error(
      JSON.stringify({
        message: "checkout reminder could not be scheduled",
        siteId,
        checkoutSessionId: session.id,
        error: cause instanceof Error ? cause.message : "Unknown queue failure",
      }),
    );
  }

  return NextResponse.json({ checkoutUrl: session.url });
}

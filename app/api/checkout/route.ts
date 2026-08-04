import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites, users } from "@/db/schema";
import {
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

type CheckoutInput = {
  name?: string;
  email?: string;
  phone?: string;
  slug?: string;
  referralUrl?: string;
  source?: string;
  plan?: string;
  acceptedTerms?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CB";
}

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

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";
  const slug = normalizeSiteSlug(input.slug ?? name);
  const referralUrl = input.referralUrl?.trim() ?? "";
  const sourceSlug = normalizeSiteSlug(input.source ?? "");
  const plan: BillingPlan = input.plan === "annual" ? "annual" : "monthly";

  if (name.length < 2 || name.length > 80) return error("Enter your full name.");
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
    displayName: name,
    initials: initialsFor(name),
    publicEmail: email,
    publicPhone: phone,
    showEmail: true,
    showPhone: true,
    bio: `Questions before joining? ${name} is here to help you understand the information and take your next step with confidence.`,
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
      .set({ name, phone, updatedAt: now })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      email,
      name,
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
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      ...(existingUser?.stripeCustomerId
        ? { customer: existingUser.stripeCustomerId }
        : { customer_email: email }),
      client_reference_id: siteId,
      line_items: [{ price: await priceForPlan(plan), quantity: 1 }],
      allow_promotion_codes: true,
      expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
      success_url: `${origin}/get-your-site/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/get-your-site?checkout=canceled&site=${encodeURIComponent(slug)}`,
      metadata: { siteId, userId, plan, sourceSlug },
      subscription_data: { metadata: { siteId, userId, plan, sourceSlug } },
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

  return NextResponse.json({ checkoutUrl: session.url });
}

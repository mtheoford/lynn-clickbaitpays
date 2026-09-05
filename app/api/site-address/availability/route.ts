import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites, users } from "@/db/schema";
import { checkoutReservationDecision } from "@/lib/checkout-reservation";
import { normalizeSiteSlug, validateSiteSlug } from "@/lib/site-config";
import { isSameOriginMutation } from "@/lib/request-security";
import { purgeExpiredCheckoutReservations } from "@/lib/checkout-cleanup";
import { billingLocale } from "@/lib/checkout-localization";
import { localizedCustomerError } from "@/lib/customer-messages";

type AvailabilityInput = {
  slug?: string;
  email?: string;
  locale?: string;
};

function response(body: { available: boolean; message: string }, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return response({ available: false, message: "Request origin could not be verified." }, 403);
  }

  let input: AvailabilityInput;
  try {
    input = await request.json();
  } catch {
    return response({ available: false, message: "The site address could not be checked." }, 400);
  }

  const slug = normalizeSiteSlug(input.slug ?? "");
  const locale = billingLocale(input.locale);
  function localizedResponse(available: boolean, message: string, status = 200) {
    return response({ available, message: localizedCustomerError(message, locale) }, status);
  }
  const email = input.email?.trim().toLowerCase() ?? "";
  const slugError = validateSiteSlug(slug);
  if (slugError) return localizedResponse(false, slugError, 400);

  const db = await getDb();
  const now = new Date();
  await purgeExpiredCheckoutReservations(now);
  const [existingSite] = await db
    .select({
      userId: sites.userId,
      status: sites.status,
      reservationExpiresAt: sites.reservationExpiresAt,
    })
    .from(sites)
    .where(eq(sites.slug, slug))
    .limit(1);

  const [purchaser] = email
    ? await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    : [];
  const decision = checkoutReservationDecision(existingSite, purchaser?.id, now);

  if (decision === "new" || decision === "replace" || decision === "reuse") {
    return localizedResponse(true, "This site address is available.");
  }

  return localizedResponse(false, "That site address is already taken. Please enter another name.");
}

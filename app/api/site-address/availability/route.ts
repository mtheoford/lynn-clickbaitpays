import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites, users } from "@/db/schema";
import { checkoutReservationDecision } from "@/lib/checkout-reservation";
import { normalizeSiteSlug, validateSiteSlug } from "@/lib/site-config";
import { isSameOriginMutation } from "@/lib/request-security";
import { purgeExpiredCheckoutReservations } from "@/lib/checkout-cleanup";

type AvailabilityInput = {
  slug?: string;
  email?: string;
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
  const email = input.email?.trim().toLowerCase() ?? "";
  const slugError = validateSiteSlug(slug);
  if (slugError) return response({ available: false, message: slugError }, 400);

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
    return response({ available: true, message: "This site address is available." });
  }

  return response({
    available: false,
    message: "That site address is already taken. Please enter another name.",
  });
}

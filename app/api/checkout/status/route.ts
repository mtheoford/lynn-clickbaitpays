import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sites } from "@/db/schema";
import { siteUrl } from "@/lib/site-config";
import { billingLocale, localizedPublicUrl } from "@/lib/checkout-localization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const sessionId = requestUrl.searchParams.get("session_id") ?? "";
  const locale = billingLocale(requestUrl.searchParams.get("locale"));
  if (!/^cs_[A-Za-z0-9_]{12,240}$/.test(sessionId)) {
    return NextResponse.json(
      { state: "processing" },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const db = await getDb();
  const [site] = await db
    .select({ slug: sites.slug, status: sites.status })
    .from(sites)
    .where(eq(sites.stripeCheckoutSessionId, sessionId))
    .limit(1);

  if (site?.status === "active" || site?.status === "past_due") {
    return NextResponse.json(
      { state: "ready", publicUrl: localizedPublicUrl(siteUrl(site.slug), locale) },
      { headers: { "cache-control": "no-store" } },
    );
  }

  if (
    site?.status === "suspended" ||
    site?.status === "canceled" ||
    site?.status === "deleted"
  ) {
    return NextResponse.json(
      { state: "action_required" },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { state: "processing" },
    { headers: { "cache-control": "no-store" } },
  );
}

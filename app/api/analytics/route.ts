import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { analyticsEvents, sites } from "@/db/schema";
import { normalizeSiteSlug } from "@/lib/site-config";

const ALLOWED_EVENTS = new Set(["page_view", "referral_click", "growth_click"]);

export async function POST(request: Request) {
  let input: { siteSlug?: string; eventType?: string };
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const siteSlug = normalizeSiteSlug(input.siteSlug ?? "");
  const eventType = input.eventType ?? "";
  if (!siteSlug || !ALLOWED_EVENTS.has(eventType)) {
    return new Response(null, { status: 204 });
  }

  try {
    const db = await getDb();
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);
    if (!site) return new Response(null, { status: 204 });

    let referrerHost: string | null = null;
    const referrer = request.headers.get("referer");
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname.slice(0, 180);
      } catch {
        referrerHost = null;
      }
    }

    await db.insert(analyticsEvents).values({
      id: crypto.randomUUID(),
      siteId: site.id,
      eventType: eventType as "page_view" | "referral_click" | "growth_click",
      referrerHost,
      visitorHash: null,
      createdAt: new Date(),
    });
  } catch {
    // Analytics must never interrupt the visitor's navigation.
  }

  return NextResponse.json({ recorded: true });
}


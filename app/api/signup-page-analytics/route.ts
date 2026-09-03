import { getDb } from "@/db";
import { signupPageEvents } from "@/db/schema";
import { normalizeSiteSlug } from "@/lib/site-routing";
import {
  hashAnalyticsVisitorToken,
  isAnalyticsVisitorToken,
  isSignupPageEventType,
  isSignupPagePlacement,
} from "@/lib/signup-page-analytics";
import { isSameOriginMutation } from "@/lib/request-security";

type AnalyticsPayload = {
  eventType?: string;
  placement?: string;
  source?: string;
  visitorToken?: string;
  referrer?: string;
};

function referrerHost(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.slice(0, 2_000));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.slice(0, 180) || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new Response(null, { status: 204 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 4_096) return new Response(null, { status: 204 });

  let input: AnalyticsPayload;
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const eventType = input.eventType ?? "";
  const placement = input.placement ?? "";
  const visitorToken = input.visitorToken ?? "";
  if (
    !isSignupPageEventType(eventType) ||
    !isSignupPagePlacement(eventType, placement) ||
    !isAnalyticsVisitorToken(visitorToken)
  ) {
    return new Response(null, { status: 204 });
  }

  try {
    const db = await getDb();
    await db.insert(signupPageEvents).values({
      id: crypto.randomUUID(),
      eventType,
      placement,
      visitorHash: await hashAnalyticsVisitorToken(visitorToken),
      source: normalizeSiteSlug(input.source ?? "") || null,
      referrerHost: referrerHost(input.referrer),
      createdAt: new Date(),
    });
  } catch {
    // Analytics must never interrupt or delay the visitor's next action.
  }

  return new Response(null, { status: 204 });
}

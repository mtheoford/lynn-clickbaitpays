import { after } from "next/server";
import { getDb } from "@/db";
import { signupPageEvents } from "@/db/schema";
import {
  hashAnalyticsVisitorToken,
  type SignupAnalyticsContext,
  type SignupAnalyticsErrorCode,
  type SignupAnalyticsField,
  type SignupAnalyticsPlan,
  type SignupServerEventType,
} from "@/lib/signup-page-analytics";

export type SignupServerEvent = {
  eventType: SignupServerEventType;
  /** Session/subscription/site ID, never an email or other customer details. */
  dedupeKey: string;
  context: SignupAnalyticsContext;
  source?: string | null;
  plan?: SignupAnalyticsPlan | null;
  errorCode?: SignupAnalyticsErrorCode | null;
  field?: SignupAnalyticsField | null;
  createdAt?: Date;
};

// A missing migration or analytics outage must never fail checkout/provisioning.
// Bound the wait in queue consumers; HTTP handlers defer the write until after response.
export async function recordSignupServerEvent(event: SignupServerEvent): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        const identityHash = await hashAnalyticsVisitorToken(`server:${event.dedupeKey}`);
        const db = await getDb();
        await db.insert(signupPageEvents).values({
          id: `v2:${event.eventType}:${event.dedupeKey}`,
          eventType: event.eventType,
          placement: "server",
          visitorHash: event.context.visitorHash ?? identityHash,
          journeyHash: event.context.journeyHash,
          locale: event.context.locale,
          deviceType: event.context.deviceType,
          source: event.source ?? null,
          plan: event.plan ?? null,
          errorCode: event.errorCode ?? null,
          field: event.field ?? null,
          createdAt: event.createdAt ?? new Date(),
        }).onConflictDoNothing();
      })(),
      new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new Error("analytics_timeout")), 1_500);
      }),
    ]);
  } catch {
    // Deliberately omit raw exception text, payloads, emails, tokens and Stripe secrets.
    console.error(JSON.stringify({ message: "signup analytics write unavailable", eventType: event.eventType }));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function scheduleSignupServerEvent(event: SignupServerEvent): void {
  try {
    after(() => recordSignupServerEvent(event));
  } catch {
    // This helper is only used in request handlers. Queue consumers await the bounded writer.
    console.error(JSON.stringify({ message: "signup analytics scheduling unavailable", eventType: event.eventType }));
  }
}

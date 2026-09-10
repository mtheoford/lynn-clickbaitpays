export const SIGNUP_ANALYTICS_TIME_ZONE = "America/Denver";

export const SIGNUP_ANALYTICS_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-7-days", label: "Last 7 Days" },
  { value: "last-14-days", label: "Last 14 Days" },
  { value: "last-30-days", label: "Last 30 Days" },
  { value: "all-time", label: "All Time" },
] as const;

export type SignupAnalyticsRange =
  (typeof SIGNUP_ANALYTICS_RANGE_OPTIONS)[number]["value"];

export const DEFAULT_SIGNUP_ANALYTICS_RANGE: SignupAnalyticsRange =
  "last-7-days";

export type SignupPageEventType =
  | "page_view"
  | "signup_click"
  | "demo_click"
  | "form_start" | "form_submit" | "validation_error" | "checkout_redirect" | "checkout_error"
  | "checkout_created" | "checkout_failed" | "checkout_expired"
  | "payment_completed" | "payment_failed" | "site_activated";

export type SignupBrowserEventType = Exclude<SignupPageEventType,
  "checkout_created" | "checkout_failed" | "checkout_expired" | "payment_completed" | "payment_failed" | "site_activated">;
export type SignupServerEventType = Exclude<SignupPageEventType, SignupBrowserEventType>;
export type SignupAnalyticsDeviceType = "mobile" | "tablet" | "desktop" | "unknown";
export type SignupAnalyticsPlan = "monthly" | "annual";
export const SIGNUP_ANALYTICS_ERROR_CODES = [
  "required", "invalid_email", "invalid_phone", "invalid_referral", "invalid_name", "invalid_choice",
  "too_long", "pattern_mismatch", "site_unavailable", "email_has_site", "checkout_processing",
  "terms_required", "network_error", "server_error", "checkout_unavailable", "invalid_response",
  "validation_error", "billing_unavailable", "origin_rejected", "invalid_payload", "stripe_error",
  "database_error", "payment_failed", "unknown",
] as const;
export type SignupAnalyticsErrorCode = typeof SIGNUP_ANALYTICS_ERROR_CODES[number];
export const SIGNUP_ANALYTICS_FIELDS = [
  "firstName", "lastName", "companyName", "displayNameType", "email", "phone", "referralUsername",
  "acceptedTerms", "siteAddress", "plan",
] as const;
export type SignupAnalyticsField = typeof SIGNUP_ANALYTICS_FIELDS[number];
export function isSignupAnalyticsErrorCode(value: unknown): value is SignupAnalyticsErrorCode {
  return typeof value === "string" && (SIGNUP_ANALYTICS_ERROR_CODES as readonly string[]).includes(value);
}
export function isSignupAnalyticsField(value: unknown): value is SignupAnalyticsField {
  return typeof value === "string" && (SIGNUP_ANALYTICS_FIELDS as readonly string[]).includes(value);
}
export function isSignupAnalyticsDeviceType(value: unknown): value is SignupAnalyticsDeviceType {
  return typeof value === "string" && ["mobile", "tablet", "desktop", "unknown"].includes(value);
}
export function isSignupAnalyticsPlan(value: unknown): value is SignupAnalyticsPlan {
  return value === "monthly" || value === "annual";
}
export function isBrowserSignupEventType(value: string): value is SignupBrowserEventType {
  return ["page_view", "signup_click", "demo_click", "form_start", "form_submit", "validation_error", "checkout_redirect", "checkout_error"].includes(value);
}

export type SignupPagePlacement =
  | "page"
  | "header"
  | "hero"
  | "product_preview"
  | "closing" | "form" | "checkout" | "server";

export const SIGNUP_PAGE_EVENT_PLACEMENTS: Record<
  SignupPageEventType,
  readonly SignupPagePlacement[]
> = {
  page_view: ["page"],
  signup_click: ["hero", "closing"],
  demo_click: ["header", "hero", "product_preview"],
  form_start: ["form"],
  form_submit: ["form"],
  validation_error: ["form", "checkout"],
  checkout_redirect: ["form", "checkout"],
  checkout_error: ["form", "checkout"],
  checkout_created: ["server"],
  checkout_failed: ["server"],
  checkout_expired: ["server"],
  payment_completed: ["server"],
  payment_failed: ["server"],
  site_activated: ["server"],
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type SignupAnalyticsWindow = {
  range: SignupAnalyticsRange;
  start: Date | null;
  end: Date | null;
};

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SIGNUP_ANALYTICS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function integerPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find((part) => part.type === type)?.value ?? "0");
}

function zonedParts(date: Date) {
  const parts = zonedDateTimeFormatter.formatToParts(date);
  return {
    year: integerPart(parts, "year"),
    month: integerPart(parts, "month"),
    day: integerPart(parts, "day"),
    hour: integerPart(parts, "hour"),
    minute: integerPart(parts, "minute"),
    second: integerPart(parts, "second"),
  };
}

function localCalendarDate(date: Date): CalendarDate {
  const parts = zonedParts(date);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function zonedMidnight(date: CalendarDate): Date {
  const desired = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
  let candidate = desired;

  // Resolve the UTC offset for the requested Mountain Time calendar date.
  // Repeating handles the offset changing across daylight-saving boundaries.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = zonedParts(new Date(candidate));
    const representedAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const correction = desired - representedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }

  return new Date(candidate);
}

export function parseSignupAnalyticsRange(
  value: string | undefined,
): SignupAnalyticsRange {
  return SIGNUP_ANALYTICS_RANGE_OPTIONS.some((option) => option.value === value)
    ? (value as SignupAnalyticsRange)
    : DEFAULT_SIGNUP_ANALYTICS_RANGE;
}

export function signupAnalyticsWindow(
  range: SignupAnalyticsRange,
  now = new Date(),
): SignupAnalyticsWindow {
  if (range === "all-time") return { range, start: null, end: null };

  const today = localCalendarDate(now);
  const tomorrow = addCalendarDays(today, 1);
  let startDate = today;
  let endDate = tomorrow;

  if (range === "yesterday") {
    startDate = addCalendarDays(today, -1);
    endDate = today;
  } else if (range === "this-week") {
    const weekday = new Date(
      Date.UTC(today.year, today.month - 1, today.day),
    ).getUTCDay();
    const daysSinceMonday = (weekday + 6) % 7;
    startDate = addCalendarDays(today, -daysSinceMonday);
  } else if (range === "last-7-days") {
    startDate = addCalendarDays(today, -6);
  } else if (range === "last-14-days") {
    startDate = addCalendarDays(today, -13);
  } else if (range === "last-30-days") {
    startDate = addCalendarDays(today, -29);
  }

  return {
    range,
    start: zonedMidnight(startDate),
    end: zonedMidnight(endDate),
  };
}

export function isSignupPageEventType(
  value: string,
): value is SignupPageEventType {
  return Object.prototype.hasOwnProperty.call(SIGNUP_PAGE_EVENT_PLACEMENTS, value);
}

export function isSignupPagePlacement(
  eventType: SignupPageEventType,
  value: string,
): value is SignupPagePlacement {
  return (SIGNUP_PAGE_EVENT_PLACEMENTS[eventType] as readonly string[]).includes(value);
}

export function isAnalyticsVisitorToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function hashAnalyticsVisitorToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export type SignupAnalyticsContext = {
  visitorHash: string | null;
  journeyHash: string | null;
  locale: "en" | "fr" | "de" | null;
  deviceType: SignupAnalyticsDeviceType | null;
};
const EMPTY_ANALYTICS_CONTEXT: SignupAnalyticsContext = {
  visitorHash: null, journeyHash: null, locale: null, deviceType: null,
};

/** Only opaque UUIDs and explicitly allowed dimensions enter durable analytics. */
export async function hashSignupAnalyticsContext(input: unknown): Promise<SignupAnalyticsContext> {
  if (!input || typeof input !== "object") return { ...EMPTY_ANALYTICS_CONTEXT };
  const value = input as Record<string, unknown>;
  return {
    visitorHash: typeof value.visitorToken === "string" && isAnalyticsVisitorToken(value.visitorToken)
      ? await hashAnalyticsVisitorToken(value.visitorToken) : null,
    journeyHash: typeof value.journeyToken === "string" && isAnalyticsVisitorToken(value.journeyToken)
      ? await hashAnalyticsVisitorToken(value.journeyToken) : null,
    locale: value.locale === "en" || value.locale === "fr" || value.locale === "de" ? value.locale : null,
    deviceType: isSignupAnalyticsDeviceType(value.deviceType) ? value.deviceType : null,
  };
}

export function signupAnalyticsMetadata(context: SignupAnalyticsContext): Record<string, string> {
  return {
    signup_tracking_version: "2",
    ...(context.visitorHash ? { signup_visitor_hash: context.visitorHash } : {}),
    ...(context.journeyHash ? { signup_journey_hash: context.journeyHash } : {}),
    ...(context.locale ? { signup_locale: context.locale } : {}),
    ...(context.deviceType ? { signup_device_type: context.deviceType } : {}),
  };
}

/** Old sessions are deliberately excluded: no invented historic funnel stages. */
export function signupAnalyticsContextFromMetadata(metadata: Record<string, string> | null | undefined): SignupAnalyticsContext | null {
  if (metadata?.signup_tracking_version !== "2") return null;
  const validHash = (value: unknown) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value) ? value : null;
  return {
    visitorHash: validHash(metadata.signup_visitor_hash),
    journeyHash: validHash(metadata.signup_journey_hash),
    locale: metadata.signup_locale === "en" || metadata.signup_locale === "fr" || metadata.signup_locale === "de"
      ? metadata.signup_locale : null,
    deviceType: isSignupAnalyticsDeviceType(metadata.signup_device_type) ? metadata.signup_device_type : null,
  };
}

export type SignupLifecycleAnalyticsEvent = {
  eventType: "checkout_expired" | "payment_failed" | "payment_completed";
  dedupeKey: string;
  context: SignupAnalyticsContext;
  plan: SignupAnalyticsPlan | null;
  source: string | null;
  createdAt: Date;
  errorCode?: "payment_failed";
};

type StripeAnalyticsObject = {
  id: string;
  mode?: string | null;
  payment_status?: string;
  amount_total?: number | null;
  amount_paid?: number;
  billing_reason?: string | null;
  metadata?: Record<string, string> | null;
  subscription?: string | { id: string } | null;
  subscription_details?: { metadata?: Record<string, string> | null } | null;
  parent?: { subscription_details?: {
    metadata?: Record<string, string> | null;
    subscription?: string | { id: string } | null;
  } | null } | null;
};

/** Select only initial paid sales, never renewals/free checkouts; retain Stripe event time.
 * Checkout and initial-invoice webhooks share a subscription dedupe key.
 */
export function signupLifecycleAnalyticsEvent(event: {
  type: string;
  created: number;
  data: { object: unknown };
}): SignupLifecycleAnalyticsEvent | null {
  const object = event.data.object as StripeAnalyticsObject;
  const stripeId = (value: string | { id: string } | null | undefined) =>
    typeof value === "string" ? value : value?.id;
  const sessionEvent = ["checkout.session.completed", "checkout.session.async_payment_succeeded",
    "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type);
  if (!sessionEvent && event.type !== "invoice.paid" && event.type !== "invoice.payment_failed") return null;
  // Webhook endpoints may retain an earlier Stripe API version than the SDK.
  const metadata = sessionEvent ? object.metadata
    : object.parent?.subscription_details?.metadata ?? object.subscription_details?.metadata;
  const context = signupAnalyticsContextFromMetadata(metadata);
  if (!context || !metadata?.siteId || !Number.isFinite(event.created)) return null;
  const common = {
    context, plan: isSignupAnalyticsPlan(metadata.plan) ? metadata.plan : null,
    source: metadata.sourceSlug || null, createdAt: new Date(event.created * 1000),
  };
  if (sessionEvent) {
    if (object.mode !== "subscription") return null;
    if (event.type === "checkout.session.expired") {
      return { ...common, eventType: "checkout_expired", dedupeKey: object.id };
    }
    const subscriptionId = stripeId(object.subscription);
    if (event.type === "checkout.session.async_payment_failed") {
      return { ...common, eventType: "payment_failed", dedupeKey: subscriptionId ?? object.id, errorCode: "payment_failed" };
    }
    if (object.payment_status !== "paid" || (object.amount_total ?? 0) <= 0 || !subscriptionId) return null;
    return { ...common, eventType: "payment_completed", dedupeKey: subscriptionId };
  }
  if (object.billing_reason !== "subscription_create") return null;
  const subscriptionId = stripeId(object.parent?.subscription_details?.subscription ?? object.subscription);
  if (!subscriptionId) return null;
  if (event.type === "invoice.paid") {
    if ((object.amount_paid ?? 0) <= 0) return null;
    return { ...common, eventType: "payment_completed", dedupeKey: subscriptionId };
  }
  return { ...common, eventType: "payment_failed", dedupeKey: subscriptionId, errorCode: "payment_failed" };
}

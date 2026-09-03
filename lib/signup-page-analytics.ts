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
  | "demo_click";

export type SignupPagePlacement =
  | "page"
  | "header"
  | "hero"
  | "product_preview"
  | "closing";

export const SIGNUP_PAGE_EVENT_PLACEMENTS: Record<
  SignupPageEventType,
  readonly SignupPagePlacement[]
> = {
  page_view: ["page"],
  signup_click: ["hero", "closing"],
  demo_click: ["header", "hero", "product_preview"],
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

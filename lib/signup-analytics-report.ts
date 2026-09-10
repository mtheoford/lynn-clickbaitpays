import { SIGNUP_ANALYTICS_TIME_ZONE, signupAnalyticsWindow, type SignupAnalyticsRange } from "./signup-page-analytics.ts";

export const SIGNUP_METRICS = [
  { key: "visitors", label: "Site visitors", description: "Unique browsers", color: "#55dce5", group: "traffic", legacy: true },
  { key: "formOpens", label: "Form opens", description: "All signup-form opens", color: "#ac9aff", group: "traffic", legacy: true },
  { key: "demoClicks", label: "Demo clicks", description: "All live-demo clicks", color: "#f2bc69", group: "traffic", legacy: true },
  { key: "formStarts", label: "Forms started", description: "Unique visits with a form edit", color: "#76b8fa", group: "checkout", legacy: false },
  { key: "formSubmissions", label: "Form submissions", description: "Requests after browser validation", color: "#b69cff", group: "checkout", legacy: false },
  { key: "checkouts", label: "Stripe checkouts", description: "Distinct checkout sessions created", color: "#f4ca78", group: "checkout", legacy: false },
  { key: "payments", label: "Paid signups", description: "First paid subscriptions; excludes renewals", color: "#66e3ae", group: "checkout", legacy: true },
  { key: "activations", label: "Sites activated", description: "Distinct sites activated after checkout", color: "#f28fbd", group: "checkout", legacy: false },
  { key: "validationErrors", label: "Form issues", description: "Unique visits with validation issues", color: "#f4ca78", group: "issues", legacy: false },
  { key: "checkoutErrors", label: "Checkout errors", description: "Unique visits with checkout errors", color: "#ff9292", group: "issues", legacy: false },
  { key: "paymentFailures", label: "Payment failures", description: "Initial invoice and delayed-payment failures; excludes renewals", color: "#d4a1ff", group: "issues", legacy: false },
  { key: "expiredCheckouts", label: "Expired checkouts", description: "Unfinished sessions that expired", color: "#94b4d9", group: "issues", legacy: false },
] as const;

export type SignupMetricKey = (typeof SIGNUP_METRICS)[number]["key"];
export type SignupMetricValues = Record<SignupMetricKey, number | null>;
export type SignupTrendPoint = { key: string; label: string; values: SignupMetricValues };
export type SignupTrendBucket = { key: string; label: string; start: number; end: number };
export type SignupMetricAggregate = { bucket: string; eventType: string; total: number; visitors: number; journeys: number };
export type SignupAnalyticsCoverage = { trafficStartedAt: number | null; conversionStartedAt: number | null; paymentsStartedAt: number | null };
export type SignupIssue = { eventType: string; errorCode: string | null; field: string | null; total: number };
export type SignupSource = { source: string; visitors: number; formStarts: number };
export type SignupDevice = { device: string; locale: string; visitors: number; formSubmissions: number };
export type SignupAnalyticsReport = {
  points: SignupTrendPoint[];
  interval: "day" | "month";
  totals: SignupMetricValues;
  coverage: SignupAnalyticsCoverage;
  issues: SignupIssue[];
  sources: SignupSource[];
  devices: SignupDevice[];
};

const calendarFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SIGNUP_ANALYTICS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function signupCalendarKey(time: number): string {
  const parts = calendarFormatter.formatToParts(new Date(time));
  return ["year", "month", "day"].map((part) => parts.find((entry) => entry.type === part)?.value).join("-");
}

function calendarShift(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calendarStart(key: string): number {
  // 18:00 UTC is always on the desired Denver date; reuse the DST-aware window.
  return signupAnalyticsWindow("today", new Date(`${key}T18:00:00Z`)).start!.getTime();
}

export function buildSignupTrendBuckets(range: SignupAnalyticsRange, firstKnownAt: number | null, now = new Date()): { buckets: SignupTrendBucket[]; interval: "day" | "month" } {
  const window = signupAnalyticsWindow(range, now);
  const today = signupCalendarKey(now.getTime());
  const first = window.start ? signupCalendarKey(window.start.getTime()) : signupCalendarKey(Math.min(firstKnownAt ?? now.getTime(), now.getTime()));
  const last = range === "yesterday" ? calendarShift(today, -1) : today;
  const days = Math.round((Date.parse(`${last}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / 86_400_000) + 1;
  const interval = days > 90 ? "month" : "day";
  const buckets: SignupTrendBucket[] = [];
  const labelFormat = new Intl.DateTimeFormat("en-US", { timeZone: SIGNUP_ANALYTICS_TIME_ZONE, month: "short", ...(interval === "day" ? { day: "numeric" as const } : { year: "numeric" as const }) });
  let cursor = interval === "month" ? `${first.slice(0, 7)}-01` : first;
  while (cursor <= last) {
    const start = calendarStart(cursor);
    let next: string;
    if (interval === "month") {
      const date = new Date(`${cursor}T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + 1);
      next = date.toISOString().slice(0, 10);
    } else next = calendarShift(cursor, 1);
    buckets.push({ key: cursor, label: labelFormat.format(new Date(`${cursor}T18:00:00Z`)), start, end: calendarStart(next) });
    cursor = next;
  }
  return { buckets, interval };
}

export function signupMetricValues(rows: SignupMetricAggregate[]): SignupMetricValues {
  const event = (type: string) => rows.find((row) => row.eventType === type);
  return {
    visitors: event("page_view")?.visitors ?? 0,
    formOpens: event("signup_click")?.total ?? 0,
    demoClicks: event("demo_click")?.total ?? 0,
    formStarts: event("form_start")?.journeys ?? 0,
    formSubmissions: event("form_submit")?.total ?? 0,
    checkouts: event("checkout_created")?.total ?? 0,
    payments: event("payment_completed")?.total ?? 0,
    activations: event("site_activated")?.total ?? 0,
    validationErrors: event("validation_error")?.journeys ?? 0,
    checkoutErrors: event("checkout_issue")?.journeys ?? 0,
    paymentFailures: event("payment_failed")?.total ?? 0,
    expiredCheckouts: event("checkout_expired")?.total ?? 0,
  };
}

export function applySignupCoverage(values: SignupMetricValues, end: number, coverage: SignupAnalyticsCoverage): SignupMetricValues {
  const result = { ...values };
  for (const metric of SIGNUP_METRICS) {
    const startedAt = metric.key === "payments" ? coverage.paymentsStartedAt : metric.legacy ? coverage.trafficStartedAt : coverage.conversionStartedAt;
    if (startedAt === null || end <= startedAt) result[metric.key] = null;
  }
  return result;
}

export function buildSignupTrendPoints(buckets: SignupTrendBucket[], rows: SignupMetricAggregate[], coverage: SignupAnalyticsCoverage): SignupTrendPoint[] {
  const grouped = new Map<string, SignupMetricAggregate[]>();
  for (const row of rows) {
    const existing = grouped.get(row.bucket) ?? [];
    existing.push(row);
    grouped.set(row.bucket, existing);
  }
  return buckets.map((bucket) => ({ key: bucket.key, label: bucket.label, values: applySignupCoverage(signupMetricValues(grouped.get(bucket.key) ?? []), bucket.end, coverage) }));
}

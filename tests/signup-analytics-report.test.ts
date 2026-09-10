import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { applySignupCoverage, buildSignupTrendBuckets, buildSignupTrendPoints, signupMetricValues } from "../lib/signup-analytics-report.ts";
import { SIGNUP_EVENTS_CTE } from "../lib/signup-analytics-sql.ts";

test("week and month charts use Denver calendar days including DST", () => {
  const { buckets, interval } = buildSignupTrendBuckets("last-7-days", null, new Date("2026-03-10T16:00:00Z"));
  assert.equal(interval, "day");
  assert.equal(buckets.length, 7);
  const spring = buckets.find((bucket) => bucket.key === "2026-03-08")!;
  assert.equal(spring.end - spring.start, 23 * 60 * 60 * 1000);
  assert.equal(buckets.at(-1)?.key, "2026-03-10");
  const month = buildSignupTrendBuckets("last-30-days", null, new Date("2026-11-03T16:00:00Z"));
  assert.equal(month.buckets.length, 30);
  const fall = month.buckets.find((bucket) => bucket.key === "2026-11-01")!;
  assert.equal(fall.end - fall.start, 25 * 60 * 60 * 1000);
});

test("lifetime stays daily for a short history and becomes monthly for longer histories", () => {
  const now = new Date("2026-09-10T14:00:00Z");
  assert.equal(buildSignupTrendBuckets("all-time", Date.parse("2026-08-04T16:00:00Z"), now).interval, "day");
  const lifetime = buildSignupTrendBuckets("all-time", Date.parse("2024-02-29T16:00:00Z"), now);
  assert.equal(lifetime.interval, "month");
  assert.equal(lifetime.buckets[0].key, "2024-02-01");
  assert.equal(lifetime.buckets.at(-1)?.key, "2026-09-01");
  assert.equal(buildSignupTrendBuckets("yesterday", null, now).buckets[0].key, "2026-09-09");
});

test("missing historical coverage stays null while tracked empty days become zero", () => {
  const coverage = { trafficStartedAt: Date.parse("2026-09-03T18:00:00Z"), conversionStartedAt: Date.parse("2026-09-10T18:00:00Z"), paymentsStartedAt: Date.parse("2026-08-04T18:00:00Z") };
  const { buckets } = buildSignupTrendBuckets("last-14-days", null, new Date("2026-09-10T20:00:00Z"));
  const points = buildSignupTrendPoints(buckets, [], coverage);
  assert.equal(points.find((point) => point.key === "2026-09-02")?.values.visitors, null);
  assert.equal(points.find((point) => point.key === "2026-09-09")?.values.formSubmissions, null);
  assert.equal(points.find((point) => point.key === "2026-09-09")?.values.visitors, 0);
  assert.equal(points.find((point) => point.key === "2026-09-09")?.values.payments, 0);
  assert.equal(points.at(-1)?.values.formSubmissions, 0);
  const unavailable = applySignupCoverage(signupMetricValues([]), Date.now(), { trafficStartedAt: null, conversionStartedAt: null, paymentsStartedAt: null });
  assert.ok(Object.values(unavailable).every((value) => value === null));
});

test("daily visitors do not inflate distinct period totals; issue duplicates share a journey", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE signup_page_events (id TEXT, event_type TEXT, visitor_hash TEXT, journey_hash TEXT, created_at INTEGER); CREATE TABLE stripe_events (event_type TEXT, payload_json TEXT);");
  const insert = db.prepare("INSERT INTO signup_page_events VALUES (?, ?, ?, ?, ?)");
  insert.run("a", "page_view", "browser1", "journey1", 100);
  insert.run("b", "page_view", "browser1", "journey2", 200);
  insert.run("c", "checkout_failed", "browser1", "journey2", 200);
  insert.run("d", "checkout_error", "browser1", "journey2", 200);
  const visitors = db.prepare(`${SIGNUP_EVENTS_CTE} SELECT COUNT(DISTINCT visitor_hash) AS n FROM events WHERE event_type='page_view'`).get()!;
  assert.equal(visitors.n, 1);
  const issues = db.prepare(`${SIGNUP_EVENTS_CTE} SELECT COUNT(DISTINCT COALESCE(journey_hash,visitor_hash,id)) AS n FROM events WHERE event_type='checkout_issue'`).get()!;
  assert.equal(issues.n, 1);
  db.close();
});

test("historical signed Checkout and initial invoice sales reconcile without renewals or duplicate sales", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE signup_page_events (id TEXT, event_type TEXT, visitor_hash TEXT, journey_hash TEXT, created_at INTEGER); CREATE TABLE stripe_events (event_type TEXT, payload_json TEXT);");
  const stripe = db.prepare("INSERT INTO stripe_events VALUES (?, ?)");
  const payload = (subscription: string, overrides = {}) => JSON.stringify({ created: 1789030000, data: { object: { mode: "subscription", payment_status: "paid", amount_total: 900, metadata: { siteId: "site1" }, subscription, ...overrides } } });
  stripe.run("checkout.session.completed", payload("sub_old"));
  stripe.run("checkout.session.completed", payload("sub_old"));
  stripe.run("checkout.session.completed", payload("sub_new"));
  stripe.run("checkout.session.async_payment_succeeded", payload("sub_async"));
  const invoice = (subscription: string, current: boolean, overrides = {}) => JSON.stringify({ created: 1789030002, data: { object: { billing_reason: "subscription_create", amount_paid: 900,
    ...(current ? { parent: { subscription_details: { subscription, metadata: { siteId: "site1" } } } } : { subscription, subscription_details: { metadata: { siteId: "site1" } } }), ...overrides } } });
  stripe.run("invoice.paid", invoice("sub_new", true));
  stripe.run("invoice.paid", invoice("sub_invoice", true));
  stripe.run("invoice.paid", invoice("sub_invoice_legacy", false));
  stripe.run("invoice.paid", invoice("sub_renewal_real", true, { billing_reason: "subscription_cycle" }));
  stripe.run("invoice.paid", invoice("sub_invoice_free", true, { amount_paid: 0 }));
  stripe.run("invoice.paid", invoice("sub_invoice_unrelated", false, { subscription_details: { metadata: {} } }));
  stripe.run("invoice.paid", payload("sub_renewal"));
  stripe.run("checkout.session.completed", payload("sub_free", { amount_total: 0 }));
  stripe.run("checkout.session.completed", payload("sub_unpaid", { payment_status: "unpaid" }));
  stripe.run("checkout.session.completed", payload("sub_unrelated", { metadata: {} }));
  stripe.run("checkout.session.completed", "invalid JSON");
  stripe.run("checkout.session.completed", JSON.stringify({ ...JSON.parse(payload("sub_bad_date")), created: "oops" }));
  db.prepare("INSERT INTO signup_page_events VALUES (?, ?, ?, ?, ?)").run("v2:payment_completed:sub_new", "payment_completed", "browser", "journey", 1789030001000);
  const result = db.prepare(`${SIGNUP_EVENTS_CTE} SELECT COUNT(*) AS n, MIN(created_at) AS first FROM events WHERE event_type='payment_completed'`).get()!;
  assert.equal(result.n, 5);
  assert.equal(result.first, 1789030000000);
  db.close();
});

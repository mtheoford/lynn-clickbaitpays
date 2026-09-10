import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SIGNUP_ANALYTICS_RANGE,
  hashAnalyticsVisitorToken,
  isAnalyticsVisitorToken,
  isSignupPageEventType,
  isSignupPagePlacement,
  parseSignupAnalyticsRange,
  signupAnalyticsWindow,
} from "../lib/signup-page-analytics.ts";

test("normalizes dashboard date-range selections", () => {
  assert.equal(parseSignupAnalyticsRange("today"), "today");
  assert.equal(parseSignupAnalyticsRange("last-30-days"), "last-30-days");
  assert.equal(parseSignupAnalyticsRange("unexpected"), DEFAULT_SIGNUP_ANALYTICS_RANGE);
  assert.equal(parseSignupAnalyticsRange(undefined), DEFAULT_SIGNUP_ANALYTICS_RANGE);
});

test("builds Mountain Time calendar windows", () => {
  const now = new Date("2026-08-23T15:14:00.000Z");

  const today = signupAnalyticsWindow("today", now);
  assert.equal(today.start?.toISOString(), "2026-08-23T06:00:00.000Z");
  assert.equal(today.end?.toISOString(), "2026-08-24T06:00:00.000Z");

  const yesterday = signupAnalyticsWindow("yesterday", now);
  assert.equal(yesterday.start?.toISOString(), "2026-08-22T06:00:00.000Z");
  assert.equal(yesterday.end?.toISOString(), "2026-08-23T06:00:00.000Z");

  const thisWeek = signupAnalyticsWindow("this-week", now);
  assert.equal(thisWeek.start?.toISOString(), "2026-08-17T06:00:00.000Z");
  assert.equal(thisWeek.end?.toISOString(), "2026-08-24T06:00:00.000Z");

  const lastThirtyDays = signupAnalyticsWindow("last-30-days", now);
  assert.equal(lastThirtyDays.start?.toISOString(), "2026-07-25T06:00:00.000Z");
  assert.equal(lastThirtyDays.end?.toISOString(), "2026-08-24T06:00:00.000Z");
});

test("calendar windows remain correct across daylight-saving changes", () => {
  const now = new Date("2026-03-09T18:00:00.000Z");
  const lastSevenDays = signupAnalyticsWindow("last-7-days", now);

  assert.equal(lastSevenDays.start?.toISOString(), "2026-03-03T07:00:00.000Z");
  assert.equal(lastSevenDays.end?.toISOString(), "2026-03-10T06:00:00.000Z");
});

test("validates funnel event and placement combinations", () => {
  assert.equal(isSignupPageEventType("page_view"), true);
  assert.equal(isSignupPageEventType("checkout_started"), false);
  assert.equal(isSignupPageEventType("toString"), false);
  assert.equal(isSignupPagePlacement("signup_click", "hero"), true);
  assert.equal(isSignupPagePlacement("signup_click", "header"), false);
  assert.equal(isSignupPagePlacement("demo_click", "product_preview"), true);
});

test("hashes valid anonymous visitor tokens before storage", async () => {
  const token = "85b7cf2a-7715-4fae-bfd2-4525d59a6382";
  assert.equal(isAnalyticsVisitorToken(token), true);
  assert.equal(isAnalyticsVisitorToken("not-a-token"), false);

  const first = await hashAnalyticsVisitorToken(token);
  const second = await hashAnalyticsVisitorToken(token);
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, token);
});

import {
  hashSignupAnalyticsContext,
  signupAnalyticsMetadata,
  signupAnalyticsContextFromMetadata,
  signupLifecycleAnalyticsEvent,
  isBrowserSignupEventType,
  isSignupAnalyticsErrorCode,
  isSignupAnalyticsField,
} from "../lib/signup-page-analytics.ts";

test("browser ingestion cannot claim server payment or checkout outcomes", () => {
  for (const event of ["checkout_created", "checkout_failed", "checkout_expired", "payment_completed", "payment_failed", "site_activated"]) {
    assert.equal(isSignupPageEventType(event), true);
    assert.equal(isBrowserSignupEventType(event), false);
  }
  for (const event of ["form_start", "form_submit", "validation_error", "checkout_redirect", "checkout_error"]) {
    assert.equal(isBrowserSignupEventType(event), true);
  }
  assert.equal(isSignupPagePlacement("form_submit", "page"), false);
  assert.equal(isSignupPagePlacement("form_submit", "form"), true);
});

test("analytics context and diagnostics discard PII and arbitrary error messages", async () => {
  const context = await hashSignupAnalyticsContext({
    visitorToken: "85b7cf2a-7715-4fae-bfd2-4525d59a6382",
    journeyToken: "e1fa099d-0057-434c-8089-a2e52ea640ba",
    locale: "fr", deviceType: "mobile", email: "private@example.com", phone: "5551234567",
  });
  assert.match(context.visitorHash!, /^[0-9a-f]{64}$/);
  assert.match(context.journeyHash!, /^[0-9a-f]{64}$/);
  assert.notEqual(context.visitorHash, context.journeyHash);
  const metadata = signupAnalyticsMetadata(context);
  assert.equal(metadata.signup_tracking_version, "2");
  assert.deepEqual(signupAnalyticsContextFromMetadata(metadata), context);
  assert.equal(JSON.stringify(metadata).includes("private"), false);
  assert.deepEqual(await hashSignupAnalyticsContext({ visitorToken: "private@example.com", journeyToken: "secret", locale: "private", deviceType: "private" }),
    { visitorHash: null, journeyHash: null, locale: null, deviceType: null });
  assert.equal(isSignupAnalyticsErrorCode("private@example.com was declined"), false);
  assert.equal(isSignupAnalyticsErrorCode("stripe_error"), true);
  assert.equal(isSignupAnalyticsField("password"), false);
  assert.equal(isSignupAnalyticsField("email"), true);
  assert.equal(signupAnalyticsContextFromMetadata({ siteId: "legacy" }), null);
});

const lifecycleMetadata = { signup_tracking_version: "2", signup_locale: "en", signup_device_type: "desktop", siteId: "site_fixture", plan: "monthly" };
const lifecycleCreated = 1_788_972_000;
const paidSession = {
  id: "cs_fixture", mode: "subscription", payment_status: "paid", amount_total: 900,
  subscription: "sub_fixture", metadata: lifecycleMetadata,
};
function sessionEvent(type = "checkout.session.completed", changes = {}) {
  return { type, created: lifecycleCreated, data: { object: { ...paidSession, ...changes } } };
}
function invoiceEvent(type = "invoice.paid", changes = {}) {
  return { type, created: lifecycleCreated, data: { object: {
    id: "in_fixture", billing_reason: "subscription_create", amount_paid: 900,
    parent: { subscription_details: { subscription: "sub_fixture", metadata: lifecycleMetadata } }, ...changes,
  } } };
}

test("paid signup facts deduplicate Checkout and initial invoice deliveries by subscription", () => {
  const checkout = signupLifecycleAnalyticsEvent(sessionEvent());
  const invoice = signupLifecycleAnalyticsEvent(invoiceEvent());
  assert.equal(checkout?.eventType, "payment_completed");
  assert.equal(checkout?.dedupeKey, "sub_fixture");
  assert.equal(invoice?.dedupeKey, checkout?.dedupeKey);
  assert.equal(checkout?.createdAt.getTime(), lifecycleCreated * 1000);
  assert.deepEqual(signupLifecycleAnalyticsEvent(sessionEvent()), checkout);
  assert.equal(signupLifecycleAnalyticsEvent(sessionEvent("checkout.session.async_payment_succeeded"))?.dedupeKey, checkout?.dedupeKey);
});

test("renewals, trials, zero-dollar coupons, unpaid and legacy sessions are excluded from paid signup counts", () => {
  for (const changes of [
    { amount_total: 0 }, { payment_status: "unpaid" }, { payment_status: "no_payment_required" },
    { mode: "payment" }, { subscription: null }, { metadata: { siteId: "old" } },
  ]) assert.equal(signupLifecycleAnalyticsEvent(sessionEvent("checkout.session.completed", changes)), null);
  assert.equal(signupLifecycleAnalyticsEvent(invoiceEvent("invoice.paid", { amount_paid: 0 })), null);
  assert.equal(signupLifecycleAnalyticsEvent(invoiceEvent("invoice.paid", { billing_reason: "subscription_cycle" })), null);
  assert.equal(signupLifecycleAnalyticsEvent(invoiceEvent("invoice.payment_failed", { billing_reason: "subscription_cycle" })), null);
});

test("expiration and new-signup payment failures remain separate from completed sales", () => {
  const expired = signupLifecycleAnalyticsEvent(sessionEvent("checkout.session.expired", { payment_status: "unpaid" }));
  assert.equal(expired?.eventType, "checkout_expired");
  assert.equal(expired?.dedupeKey, "cs_fixture");
  const failed = signupLifecycleAnalyticsEvent(invoiceEvent("invoice.payment_failed", { amount_paid: 0 }));
  assert.equal(failed?.eventType, "payment_failed");
  assert.equal(failed?.errorCode, "payment_failed");
  assert.equal(signupLifecycleAnalyticsEvent({ type: "payment_intent.payment_failed", created: lifecycleCreated, data: { object: { customer: "private" } } }), null);
});


test("initial invoice facts also support retained older Stripe webhook payload versions", () => {
  const event = invoiceEvent("invoice.paid", {
    parent: undefined,
    subscription: "sub_fixture",
    subscription_details: { metadata: lifecycleMetadata },
  });
  assert.equal(signupLifecycleAnalyticsEvent(event)?.dedupeKey, "sub_fixture");
});

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

test("conversion migration preserves historical analytics and records a truthful start boundary", () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(readFileSync(new URL("../drizzle/0006_signup_page_analytics.sql", import.meta.url), "utf8"));
    database.exec("INSERT INTO signup_page_events (id,event_type,placement,visitor_hash,created_at) VALUES ('old-view','page_view','page','old-browser',1000)");
    database.exec(readFileSync(new URL("../drizzle/0007_conversion_funnel.sql", import.meta.url), "utf8"));
    const old = database.prepare("SELECT event_type,visitor_hash,journey_hash,locale FROM signup_page_events WHERE id='old-view'").get();
    assert.equal(old?.event_type, "page_view");
    assert.equal(old?.visitor_hash, "old-browser");
    assert.equal(old?.journey_hash, null);
    assert.equal(old?.locale, null);
    const coverage = database.prepare("SELECT started_at FROM signup_analytics_versions WHERE id='conversion_v2'").get();
    assert.ok(coverage && Math.abs(Number(coverage.started_at) - Date.now()) < 5_000);
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM signup_page_events WHERE event_type='payment_completed'").get()?.count, 0);
    database.exec("INSERT INTO signup_analytics_versions (id,started_at) VALUES ('conversion_v2',123) ON CONFLICT(id) DO NOTHING");
    assert.equal(database.prepare("SELECT started_at FROM signup_analytics_versions WHERE id='conversion_v2'").get()?.started_at, coverage?.started_at);
  } finally {
    database.close();
  }
});

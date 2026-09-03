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

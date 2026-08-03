import assert from "node:assert/strict";
import test from "node:test";

import {
  graceHasExpired,
  gracePeriodEnd,
  paidThroughHasExpired,
  siteStatusForSubscription,
  stripeTimestamp,
} from "../lib/billing-lifecycle.ts";

const now = new Date("2026-08-03T12:00:00.000Z");

test("maps Stripe lifecycle states to publishable site states", () => {
  assert.equal(siteStatusForSubscription("active", null, now), "active");
  assert.equal(siteStatusForSubscription("past_due", null, now), "past_due");
  assert.equal(siteStatusForSubscription("paused", null, now), "suspended");
  assert.equal(
    siteStatusForSubscription("canceled", new Date("2026-08-10T12:00:00.000Z"), now),
    "active",
  );
  assert.equal(
    siteStatusForSubscription("canceled", new Date("2026-08-02T12:00:00.000Z"), now),
    "canceled",
  );
});

test("computes Stripe timestamps and grace windows", () => {
  assert.equal(stripeTimestamp(1_785_758_400)?.toISOString(), "2026-08-03T12:00:00.000Z");
  assert.equal(gracePeriodEnd(now).toISOString(), "2026-08-10T12:00:00.000Z");
  assert.equal(graceHasExpired(new Date("2026-08-03T11:59:59.000Z"), now), true);
  assert.equal(paidThroughHasExpired(new Date("2026-08-04T00:00:00.000Z"), now), false);
});

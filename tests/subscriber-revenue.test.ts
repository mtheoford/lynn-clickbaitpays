import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { subscriberRevenue, type RevenueSite } from "../lib/subscriber-revenue.ts";

function site(id: string, plan = "monthly", status = "active"): RevenueSite {
  return { siteId: id, plan, status, stripeSubscriptionId: `sub_${id}` };
}
function subscription(id: string, interval = "month", amount = 900, discounts: string[] = []) {
  return {
    id: `sub_${id}`, status: "active", discounts, pause_collection: null,
    items: { has_more: false, data: [{ discounts: [], quantity: 1,
      price: { currency: "usd", billing_scheme: "per_unit", unit_amount: amount,
        recurring: { interval, interval_count: 1, usage_type: "licensed" } } }] },
  } as unknown as Stripe.Subscription;
}

test("normalizes actual annual prices and excludes free, promo and nonpaying sites", async () => {
  const records = [site("monthly"), site("annual", "annual"), site("free"), site("promo"),
    site("past", "monthly", "past_due"), site("suspended", "monthly", "suspended"),
    site("comp", "complimentary"), site("missing"), site("trial"), site("itemPromo"), site("paused")];
  const itemPromo = subscription("itemPromo");
  itemPromo.items.data[0].discounts = ["di_item"];
  const trial = subscription("trial"); trial.status = "trialing";
  const paused = subscription("paused"); paused.pause_collection = { behavior: "void", resumes_at: null };
  const remote = [subscription("monthly", "month", 1100), subscription("annual", "year", 7900),
    subscription("free", "month", 0), subscription("promo", "month", 900, ["di_free"]),
    subscription("past"), subscription("suspended"), subscription("comp"), subscription("unrelated"),
    trial, itemPromo, paused];
  const totals = await subscriberRevenue([...records, records[0]], async () => ({ data: remote, has_more: false }));
  assert.equal(totals.monthlySites, 1);
  assert.equal(totals.annualSites, 1);
  assert.equal(totals.totalMrrCents, 1100 + 7900 / 12);
});

test("reads every page and only counts application-linked subscriptions", async () => {
  const calls: unknown[] = [];
  const totals = await subscriberRevenue([site("last")], async params => {
    calls.push(params);
    return params.starting_after
      ? { data: [subscription("last")], has_more: false }
      : { data: [subscription("other")], has_more: true };
  });
  assert.equal(totals.monthlySites, 1);
  assert.deepEqual(calls, [{ status: "active", limit: 100 }, { status: "active", limit: 100, starting_after: "sub_other" }]);
});

test("fails closed when billing cannot be verified or pagination is incomplete", async () => {
  await assert.rejects(subscriberRevenue([site("one")], async () => { throw new Error("Stripe unavailable"); }));
  await assert.rejects(subscriberRevenue([site("one")], async () => ({ data: [], has_more: true })));
  const incomplete = subscription("one"); incomplete.items.has_more = true;
  await assert.rejects(subscriberRevenue([site("one")], async () => ({ data: [incomplete], has_more: false })));
});

test("does not request billing data for a portfolio without eligible sites", async () => {
  const totals = await subscriberRevenue([site("comp", "complimentary")], async () => { throw new Error("Unexpected Stripe call"); });
  assert.equal(totals.totalMrrCents, 0);
});

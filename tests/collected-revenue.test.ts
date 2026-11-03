import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { collectedRevenue } from "../lib/collected-revenue.ts";

const prices = { monthlyPrice: "price_monthly", annualPrice: "price_annual" };
function payment(id: string, plan: "monthly" | "annual" = "monthly", refund = 0) {
  const cents = plan === "annual" ? 7900 : 900;
  return {
    id, status: "paid", amount_paid: cents, currency: "usd",
    invoice: { id: `in_${id}`, currency: "usd", discounts: [], metadata: {},
      parent: { subscription_details: { subscription: `sub_${id}`, metadata: {} } },
      lines: { has_more: false, data: [{ subtotal: cents, discount_amounts: [],
        pricing: { price_details: { price: prices[`${plan}Price`] } } }] } },
    payment: { type: "payment_intent", payment_intent: { latest_charge: {
      id: `ch_${id}`, paid: true, captured: true, currency: "usd", amount_captured: cents, amount_refunded: refund,
    } } },
  } as unknown as Stripe.InvoicePayment;
}

test("sums real payments and renewals including canceled/deleted customers, less partial and full refunds", async () => {
  const initial = payment("initial");
  const renewal = payment("renewal", "monthly", 200);
  const annual = payment("old_annual", "annual");
  const fullyRefunded = payment("refund", "annual", 7900);
  const result = await collectedRevenue(prices, new Set(), async () => ({ data: [initial, renewal, annual, fullyRefunded], has_more: false }));
  assert.deepEqual(result, { monthlyCollectedCents: 1600, annualCollectedCents: 7900, refundedCents: 8100, totalCollectedCents: 9500 });
});

test("excludes other products, Shift invoices, free, discounted and unpaid payments", async () => {
  const other = payment("other");
  const otherInvoice = other.invoice as Stripe.Invoice;
  otherInvoice.lines.data[0].pricing!.price_details!.price = "price_other";
  const shift = payment("shift"); (shift.invoice as Stripe.Invoice).metadata!.app = "shift-funnel";
  const promo = payment("promo"); (promo.invoice as Stripe.Invoice).discounts = ["di_promo"];
  const itemPromo = payment("item_promo");
  (itemPromo.invoice as Stripe.Invoice).lines.data[0].discount_amounts = [{ amount: 100, discount: "di_item" }];
  const free = payment("free"); free.amount_paid = 0;
  const unpaid = payment("unpaid"); unpaid.status = "open";
  const result = await collectedRevenue(prices, new Set(), async () => ({ data: [other, shift, promo, itemPromo, free, unpaid], has_more: false }));
  assert.equal(result.totalCollectedCents, 0);
});

test("paginates and deduplicates payment records without substituting subscription list prices", async () => {
  const paid = payment("paid"); paid.amount_paid = 400;
  const charge = (paid.payment.payment_intent as Stripe.PaymentIntent).latest_charge as Stripe.Charge;
  charge.amount_captured = 400;
  const calls: Stripe.InvoicePaymentListParams[] = [];
  const result = await collectedRevenue(prices, new Set(), async params => {
    calls.push(params);
    return params.starting_after ? { data: [paid, payment("annual", "annual")], has_more: false }
      : { data: [paid], has_more: true };
  });
  assert.equal(calls[1].starting_after, "paid");
  assert.equal(result.monthlyCollectedCents, 400);
  assert.equal(result.totalCollectedCents, 8300);
});

test("unverifiable cash/refund allocations, mixed invoices and missing pages fail closed", async () => {
  const unexpanded = payment("unexpanded"); unexpanded.payment.payment_intent = "pi_unexpanded";
  const partial = payment("partial"); partial.amount_paid = 450;
  const unknownPrice = payment("known");
  (unknownPrice.invoice as Stripe.Invoice).lines.data[0].pricing!.price_details!.price = "price_unknown";
  for (const row of [unexpanded, partial, unknownPrice]) {
    await assert.rejects(collectedRevenue(prices, new Set(["sub_known"]), async () => ({ data: [row], has_more: false })));
  }
  await assert.rejects(collectedRevenue(prices, new Set(), async () => ({ data: [], has_more: true })));
  await assert.rejects(collectedRevenue(prices, new Set(), async () => { throw new Error("Stripe unavailable"); }));
});

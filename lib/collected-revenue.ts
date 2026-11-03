import type Stripe from "stripe";
import { invoiceSubscriptionId } from "./billing-recovery-policy.ts";

type Plan = "monthly" | "annual";
type PaymentPage = { data: Stripe.InvoicePayment[]; has_more: boolean };
type PaymentList = (params: Stripe.InvoicePaymentListParams) => Promise<PaymentPage>;

/** Historical Stripe cash receipts, including renewals and canceled/deleted customers. */
export async function collectedRevenue(
  prices: { monthlyPrice: string; annualPrice: string },
  linkedSubscriptions: Set<string>,
  list: PaymentList,
) {
  if (!prices.monthlyPrice || !prices.annualPrice) throw new Error("Missing CBP price identifiers.");
  const plans = new Map<string, Plan>([[prices.monthlyPrice, "monthly"], [prices.annualPrice, "annual"]]);
  const totals = { monthlyCollectedCents: 0, annualCollectedCents: 0, refundedCents: 0 };
  const seenPayments = new Set<string>();
  const seenCharges = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ status: "paid", limit: 25,
      expand: ["data.invoice", "data.payment.payment_intent.latest_charge", "data.payment.charge"],
      ...(cursor ? { starting_after: cursor } : {}),
    });
    for (const payment of page.data) {
      if (seenPayments.has(payment.id)) continue;
      seenPayments.add(payment.id);
      if (payment.status !== "paid" || !payment.amount_paid || payment.amount_paid <= 0) continue;
      const invoice = payment.invoice;
      if (typeof invoice === "string" || "deleted" in invoice) throw new Error("Invoice ownership unavailable.");
      if (invoice.metadata?.app === "shift-funnel" ||
        invoice.parent?.subscription_details?.metadata?.app === "shift-funnel") continue;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const owned = Boolean(subscriptionId && linkedSubscriptions.has(subscriptionId));
      const linePlans = invoice.lines.data.filter(line => line.subtotal !== 0).map(line => {
        const price = line.pricing?.price_details?.price;
        return plans.get(typeof price === "string" ? price : price?.id ?? "");
      });
      if (!owned && !linePlans.some(Boolean)) continue;
      if (invoice.lines.has_more || !linePlans.length || linePlans.some(plan => !plan) ||
        new Set(linePlans).size !== 1) throw new Error("Cannot reconcile mixed or incomplete CBP invoice.");
      // Free/promo receipts never contribute list-price revenue.
      if (invoice.discounts.length || invoice.lines.data.some(line => line.discount_amounts?.some(discount => discount.amount > 0))) continue;
      if (payment.currency !== "usd" || invoice.currency !== "usd") throw new Error("Unsupported receipt currency.");
      const intent = payment.payment.payment_intent;
      const charge = payment.payment.type === "charge" ? payment.payment.charge
        : typeof intent === "object" && intent ? intent.latest_charge : null;
      if (!charge || typeof charge === "string" || !charge.paid || !charge.captured ||
        charge.currency !== "usd" || charge.amount_captured !== payment.amount_paid || seenCharges.has(charge.id)) {
        throw new Error("Cannot reconcile invoice cash payment and refunds.");
      }
      seenCharges.add(charge.id);
      if (!Number.isSafeInteger(payment.amount_paid) || !Number.isSafeInteger(charge.amount_refunded) ||
        charge.amount_refunded < 0 || charge.amount_refunded > charge.amount_captured) throw new Error("Invalid receipt or refund amount.");
      const collected = payment.amount_paid - charge.amount_refunded;
      totals.refundedCents += charge.amount_refunded;
      if (linePlans[0] === "annual") totals.annualCollectedCents += collected;
      else totals.monthlyCollectedCents += collected;
    }
    if (!page.has_more) break;
    const next = page.data.at(-1)?.id;
    if (!next || next === cursor) throw new Error("Incomplete payment pagination.");
    cursor = next;
  } while (true);
  return { ...totals, totalCollectedCents: totals.monthlyCollectedCents + totals.annualCollectedCents };
}

import type Stripe from "stripe";

export type RevenueSite = {
  siteId: string;
  status: string;
  plan: string | null;
  stripeSubscriptionId: string | null;
};

type SubscriptionPage = { data: Stripe.Subscription[]; has_more: boolean };
type ListSubscriptions = (params: { status: "active"; limit: number; starting_after?: string }) => Promise<SubscriptionPage>;

/** Only count verified, active, full-price USD sites belonging to this application. */
export async function subscriberRevenue(sites: RevenueSite[], list: ListSubscriptions) {
  const candidates = sites.filter(site => site.status === "active" &&
    (site.plan === "monthly" || site.plan === "annual") && site.stripeSubscriptionId?.startsWith("sub_"));
  const linked = new Set(candidates.map(site => site.stripeSubscriptionId));
  const remote = new Map<string, Stripe.Subscription>();
  if (linked.size) {
    let cursor: string | undefined;
    do {
      const page = await list({ status: "active", limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
      for (const subscription of page.data) {
        if (linked.has(subscription.id)) remote.set(subscription.id, subscription);
      }
      if (!page.has_more) break;
      const next = page.data.at(-1)?.id;
      if (!next || next === cursor) throw new Error("Incomplete subscription pagination.");
      cursor = next;
    } while (true);
  }

  const result = { monthlySites: 0, annualSites: 0, monthlyMrrCents: 0, annualSalesCents: 0 };
  const counted = new Set<string>();
  for (const site of candidates) {
    if (counted.has(site.siteId)) continue;
    const subscription = remote.get(site.stripeSubscriptionId!);
    // A local active record may have been canceled since its last webhook.
    if (!subscription || subscription.status !== "active" || subscription.pause_collection ||
      subscription.discounts.length || subscription.items.data.some(item => item.discounts.length)) continue;
    if (subscription.items.has_more) throw new Error("Incomplete subscription items.");
    const interval = site.plan === "annual" ? "year" : "month";
    let cents = 0;
    let eligible = subscription.items.data.length > 0;
    for (const item of subscription.items.data) {
      const price = item.price;
      const amount = price.unit_amount ?? Number(price.unit_amount_decimal);
      const quantity = item.quantity ?? 1;
      if (price.currency !== "usd" || price.billing_scheme !== "per_unit" ||
        price.recurring?.interval !== interval || price.recurring.interval_count !== 1 ||
        price.recurring.usage_type !== "licensed" || !Number.isFinite(amount) || amount <= 0 || quantity <= 0) {
        eligible = false;
        break;
      }
      cents += amount * quantity;
    }
    if (!eligible) continue;
    counted.add(site.siteId);
    if (site.plan === "annual") {
      result.annualSites += 1;
      result.annualSalesCents += cents;
    } else {
      result.monthlySites += 1;
      result.monthlyMrrCents += cents;
    }
  }
  return result;
}

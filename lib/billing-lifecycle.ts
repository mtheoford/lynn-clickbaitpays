import type Stripe from "stripe";

export type PublishableSiteStatus =
  | "pending"
  | "active"
  | "past_due"
  | "suspended"
  | "canceled";

export function stripeTimestamp(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

export function subscriptionPeriodEnd(
  subscription: Pick<Stripe.Subscription, "items">,
): Date | null {
  const timestamps = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  return timestamps.length ? stripeTimestamp(Math.max(...timestamps)) : null;
}

export function siteStatusForSubscription(
  status: Stripe.Subscription.Status,
  currentPeriodEnd: Date | null,
  now = new Date(),
): PublishableSiteStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "paused") return "suspended";
  if (status === "canceled" && currentPeriodEnd && currentPeriodEnd > now) {
    return "active";
  }
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "pending";
}

export function gracePeriodEnd(now = new Date(), days = 7): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function graceHasExpired(
  graceEndsAt: Date | null,
  now = new Date(),
): boolean {
  return Boolean(graceEndsAt && graceEndsAt <= now);
}

export function paidThroughHasExpired(
  currentPeriodEnd: Date | null,
  now = new Date(),
): boolean {
  return Boolean(currentPeriodEnd && currentPeriodEnd <= now);
}

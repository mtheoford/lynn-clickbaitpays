export type BillingNotice = "reminder" | "suspension";
const DAY = 24 * 60 * 60 * 1000;

export function invoiceSubscriptionId(invoice: {
  parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
  subscription?: string | { id: string } | null;
}): string | null {
  const value = invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
  return typeof value === "string" ? value : value?.id ?? null;
}

export function dueBillingNotice(record: {
  graceEndsAt: Date;
  reminderSentAt: Date | null;
  suspensionSentAt: Date | null;
  closedAt: Date | null;
}, siteStatus: string, now = new Date()): BillingNotice | null {
  if (record.closedAt) return null;
  if (now >= record.graceEndsAt) {
    return siteStatus === "suspended" && !record.suspensionSentAt ? "suspension" : null;
  }
  if (siteStatus !== "past_due") return null;
  if (now.getTime() >= record.graceEndsAt.getTime() - DAY) {
    return record.reminderSentAt ? null : "reminder";
  }
  return null;
}

export function recoveryStillOutstanding(input: {
  invoiceId: string;
  subscriptionId: string;
  customerId: string;
  invoice: {
    id: string;
    status: string | null;
    amount_remaining: number;
    customer: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
    subscription?: string | { id: string } | null;
  };
  subscription: {
    id: string;
    status: string;
    latest_invoice: string | { id: string } | null;
    customer: string | { id: string };
  };
}): boolean {
  const id = (value: string | { id: string } | null) => typeof value === "string" ? value : value?.id;
  return input.invoice.id === input.invoiceId &&
    input.invoice.status === "open" && input.invoice.amount_remaining > 0 &&
    invoiceSubscriptionId(input.invoice) === input.subscriptionId &&
    input.subscription.id === input.subscriptionId &&
    id(input.invoice.customer) === input.customerId &&
    id(input.subscription.customer) === input.customerId &&
    id(input.subscription.latest_invoice) === input.invoiceId &&
    ["past_due", "unpaid"].includes(input.subscription.status);
}

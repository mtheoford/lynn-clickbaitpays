export const BILLING_ATTENTION_AFTER_MS = 30 * 60 * 1000;
export const BILLING_MAX_ATTEMPTS = 12;

export function accountBillingLabel(input: {
  subscriptionStatus: string | null;
  checkoutPaymentStatus: string | null;
  siteStatus: string;
}): string {
  if (input.subscriptionStatus) return input.subscriptionStatus;
  if (input.siteStatus === "deleted") return "Account deleted";
  if (input.checkoutPaymentStatus === "paid") return "Paid — activation delayed";
  if (input.checkoutPaymentStatus === "no_payment_required") return "Checkout complete — activation delayed";
  return "Payment not confirmed";
}

export function billingAlertId(appEnv: string, now: Date): string {
  return `billing-health-${appEnv}-${now.toISOString().slice(0, 10)}`;
}

export function validBillingAlertRecipient(value: string): boolean {
  return /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(value);
}

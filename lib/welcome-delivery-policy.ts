export const WELCOME_SEND_LEASE_MS = 5 * 60 * 1000;
export const WELCOME_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;
export const WELCOME_MAX_ATTEMPTS = 6;
export const WELCOME_STATUS_POLL_MS = 6 * 60 * 60 * 1000;
export const WELCOME_STATUS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type WelcomeDeliveryStatus = "pending" | "sending" | "accepted" | "delivered" | "bounced" | "complained" | "failed" | "needs_review" | "canceled" | "legacy_unknown";

export function welcomeDeliveryLabel(status: string | null | undefined): string {
  const labels: Record<WelcomeDeliveryStatus, string> = {
    pending: "Queued", sending: "Sending", accepted: "Accepted by email provider",
    delivered: "Delivered", bounced: "Bounced", complained: "Marked as spam",
    failed: "Send failed — retry scheduled", needs_review: "Needs review before resending",
    canceled: "Not sent — site unavailable", legacy_unknown: "Not tracked before rollout",
  };
  return status && status in labels ? labels[status as WelcomeDeliveryStatus] : "No tracked welcome email";
}

export function welcomeRetryDelayMs(attempts: number): number {
  return Math.min(60 * 60 * 1000, 5 * 60 * 1000 * 2 ** Math.max(0, attempts - 1));
}

export function welcomeSendNeedsReview(attempts: number, firstAttemptAt: Date | null, now: Date): boolean {
  return attempts >= WELCOME_MAX_ATTEMPTS || Boolean(firstAttemptAt && now.getTime() - firstAttemptAt.getTime() >= WELCOME_RETRY_WINDOW_MS);
}

export function welcomeStatusForProviderEvent(event: string | null): WelcomeDeliveryStatus {
  if (event === "delivered" || event === "opened" || event === "clicked") return "delivered";
  if (event === "bounced") return "bounced";
  if (event === "suppressed" || event === "failed" || event === "canceled") return "needs_review";
  if (event === "complained") return "complained";
  return "accepted";
}

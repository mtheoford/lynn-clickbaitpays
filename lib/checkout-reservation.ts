export type ReservationDecision = "new" | "reuse" | "replace" | "reserved" | "retained";

export function checkoutReservationDecision(
  existing: {
    userId: string;
    status: string;
    reservationExpiresAt: Date | null;
  } | null | undefined,
  purchaserUserId: string | null | undefined,
  now = new Date(),
): ReservationDecision {
  if (!existing) return "new";
  if (existing.status !== "pending") return "retained";

  const expired =
    !existing.reservationExpiresAt ||
    existing.reservationExpiresAt.getTime() <= now.getTime();
  if (expired) return "replace";
  return existing.userId === purchaserUserId ? "reuse" : "reserved";
}

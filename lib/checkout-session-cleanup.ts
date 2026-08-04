export interface CheckoutSessionCleanupApi {
  retrieve(sessionId: string): Promise<{
    id: string;
    status: string | null;
  }>;
  expire(sessionId: string): Promise<unknown>;
}

export async function prepareCheckoutSessionForReservationCleanup(
  sessionId: string,
  sessions: CheckoutSessionCleanupApi,
): Promise<"delete" | "retain"> {
  const session = await sessions.retrieve(sessionId);

  if (session.status === "expired") return "delete";
  if (session.status !== "open") return "retain";

  await sessions.expire(session.id);
  return "delete";
}

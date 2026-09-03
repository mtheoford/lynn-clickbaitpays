export const INVALID_MAGIC_LINK_MESSAGE =
  "That sign-in link has expired or was already used. Request a fresh link below, then open the newest email within 15 minutes.";

export type CustomerMagicLinkSession = {
  sessionToken: string;
  expiresAt: Date;
  userId: string;
};

export function customerSignInErrorMessage(
  error: string | string[] | undefined,
): string | null {
  const errorCode = Array.isArray(error) ? error[0] : error;
  return errorCode === "invalid-link" ? INVALID_MAGIC_LINK_MESSAGE : null;
}

export async function inspectCustomerMagicLink(
  token: string,
  isValid: (token: string) => Promise<boolean>,
): Promise<boolean> {
  return isValid(token);
}

export async function completeCustomerMagicLinkSignIn(
  token: string,
  dependencies: {
    consume: (token: string) => Promise<CustomerMagicLinkSession | null>;
    setSessionCookie: (sessionToken: string, expiresAt: Date) => Promise<void>;
    recordAuthenticated: (userId: string) => Promise<void>;
  },
): Promise<boolean> {
  const session = await dependencies.consume(token);
  if (!session) return false;

  await dependencies.setSessionCookie(session.sessionToken, session.expiresAt);
  await dependencies.recordAuthenticated(session.userId);
  return true;
}

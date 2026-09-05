import { isSiteLocale, localizedPath, type SiteLocale } from "./i18n.ts";

export const INVALID_MAGIC_LINK_MESSAGE =
  "That sign-in link has expired or was already used. Request a fresh link below, then open the newest email within 15 minutes.";

export const INVALID_MAGIC_LINK_MESSAGE_FR =
  "Ce lien de connexion a expiré ou a déjà été utilisé. Demandez un nouveau lien ci-dessous, puis ouvrez l’e-mail le plus récent dans les 15 minutes.";

export const INVALID_MAGIC_LINK_MESSAGE_DE =
  "Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Fordern Sie unten einen neuen Link an und öffnen Sie die neueste E-Mail innerhalb von 15 Minuten.";

export type CustomerAuthLocale = SiteLocale;

export type CustomerMagicLinkSession = {
  sessionToken: string;
  expiresAt: Date;
  userId: string;
};

export function customerSignInErrorMessage(
  error: string | string[] | undefined,
  locale: CustomerAuthLocale = "en",
): string | null {
  const errorCode = Array.isArray(error) ? error[0] : error;
  if (errorCode !== "invalid-link") return null;
  if (locale === "de") return INVALID_MAGIC_LINK_MESSAGE_DE;
  return locale === "fr"
    ? INVALID_MAGIC_LINK_MESSAGE_FR
    : INVALID_MAGIC_LINK_MESSAGE;
}

export function customerAuthLocale(
  value: string | string[] | null | undefined,
): CustomerAuthLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && isSiteLocale(candidate) ? candidate : "en";
}

export function customerManagePath(
  locale: CustomerAuthLocale,
  suffix = "",
): string {
  const normalizedSuffix = suffix && !suffix.startsWith("/")
    ? `/${suffix}`
    : suffix;
  return localizedPath(locale, `/manage${normalizedSuffix}`);
}

export function customerSignOutPath(locale: CustomerAuthLocale = "en"): string {
  return locale === "en" ? "/api/auth/sign-out" : `/api/auth/sign-out?locale=${locale}`;
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

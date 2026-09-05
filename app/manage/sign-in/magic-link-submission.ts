import type { SiteLocale } from "@/lib/i18n";

export const MAGIC_LINK_SUCCESS_MESSAGE =
  "If that email is connected to a site, a secure sign-in link is on its way.";
export const MAGIC_LINK_SUCCESS_MESSAGE_FR =
  "Si cette adresse e-mail est associée à un site, un lien de connexion sécurisé vient de vous être envoyé.";

export const MAGIC_LINK_SUCCESS_MESSAGE_DE =
  "Wenn diese E-Mail-Adresse mit einer Website verknüpft ist, erhalten Sie einen sicheren Anmeldelink.";

type MagicLinkForm = Pick<HTMLFormElement, "reset">;
type MagicLinkFetch = (
  input: string,
  init: RequestInit,
) => Promise<{ ok: boolean }>;

export async function submitMagicLinkRequest(
  email: FormDataEntryValue | null,
  formElement: MagicLinkForm,
  request: MagicLinkFetch = fetch,
  locale: SiteLocale = "en",
): Promise<string> {
  const response = await request("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });
  if (!response.ok) {
    if (locale === "de") throw new Error("Die E-Mail mit dem Anmeldelink konnte nicht gesendet werden.");
    throw new Error(locale === "fr"
      ? "Impossible d’envoyer l’e-mail de connexion."
      : "Sign-in email could not be sent.");
  }

  try {
    formElement.reset();
  } catch (error) {
    console.error("Sign-in form could not be reset after a successful request.", error);
  }
  if (locale === "de") return MAGIC_LINK_SUCCESS_MESSAGE_DE;
  return locale === "fr"
    ? MAGIC_LINK_SUCCESS_MESSAGE_FR
    : MAGIC_LINK_SUCCESS_MESSAGE;
}

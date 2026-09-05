import type { SiteLocale } from "./i18n.ts";

export function buildMagicLinkEmail(input: {
  name: string;
  token: string;
  origin: string;
  locale: SiteLocale;
}) {
  const verifyUrl = new URL("/auth/verify", input.origin);
  verifyUrl.searchParams.set("token", input.token);
  if (input.locale !== "en") verifyUrl.searchParams.set("locale", input.locale);
  const copy = {
    en: {
      subject: "Sign in to manage your ProNeurs site",
      greeting: "Hi",
      instruction: "Use this secure link to manage your ProNeurs Personal CBP Site:",
      action: "Sign in to manage your site",
      expiry: "This link expires in 15 minutes and can be used only once.",
    },
    fr: {
      subject: "Connectez-vous pour gérer votre site ProNeurs",
      greeting: "Bonjour",
      instruction: "Utilisez ce lien sécurisé pour gérer votre site CBP personnel ProNeurs :",
      action: "Connectez-vous pour gérer votre site",
      expiry: "Ce lien expire après 15 minutes et ne peut être utilisé qu’une seule fois.",
    },
    de: {
      subject: "Melden Sie sich an, um Ihre ProNeurs-Website zu verwalten",
      greeting: "Guten Tag",
      instruction: "Verwenden Sie diesen sicheren Link, um Ihre persönliche CBP-Website von ProNeurs zu verwalten:",
      action: "Anmelden und Ihre Website verwalten",
      expiry: "Dieser Link ist 15 Minuten gültig und kann nur einmal verwendet werden.",
    },
  }[input.locale];
  return {
    verifyUrl: verifyUrl.toString(),
    subject: copy.subject,
    text: `${copy.greeting} ${input.name},\n\n${copy.instruction}\n${verifyUrl}\n\n${copy.expiry}`,
    html: `<div lang="${input.locale}"><p>${copy.greeting} ${escapeHtml(input.name)},</p><p><a href="${escapeHtml(verifyUrl.toString())}">${copy.action}</a></p><p>${copy.expiry}</p></div>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

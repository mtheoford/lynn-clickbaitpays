import type { SiteLocale } from "./i18n.ts";
import type { BillingNotice } from "./billing-recovery-policy.ts";

export function buildBillingRecoveryEmail(input: {
  notice: BillingNotice;
  name: string;
  siteAddress: string;
  graceEndsAt: Date;
  paymentUrl: string | null;
  manageUrl: string;
  supportEmail: string;
  locale: SiteLocale;
}) {
  const { notice, locale } = input;
  const deadline = new Intl.DateTimeFormat({ en: "en-US", fr: "fr-FR", de: "de-DE" }[locale], {
    timeZone: "UTC", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(input.graceEndsAt);
  const copy = {
    en: {
      subjects: { reminder: "Reminder: your ProNeurs site will be suspended soon", suspension: "Your ProNeurs site is temporarily suspended" },
      greeting: `Hi ${input.name},`,
      intro: notice === "suspension" ? `Your replicated site, ${input.siteAddress}, is temporarily suspended because your subscription payment remains unpaid.` : `We couldn't process the subscription payment for your replicated site, ${input.siteAddress}.`,
      timing: notice === "suspension" ? "Your site details are still saved. Once the outstanding invoice is paid and your subscription is active, your site can be restored automatically." : `Your site remains online during the seven-day recovery period. Please resolve the payment before ${deadline} to avoid temporary suspension.`,
      action: input.paymentUrl ? "Pay securely with Stripe" : "Manage billing with Stripe",
      account: "To update your payment method, sign in using the email address used during purchase and select Manage billing.",
      manage: "Manage your payment information", support: "Need help?", brand: "ProNeurs Personal CBP Sites",
    },
    fr: {
      subjects: { reminder: "Rappel : votre site ProNeurs sera bientôt suspendu", suspension: "Votre site ProNeurs est temporairement suspendu" },
      greeting: `Bonjour ${input.name},`,
      intro: notice === "suspension" ? `Votre site répliqué, ${input.siteAddress}, est temporairement suspendu car le paiement de votre abonnement reste impayé.` : `Nous n’avons pas pu traiter le paiement de l’abonnement pour votre site répliqué, ${input.siteAddress}.`,
      timing: notice === "suspension" ? "Les informations de votre site sont conservées. Une fois la facture réglée et l’abonnement actif, votre site peut être rétabli automatiquement." : `Votre site reste en ligne pendant le délai de régularisation de sept jours. Veuillez régler le paiement avant le ${deadline} pour éviter une suspension temporaire.`,
      action: input.paymentUrl ? "Payer en toute sécurité avec Stripe" : "Gérer la facturation avec Stripe",
      account: "Pour mettre à jour votre moyen de paiement, connectez-vous avec l’adresse e-mail utilisée lors de l’achat et sélectionnez Gérer la facturation.",
      manage: "Gérer vos informations de paiement", support: "Besoin d’aide ?", brand: "Sites CBP personnels ProNeurs",
    },
    de: {
      subjects: { reminder: "Erinnerung: Ihre ProNeurs-Website wird bald gesperrt", suspension: "Ihre ProNeurs-Website ist vorübergehend gesperrt" },
      greeting: `Guten Tag ${input.name},`,
      intro: notice === "suspension" ? `Ihre replizierte Website ${input.siteAddress} ist vorübergehend gesperrt, da Ihre Abonnementzahlung noch offen ist.` : `Wir konnten die Abonnementzahlung für Ihre replizierte Website ${input.siteAddress} nicht verarbeiten.`,
      timing: notice === "suspension" ? "Ihre Website-Daten bleiben gespeichert. Sobald die offene Rechnung bezahlt und Ihr Abonnement aktiv ist, kann Ihre Website automatisch wiederhergestellt werden." : `Ihre Website bleibt während der siebentägigen Zahlungsfrist online. Bitte klären Sie die Zahlung vor ${deadline}, um eine vorübergehende Sperrung zu vermeiden.`,
      action: input.paymentUrl ? "Sicher mit Stripe bezahlen" : "Abrechnung mit Stripe verwalten",
      account: "Um Ihre Zahlungsmethode zu aktualisieren, melden Sie sich mit der beim Kauf verwendeten E-Mail-Adresse an und wählen Sie Abrechnung verwalten.",
      manage: "Zahlungsinformationen verwalten", support: "Benötigen Sie Hilfe?", brand: "Persönliche CBP-Websites von ProNeurs",
    },
  }[locale];
  const paymentUrl = input.paymentUrl ?? input.manageUrl;
  const text = `${copy.greeting}\n\n${copy.intro}\n\n${copy.timing}\n\n${copy.action}:\n${paymentUrl}\n\n${copy.account}\n${input.manageUrl}\n\n${copy.support} ${input.supportEmail}`;
  const html = `<div lang="${locale}" style="background:#080b14;padding:32px 16px;color:#f5f7ff;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;border:1px solid #242b41;border-radius:18px;background:#101522;padding:32px;line-height:1.65"><p style="color:#2ee7f2">${escapeHtml(copy.brand)}</p><h1 style="font-size:25px;line-height:1.3">${escapeHtml(copy.subjects[notice])}</h1><p>${escapeHtml(copy.greeting)}</p><p>${escapeHtml(copy.intro)}</p><p>${escapeHtml(copy.timing)}</p><p style="margin:26px 0"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block;border-radius:9px;background:#2ee7f2;padding:13px 20px;color:#071015;font-weight:700;text-decoration:none">${escapeHtml(copy.action)}</a></p><p>${escapeHtml(copy.account)}</p><p><a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2">${escapeHtml(copy.manage)}</a></p><p>${escapeHtml(copy.support)} <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#2ee7f2">${escapeHtml(input.supportEmail)}</a></p></div></div>`;
  return { subject: copy.subjects[notice], text, html };
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
  return value.replace(/[&<>'"]/g, (character) => entities[character]);
}

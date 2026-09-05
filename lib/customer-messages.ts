import type { SiteLocale } from "./i18n.ts";

const germanErrors: Record<string, string> = {
  "Request origin could not be verified.": "Die Herkunft der Anfrage konnte nicht überprüft werden.",
  "Not authorized.": "Bitte melden Sie sich an, um fortzufahren.",
  "No active Stripe billing account was found.": "Es wurde kein aktives Stripe-Abrechnungskonto gefunden.",
  "Billing access is not configured yet.": "Die Abrechnungsverwaltung ist derzeit nicht verfügbar.",
  "The signup details could not be read.": "Die Anmeldedaten konnten nicht gelesen werden.",
  "The site details could not be read.": "Die Website-Daten konnten nicht gelesen werden.",
  "Checkout is being connected now. Your information has not been submitted or saved.": "Die Zahlungsfunktion wird gerade eingerichtet. Ihre Angaben wurden weder übermittelt noch gespeichert.",
  "Enter a valid first name.": "Geben Sie einen gültigen Vornamen ein.",
  "Enter a valid last name.": "Geben Sie einen gültigen Nachnamen ein.",
  "Keep your full name under 120 characters.": "Ihr vollständiger Name darf höchstens 120 Zeichen lang sein.",
  "Keep the company name under 120 characters.": "Der Firmenname darf höchstens 120 Zeichen lang sein.",
  "Choose whether to display your personal name or business name.": "Wählen Sie aus, ob Ihr persönlicher Name oder Ihr Firmenname angezeigt werden soll.",
  "Enter a valid email address.": "Geben Sie eine gültige E-Mail-Adresse ein.",
  "Enter a valid phone number.": "Geben Sie eine gültige Telefonnummer ein.",
  "Enter a valid public email address.": "Geben Sie eine gültige öffentliche E-Mail-Adresse ein.",
  "Enter a valid public phone number.": "Geben Sie eine gültige öffentliche Telefonnummer ein.",
  "Keep your introduction between 20 and 400 characters.": "Ihr Vorstellungstext muss zwischen 20 und 400 Zeichen lang sein.",
  "Enter your complete ClickBaitPays referral link.": "Geben Sie Ihren vollständigen ClickBaitPays-Empfehlungslink ein.",
  "Use an official https://clickbaitpays.me referral link.": "Verwenden Sie einen offiziellen Empfehlungslink von https://clickbaitpays.me.",
  "Your ClickBaitPays link must include its referral code.": "Ihr ClickBaitPays-Link muss Ihren Empfehlungscode enthalten.",
  "Choose a site name with at least three characters.": "Wählen Sie einen Website-Namen mit mindestens drei Zeichen.",
  "That site name is reserved. Please choose another.": "Dieser Website-Name ist reserviert. Bitte wählen Sie einen anderen.",
  "Use letters, numbers, and single hyphens only.": "Verwenden Sie nur Buchstaben, Zahlen und einzelne Bindestriche.",
  "Accept the service terms and disclosures to continue.": "Akzeptieren Sie die Nutzungsbedingungen und Hinweise, um fortzufahren.",
  "That site address already belongs to an active or retained account.": "Diese Website-Adresse gehört bereits zu einem aktiven oder weiterhin gespeicherten Konto.",
  "That site address is already reserved. Please choose another.": "Diese Website-Adresse ist bereits reserviert. Bitte wählen Sie eine andere.",
  "That site address was just claimed. Please enter another name.": "Diese Website-Adresse wurde gerade vergeben. Bitte geben Sie einen anderen Namen ein.",
  "Your previous checkout has completed and the site is still being activated. Please wait a moment, then sign in.": "Ihre vorherige Zahlung ist abgeschlossen und Ihre Website wird noch aktiviert. Warten Sie einen Moment und melden Sie sich dann an.",
  "Stripe did not return a checkout address.": "Stripe hat keinen Link zur Zahlung zurückgegeben.",
  "Site not found.": "Website nicht gefunden.",
  "The site address could not be checked.": "Die Website-Adresse konnte nicht überprüft werden.",
  "This site address is available.": "Diese Website-Adresse ist verfügbar.",
  "That site address is already taken. Please enter another name.": "Diese Website-Adresse ist bereits vergeben. Bitte geben Sie einen anderen Namen ein.",
};

export function localizedCustomerError(message: string, locale: SiteLocale): string {
  if (locale !== "de") return message;
  const existingSite = /^That email already manages (.+)\. Sign in to update or reactivate the existing site\.$/.exec(message);
  if (existingSite) {
    return `Diese E-Mail-Adresse verwaltet bereits ${existingSite[1]}. Melden Sie sich an, um die vorhandene Website zu bearbeiten oder wieder zu aktivieren.`;
  }
  return germanErrors[message] ?? message;
}

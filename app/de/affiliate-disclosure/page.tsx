import GermanLegalPage, { germanLegalMetadata, GermanSupportContact } from "../legal-page";

export const metadata = germanLegalMetadata({ path: "affiliate-disclosure", title: "Affiliate-Hinweise", description: "Informationen zur Unabhängigkeit von Sponsorseiten und zu möglichen Empfehlungsvergütungen." });

export default function GermanAffiliateDisclosurePage() {
  return (
    <GermanLegalPage eyebrow="Offenlegung der Beziehung" title="Affiliate-Hinweise" summary="Persönliche CBP-Websites sind unabhängige Sponsorseiten und können Empfehlungslinks enthalten, die eine Vergütung auslösen.">
      <h2>Unabhängige Website</h2><p>ProNeurs™ und jede persönliche Sponsorseite sind unabhängig von ClickBaitPays. Hinweise auf ClickBaitPays bedeuten nicht, dass ClickBaitPays die Website besitzt, betreibt, billigt oder kontrolliert.</p>
      <h2>Empfehlungsvergütung</h2><p>Wenn ein Besucher dem Empfehlungslink eines Sponsors folgt und anschließend am Programm teilnimmt, kann der Sponsor gemäß den dann geltenden Empfehlungsregeln des Drittanbieters eine Vergütung erhalten. Dies erhöht nicht den Preis des ProNeurs™-Website-Abonnements und garantiert weder dem Besucher noch dem Sponsor ein Ergebnis.</p>
      <h2>Risiken und Ergebnisse</h2><p>Die Teilnahme an einem Dienst Dritter kann Kryptowährungen, Gebühren, Verluste, Regeländerungen und betriebliche Risiken beinhalten. Einnahmen und Auszahlungen sind nicht garantiert. Lesen Sie die aktuellen offiziellen Bedingungen und führen Sie eigene Prüfungen durch, bevor Sie handeln.</p>
      <h2>Fragen</h2><p>Bei Fragen zu diesen Hinweisen schreiben Sie an <GermanSupportContact />.</p>
    </GermanLegalPage>
  );
}

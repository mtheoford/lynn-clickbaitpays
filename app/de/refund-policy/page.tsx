import GermanLegalPage, { germanLegalMetadata, GermanSupportContact } from "../legal-page";

export const metadata = germanLegalMetadata({ path: "refund-policy", title: "Kündigung und Erstattungen", description: "Regeln für Kündigungen, fehlgeschlagene Zahlungen und Erstattungen bei persönlichen CBP-Websites." });

export default function GermanRefundPolicyPage() {
  return (
    <GermanLegalPage eyebrow="Abrechnungsrichtlinie" title="Kündigung und Erstattungen" summary="Abonnements können über Stripe gekündigt werden und bleiben normalerweise bis zum Ende des bezahlten Zeitraums aktiv.">
      <h2>Kündigung</h2><p>Kunden können jederzeit im Abrechnungsportal kündigen. Die Kündigung beendet zukünftige Verlängerungen. Sofern Stripe kein anderes Datum anzeigt, bleibt die Website bis zum Ende des laufenden bezahlten Zeitraums veröffentlicht und wird danach offline genommen.</p>
      <h2>Fehlgeschlagene Zahlungen</h2><p>Wenn eine Verlängerungszahlung fehlschlägt, kann ProNeurs™ die Website während einer siebentägigen Nachfrist verfügbar halten. Wird die Zahlung nicht beglichen, kann die Website gesperrt werden, bis das Abrechnungsproblem behoben ist.</p>
      <h2>Erstattungen</h2><p>Abonnementgebühren werden grundsätzlich nicht erstattet, sobald der Leistungszeitraum begonnen hat. ProNeurs™ prüft doppelte Abbuchungen, nicht autorisierte Zahlungen, erhebliche Leistungsausfälle und gesetzlich vorgeschriebene Erstattungen. Eine Kündigung führt nicht automatisch zu einer Erstattung für den laufenden Zeitraum.</p>
      <h2>Eine Prüfung beantragen</h2><p>Schreiben Sie an <GermanSupportContact /> und nennen Sie die E-Mail-Adresse des Kontos, das Zahlungsdatum und den Grund Ihrer Anfrage. Senden Sie keine Kartennummern, Wallet-Zugangsdaten oder Passwörter.</p>
    </GermanLegalPage>
  );
}

import GermanLegalPage, { germanLegalMetadata, GermanSupportContact } from "../legal-page";

export const metadata = germanLegalMetadata({ path: "acceptable-use", title: "Richtlinie zur zulässigen Nutzung", description: "Regeln für Inhalte und die Nutzung persönlicher CBP-Websites." });

export default function GermanAcceptableUsePage() {
  return (
    <GermanLegalPage eyebrow="Inhaltsstandards" title="Richtlinie zur zulässigen Nutzung" summary="Persönliche CBP-Websites müssen wahrheitsgemäß, rechtmäßig und sicher sein sowie mit den zentral gepflegten Informationen übereinstimmen.">
      <h2>Zulässige Nutzung</h2><p>Der Service darf zur Weitergabe freigegebener Informationsinhalte, Ihrer autorisierten Empfehlungs-URL, korrekter Kontaktdaten und einer sachlichen Sponsorvorstellung genutzt werden.</p>
      <h2>Unzulässige Nutzung</h2>
      <ul>
        <li>Nicht belegte und nicht freigegebene Aussagen über garantierte, typische, passive oder tägliche Einnahmen, Renteneinkünfte oder den Ersatz eines Gehalts.</li>
        <li>Falsche Erfahrungsberichte, erfundene Ergebnisse, Identitätsmissbrauch oder irreführende Angaben zu einer Zugehörigkeit.</li>
        <li>Spam, Nachrichten an gekaufte Kontaktlisten, automatisierter Missbrauch, täuschende Weiterleitungen, Phishing, Schadsoftware oder unsichere Links.</li>
        <li>Das Erfassen von Passwörtern, Wallet-Schlüsseln oder -Guthaben, Identitätsdokumenten oder Kartendaten.</li>
        <li>Rechtswidrige Aktivitäten, Umgehung von Sanktionen, Rechtsverletzungen, Belästigung oder diskriminierende Inhalte.</li>
        <li>Das Entfernen oder Verbergen zentraler Hinweise zu Risiken, Affiliate-Beziehungen, Datenschutz oder der Unabhängigkeit der Website.</li>
      </ul>
      <h2>Durchsetzung</h2><p>ProNeurs™ kann Inhalte korrigieren, Links deaktivieren, Websites sperren oder den Service beenden, wenn dies zum Schutz von Besuchern, Dienstleistern oder des Unternehmens angemessen erforderlich ist. Dringende Anliegen können Sie an <GermanSupportContact /> melden.</p>
    </GermanLegalPage>
  );
}

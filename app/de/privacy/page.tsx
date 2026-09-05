import GermanLegalPage, { germanLegalMetadata, GermanSupportContact } from "../legal-page";

export const metadata = germanLegalMetadata({ path: "privacy", title: "Datenschutzerklärung", description: "Informationen zu den Daten, die zur Bereitstellung und zum Schutz persönlicher CBP-Websites verwendet werden." });

export default function GermanPrivacyPage() {
  return (
    <GermanLegalPage eyebrow="Umgang mit Daten" title="Datenschutzerklärung" summary="Diese Erklärung beschreibt, welche Informationen ProNeurs™ zur Bereitstellung und zum Schutz persönlicher CBP-Websites verwendet.">
      <h2>Erfasste Informationen</h2>
      <p>Wir erfassen den Namen, die E-Mail-Adresse, Telefonnummer, gewünschte Website-Adresse, Sponsorvorstellung, Sichtbarkeitseinstellungen für Kontaktdaten und Empfehlungs-URL, die Sie bei der Anmeldung oder Bearbeitung Ihres Kontos angeben. Außerdem speichern wir Stripe-Kunden- und Abonnementkennungen, den Abonnementstatus, Sicherheits- und Prüfprotokolle sowie datensparsame Ereignisse zu Seitenaufrufen und ausgehenden Klicks. Im Browser wird eine zufällige, websitespezifische Kennung erstellt und vor der Speicherung gehasht; sie dient ausschließlich zur Schätzung der Anzahl unterschiedlicher Besucher. In den Analysedaten werden keine IP-Adressen gespeichert.</p>
      <h2>Nicht erfasste Informationen</h2>
      <p>Wir fragen weder ClickBaitPays-Passwörter, Schlüssel zu Kryptowallets, Wallet-Guthaben, vollständige Kartennummern noch Kreditanträge ab und speichern diese auch nicht.</p>
      <h2>Verwendung der Informationen</h2>
      <p>Wir verwenden die Informationen, um die gewünschte Website zu erstellen und zu betreiben, Kunden zu authentifizieren, Abonnements abzuwickeln, Missbrauch zu verhindern, Support anzubieten, grundlegende Website-Aktivitäten zu messen, Prüfprotokolle zu führen und gesetzliche Pflichten zu erfüllen.</p>
      <h2>Öffentliche Informationen</h2>
      <p>Ihr Anzeigename, Ihre Sponsorvorstellung, Ihre Empfehlungs-URL und die von Ihnen zur Veröffentlichung ausgewählten Kontaktdaten erscheinen auf Ihrer Sponsorseite. Sie können die Sichtbarkeitseinstellungen in Ihrem Kundenkonto ändern.</p>
      <h2>Dienstleister</h2>
      <p>Cloudflare stellt Hosting, Sicherheit und Dateninfrastruktur bereit. Stripe verarbeitet die Abrechnung. Der konfigurierte Anbieter für transaktionale E-Mails versendet Kontonachrichten. Diese Dienstleister verarbeiten Informationen nach ihren eigenen Verträgen und Datenschutzrichtlinien.</p>
      <h2>Speicherdauer und Sicherheit</h2>
      <p>Wir speichern Kontoinformationen, solange der Service aktiv ist. Wird ein berechtigter Löschantrag vorgemerkt, bleibt die Website während einer 30-tägigen Wiederherstellungsfrist nicht verfügbar und wird anschließend automatisch endgültig gelöscht. Stripe kann Finanzunterlagen aufbewahren. ProNeurs™ kann bestimmte nicht personenbezogene Prüfinformationen aufbewahren, soweit dies für Buchhaltung, Streitfälle, Betrugsprävention oder gesetzliche Pflichten erforderlich ist. Zugriffe sind beschränkt, Geheimnisse werden außerhalb des Quellcodes gespeichert und sensible Links sind kurzzeitig gültig und nur einmal verwendbar.</p>
      <h2>Ihre Möglichkeiten</h2>
      <p>Sie können Ihre öffentlichen Informationen und Sichtbarkeitseinstellungen aktualisieren, die Abrechnung über Stripe verwalten oder kündigen sowie Auskunft, Berichtigung oder Löschung Ihrer dafür infrage kommenden personenbezogenen Daten unter <GermanSupportContact /> beantragen. Die Kündigung eines Abonnements und die Löschung von Daten sind zwei getrennte Vorgänge.</p>
    </GermanLegalPage>
  );
}

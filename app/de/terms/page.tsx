import GermanLegalPage, { germanLegalMetadata, GermanSupportContact } from "../legal-page";

export const metadata = germanLegalMetadata({ path: "terms", title: "Abonnementbedingungen", description: "Bedingungen für den unabhängigen Service für persönliche CBP-Websites von ProNeurs." });

export default function GermanTermsPage() {
  return (
    <GermanLegalPage eyebrow="Servicevertrag" title="Abonnementbedingungen" summary="Diese Bedingungen gelten für den unabhängigen Website-Service von ProNeurs™. Sie regeln weder eine ClickBaitPays-Mitgliedschaft noch die Teilnahme an diesem Programm.">
      <h2>1. Der Service</h2>
      <p>ProNeurs™ stellt eine personalisierte, gehostete Informations- und Empfehlungsseite, Werkzeuge zur Kontoverwaltung und zentral gepflegte Website-Inhalte bereit. ProNeurs™ ist unabhängig von ClickBaitPays und hat keine Kontrolle über dessen Konten, Kampagnen, Zahlungen, Auszahlungen, Regeln, Verfügbarkeit oder Ergebnisse.</p>
      <h2>2. Voraussetzungen und Kontoinformationen</h2>
      <p>Sie müssen korrekte Kontaktdaten und eine offizielle Empfehlungs-URL angeben, zu deren Verwendung Sie berechtigt sind. Sie sind dafür verantwortlich, diese Angaben aktuell zu halten und den Zugang zu Ihrem E-Mail-Konto sowie zu Ihren Verwaltungslinks zu schützen.</p>
      <h2>3. Abonnement und Verlängerung</h2>
      <p>Der Service wird monatlich oder jährlich über Stripe abgerechnet und verlängert sich automatisch bis zur Kündigung. Die aktuellen Preise werden vor der Zahlung angezeigt. Gegebenenfalls fallen Steuern an. Stripe speichert und verarbeitet die Kartendaten; ProNeurs™ speichert keine vollständigen Kartennummern.</p>
      <h2>4. Kündigung</h2>
      <p>Sie können Ihr Abonnement im Stripe-Kundenportal kündigen. Soweit gesetzlich nichts anderes vorgeschrieben ist, bleibt die Website bis zum Ende des bezahlten Abrechnungszeitraums verfügbar und wird danach offline genommen. Eine Kündigung löscht die Kontodaten nicht automatisch. Berechtigte Löschanträge haben in der Regel eine Wiederherstellungsfrist von 30 Tagen vor der endgültigen Löschung. Bei fehlgeschlagenen Zahlungen kann vor einer Sperrung eine siebentägige Nachfrist gewährt werden.</p>
      <h2>5. Keine Erfolgsgarantie</h2>
      <p>Der Service garantiert weder Besucherzahlen, Interessenten, Empfehlungen, die Aufnahme in ein Drittanbieterprogramm noch finanzielle Ergebnisse oder Einnahmen. Kryptowährungen und die Teilnahme an Programmen Dritter sind mit erheblichen Risiken verbunden.</p>
      <h2>6. Inhalte und zulässige Nutzung</h2>
      <p>Sie dürfen den Service nicht für irreführende Aussagen, Identitätsmissbrauch, rechtswidrige Werbung, Spam, Schadsoftware, unsichere Weiterleitungen oder die unerlaubte Nutzung fremden geistigen Eigentums einsetzen. ProNeurs™ kann Inhalte oder Websites, die gegen diese Bedingungen oder die Richtlinie zur zulässigen Nutzung verstoßen, korrigieren, sperren oder entfernen.</p>
      <h2>7. Dienste Dritter</h2>
      <p>Die Website kann Links zu ClickBaitPays, Stripe und anderen unabhängigen Diensten enthalten. Diese Anbieter sind für ihre eigenen Bedingungen, Richtlinien, Verfügbarkeit und Praktiken verantwortlich.</p>
      <h2>8. Verfügbarkeit und Änderungen</h2>
      <p>ProNeurs™ kann zentral gepflegte Inhalte, erforderliche Hinweise, Sicherheitsmaßnahmen und Funktionen des Service aktualisieren. Angemessene Wartungsarbeiten und Ereignisse außerhalb der Kontrolle von ProNeurs™ können die Verfügbarkeit vorübergehend beeinträchtigen.</p>
      <h2>9. Kontakt</h2><p>Bei Fragen zu diesen Bedingungen schreiben Sie an <GermanSupportContact />.</p>
    </GermanLegalPage>
  );
}

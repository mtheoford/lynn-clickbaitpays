import Link from "next/link";
import GermanLegalPage, { germanLegalMetadata } from "../legal-page";

const officialFaqUrl = "https://clickbaitpays.me/questions.php";

export const metadata = germanLegalMetadata({ path: "faq", title: "ClickBaitPays-FAQ auf Deutsch", description: "Deutsche Übersetzung der 15 offiziellen häufigen Fragen zu ClickBaitPays." });

export default function GermanFaqPage() {
  return (
    <GermanLegalPage eyebrow="Praktischer Leitfaden" title="Häufige Fragen" summary="Eine deutsche Übersetzung der 15 von ClickBaitPays veröffentlichten Fragen und Antworten, die Ihnen bei der Nutzung der Plattform helfen soll." updatedLabel="Übersetzung auf Grundlage der am 4. September 2026 abgerufenen offiziellen FAQ">
      <p><strong>Quelle und Aktualisierungen:</strong> Diese Seite ist eine praktische Übersetzung der <a href={officialFaqUrl} target="_blank" rel="noreferrer">offiziellen ClickBaitPays-FAQ auf Englisch</a>. Funktionen, Fristen und Regeln können sich ändern. Prüfen Sie vor jedem Schritt die offizielle Quelle und die Angaben in Ihrem Konto.</p>

      <h2>1. Was ist ClickBaitPays?</h2>
      <p>ClickBaitPays ist eine Paid-to-Click-Werbeplattform (PTC). Werbetreibende kaufen Kampagnen, um ihre Inhalte echten Nutzern zu zeigen. Mitglieder verdienen Kryptowährung, indem sie diese Anzeigen täglich ansehen. Werbetreibende erhalten Besucher, die Betrachter werden vergütet und beide Seiten profitieren.</p>

      <h2>2. Wie beginne ich?</h2>
      <ol>
        <li>Besorgen Sie sich den Empfehlungslink Ihres Sponsors und erstellen Sie ein kostenloses Konto. Sie müssen sich über die IP-Adresse Ihres privaten Internetanschlusses anmelden. Verwenden Sie bei der Registrierung weder ein VPN noch mobile Daten.</li>
        <li>Melden Sie sich an, lesen Sie „How It Works“ (So funktioniert es) und die <Link href="/docs/clickbaitpays-startanleitung-de.pdf">deutsche Startanleitung</Link>. Wählen Sie anschließend die für Sie passende Werbekampagnenstufe.</li>
        <li>Zahlen Sie auf der Seite „Deposit“ (Einzahlen) Kryptowährung auf Ihr Konto ein.</li>
        <li>Öffnen Sie „Buy Ad Campaigns“ (Werbekampagnen kaufen), wählen Sie Ihre Stufe und bestätigen Sie den Kauf.</li>
        <li>Bezahlen Sie die einmalige Aktivierungsgebühr dieser Stufe, um Ihre Einnahmen zu aktivieren.</li>
        <li>Öffnen Sie „Click Ads“ (Anzeigen anklicken) im linken Menü und beginnen Sie mit Ihren täglichen Anzeigen.</li>
        <li>Nach Abschluss Ihrer 12-tägigen Kampagne und der anschließenden siebentägigen Sperrfrist werden Ihre Einnahmen dem verfügbaren Guthaben („Available Balance“) gutgeschrieben. Danach können Sie sie auszahlen lassen, mit „Pay It Forward“ an ein anderes Mitglied übertragen oder eine neue Kampagne kaufen.</li>
      </ol>

      <h2>3. Wie lange dauert es, bis ich Einnahmen erzielen kann?</h2>
      <p>Sobald Sie eine Werbekampagnenstufe gekauft und die dazugehörige einmalige Aktivierungsgebühr bezahlt haben, können Sie sofort Anzeigen anklicken und Einnahmen erzielen.</p>

      <h2>4. Wie bezahle ich mit Kryptowährung?</h2>
      <p>So zahlen Sie Guthaben ein:</p>
      <ol>
        <li>Öffnen Sie in Ihrem Dashboard „Deposit“ im linken Menü und geben Sie den gewünschten Einzahlungsbetrag in USDT ein.</li>
        <li>Klicken Sie auf „Deposit Funds“ (Guthaben einzahlen). Sie werden zur Zahlungsabwicklung an NOWPayments weitergeleitet.</li>
        <li>Wählen Sie Ihre Kryptowährung unter „Choose asset“ (Währung wählen). NOWPayments akzeptiert unter anderem Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Tron (TRX), Ripple (XRP) und Hunderte weitere Kryptowährungen.</li>
        <li>NOWPayments zeigt den exakten zu sendenden Betrag und eine einmalige Wallet-Adresse an. Notieren Sie Ihre zehnstellige Zahlungs-ID: Sie benötigen diese bei Supportanfragen zur Einzahlung.</li>
        <li>Kopieren Sie die Wallet-Adresse direkt und senden Sie genau den angezeigten Betrag. Tippen Sie die Adresse nicht von Hand ein.</li>
        <li>Warten Sie auf die Bestätigung der Einzahlung. Je nach Kryptowährung und Netzwerkauslastung kann dies wenige Minuten bis mehrere Stunden dauern.</li>
        <li>Sobald das Guthaben gutgeschrieben ist, öffnen Sie „Buy Ad Campaigns“, wählen Ihre Stufe und schließen den Kauf ab.</li>
        <li>Anschließend werden Sie aufgefordert, die einmalige Aktivierungsgebühr dieser Stufe zu bezahlen. Diese Zahlung ist erforderlich, um Ihre Einnahmen zu aktivieren, und muss erfolgen, bevor Sie Einnahmen erzielen können.</li>
      </ol>
      <p><strong>Wichtig:</strong> NOWPayments erstellt für jede Einzahlung eine neue Wallet-Adresse. Verwenden Sie niemals die Adresse einer früheren Einzahlung erneut, da sonst ein Verlust der Mittel droht.</p>

      <h2>5. Was soll ich tun, wenn meine Zahlung nicht angezeigt wird?</h2>
      <p>Rechnen Sie mit bis zu 12 Stunden für die Einzahlungsbestätigung, da die Bearbeitungsdauer von der Kryptowährung abhängt.</p>
      <p>Ist die Einzahlung nach 12 Stunden noch nicht gutgeschrieben, prüfen Sie Folgendes:</p>
      <ul>
        <li>Haben Sie genau den auf der Zahlungsseite angezeigten Betrag gesendet?</li>
        <li>Haben Sie die richtige Kryptowährung gesendet?</li>
        <li>Haben Sie die für genau diese Einzahlung erstellte Adresse verwendet? Jede Einzahlung hat eine eigene Adresse; verwenden Sie keine Adresse aus einer früheren Transaktion.</li>
      </ul>
      <p>Wenn alles korrekt erscheint und die Einzahlung weiterhin fehlt, wenden Sie sich über „Contact Us“ (Kontakt) an den Support. Geben Sie Ihren Benutzernamen, die zehnstellige Zahlungs-ID, den Transaktionshash und den gesendeten Betrag an.</p>

      <h2>6. Warum muss ich eine Anzeige veröffentlichen?</h2>
      <p>Anzeigen halten die Plattform am Laufen. Wenn Sie Anzeigen veröffentlichen, tragen Sie dazu bei, Verdienstmöglichkeiten für sich und andere Mitglieder zu schaffen.</p>

      <h2>7. Welche Website darf ich bewerben?</h2>
      <p>Sie können nahezu jede Website bewerben, beispielsweise Ihren Empfehlungslink für ein anderes Programm, eine gemeinnützige Organisation Ihrer Wahl oder ein Affiliate-Produkt einer Plattform wie ClickBank. Rechtswidrige, gefährliche oder gegen die Nutzungsbedingungen verstoßende Inhalte sind untersagt. Große bekannte Websites wie Google oder Facebook dürfen nicht verwendet werden.</p>

      <h2>8. Muss ich andere Personen werben?</h2>
      <p>Nein. Empfehlungen sind nicht erforderlich. Sie erzielen Einnahmen durch das Anklicken der Anzeigen Ihrer eigenen Kampagne. Empfehlungen ermöglichen lediglich zusätzliche Einnahmen.</p>

      <h2>9. Wie funktionieren Empfehlungsprovisionen?</h2>
      <p>Sie erhalten eine Provision von 10 % für jeden Klick einer direkt geworbenen Person. Diese wird sofort Ihrem verfügbaren Guthaben gutgeschrieben.</p>

      <h2>10. Wie werde ich pro Klick bezahlt?</h2>
      <p>Jede Werbekampagnenstufe hat einen festgelegten Preis pro Klick (CPC). Wenn Sie eine Anzeige anklicken und sie für die vorgeschriebene Dauer ansehen, erhalten Sie 90 % dieses CPC. Der Betrag hängt von der Stufe ab.</p>

      <h2>11. Was geschieht am Ende meiner 12-tägigen Werbekampagne?</h2>
      <p>Nach den 12 Kampagnentagen werden Ihre Einnahmen sieben Tage lang zurückgehalten und anschließend Ihrem verfügbaren Guthaben gutgeschrieben. Danach können Sie damit eine neue Kampagne kaufen, es mit „Pay It Forward“ an ein anderes Mitglied übertragen oder eine Auszahlung beantragen. Auf alle Auszahlungen fällt eine Gebühr von 10 % an.</p>

      <h2>12. Wie werde ich ausgezahlt?</h2>
      <p>Sobald Ihre Einnahmen im „Available Balance“ verfügbar sind, können Sie eine Auszahlung direkt an Ihre Kryptowallet beantragen. Eine Auszahlung kann einmal pro Woche beantragt werden. Das Administrationsteam bearbeitet sie manuell innerhalb von 48 Stunden nach Eingang des Antrags.</p>

      <h2>13. Was benötige ich für eine Auszahlung?</h2>
      <p>Sie benötigen ein Mindestguthaben von 10 USDT und eine gültige Wallet-Adresse für die ausgewählte Kryptowährung. Für jede Auszahlung fällt eine Gebühr von 10 % an.</p>

      <h2>14. Erfolgen Auszahlungen sofort?</h2>
      <p>Nein. Das Administrationsteam bearbeitet Auszahlungen manuell und führt sie innerhalb von 48 Stunden nach Antragstellung aus. Nach der Bearbeitung wird die Kryptowährung direkt an die von Ihnen angegebene Wallet-Adresse gesendet.</p>

      <h2>15. Darf ich mehrere Konten erstellen?</h2>
      <p>Jede Person darf nur ein Konto besitzen.</p>
      <p>Pro Haushalt sind höchstens 3 Konten erlaubt. Jedes muss einer anderen erwachsenen Person im Haushalt gehören und eine eigene E-Mail-Adresse verwenden. Alle Konten des Haushalts müssen unter demselben ursprünglichen Sponsor registriert sein; Mitglieder eines Haushalts dürfen sich nicht gegenseitig werben. Werden mehr als 3 Konten unter derselben IP-Adresse erkannt, können alle zugehörigen Konten gesperrt werden.</p>
      <p><strong>Warnung vor Kontoverlust:</strong> Die Verwendung von Proxys, Bots, automatischen Klickprogrammen, Skripten, Emulatoren, Systemen zur Besuchermanipulation oder Methoden zum Verbergen Ihrer Identität beziehungsweise zur Automatisierung von Aktivitäten ist strengstens untersagt.</p>
      <p>Konten, bei denen solche Methoden festgestellt werden, werden sofort und dauerhaft gelöscht – zusammen mit allen zugehörigen Konten, Guthaben und Einnahmen.</p>
      <p><strong>Keine Vorwarnung. Kein Einspruch. Keine Ausnahmen.</strong></p>
      <p>Aktualisierungen und weitere Hilfe finden Sie in der <a href={officialFaqUrl} target="_blank" rel="noreferrer">offiziellen FAQ auf Englisch</a>.</p>
    </GermanLegalPage>
  );
}

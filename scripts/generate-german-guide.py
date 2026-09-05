#!/usr/bin/env python3
"""German edition of the current getting-started guide, preserving its content.

Reuses the existing French guide's typography and layout primitives. This is a
translation of the current project edition (2026-09-04), not a new rules update.
"""
from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("guide_layout", ROOT / "scripts/generate-french-guide.py")
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)


def draw_page(canvas, doc):
    width, height = layout.letter
    canvas.saveState()
    canvas.setFillColor(layout.NAVY)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFont(layout.REGULAR_FONT, 18)
    canvas.setFillColor(layout.CYAN)
    canvas.drawString(52, height - 37, "ClickBait")
    canvas.setFillColor(layout.MAGENTA)
    canvas.drawString(121, height - 37, "Pays")
    canvas.setFont(layout.REGULAR_FONT, 7.5)
    canvas.setFillColor(layout.MUTED)
    canvas.drawString(52, height - 53, "STARTANLEITUNG · DEUTSCHE AUSGABE")
    canvas.setFillColor(layout.CYAN)
    canvas.rect(0, height - 64, width, 2.5, stroke=0, fill=1)
    canvas.setFillColor(layout.MAGENTA)
    canvas.rect(0, 35, width, 2.5, stroke=0, fill=1)
    canvas.setFont(layout.REGULAR_FONT, 6.7)
    canvas.setFillColor(layout.MUTED)
    canvas.drawString(52, 19, f"Seite {doc.page}")
    canvas.drawCentredString(width / 2, 19, "Deutsche Übersetzung der aktuellen Projektausgabe")
    canvas.drawRightString(width - 52, 19, "support@clickbaitpays.me")
    canvas.restoreState()


def build_story():
    story = []
    def heading(kicker, title, intro=None):
        story.extend(layout.page_heading(kicker, title, intro))
    def step(number, text):
        story.append(layout.step(number, text))
    def note(label, text, tone="note"):
        story.append(layout.callout(label, text, tone))
    def page():
        story.append(layout.PageBreak())
    def qa(number, question, answer):
        story.append(layout.qa(number, question, answer))

    heading("Erste Schritte", "Ein Konto registrieren", "Erstellen Sie Ihr Konto über den offiziellen Empfehlungslink Ihres Sponsors.")
    note("Wichtig", "Registrieren Sie sich über die IP-Adresse Ihres Heimanschlusses. Das System speichert die IP-Adresse bei der Anmeldung. Nutzen Sie deshalb Ihr Heimnetzwerk und weder VPN noch mobile Daten oder einen anderen Internetzugang.", "important")
    step(1, "Bitten Sie Ihren Sponsor um seinen Empfehlungslink. Beachten Sie dabei die geltenden Regeln für Empfehlungen.")
    step(2, "Öffnen Sie den Link Ihres Sponsors in einem Webbrowser Ihrer Wahl.")
    step(3, "Auf ClickBaitPays öffnen Sie oben rechts das Menü über das Symbol mit den drei waagerechten Linien.")
    step(4, "Klicken Sie im Menü auf „Join Now“.")
    step(5, "Die Registrierungsseite erscheint. Falls ein VPN aktiv ist, schalten Sie es vor dem Fortfahren aus.")
    note("Tipp", "Halten Sie den Benutzernamen Ihres Sponsors bereit. Er muss oben im Registrierungsformular angezeigt werden.")
    page()

    heading("Erste Schritte", "Registrierung abschließen")
    step(6, "Fügen Sie support@clickbaitpays.me zu Ihren zugelassenen Absendern hinzu, damit die Willkommensnachricht und spätere E-Mails ankommen. Die Vorgehensweise hängt vom E-Mail-Anbieter ab. Gmail wird im Ausgangsleitfaden empfohlen.")
    step(7, "Prüfen Sie, ob oben im Formular der Benutzername Ihres Sponsors steht.")
    step(8, "Füllen Sie das Registrierungsformular aus.")
    note("Anmeldung", "Benutzername: mindestens 7 Zeichen, nur Buchstaben und Ziffern, keine Sonderzeichen. Passwort: mindestens 8 Zeichen, darunter ein Großbuchstabe, ein Kleinbuchstabe und eine Ziffer.")
    step(9, "Klicken Sie nach dem Ausfüllen auf „Join ClickBaitPays“.")
    step(10, "Innerhalb weniger Minuten erhalten Sie eine Willkommens-E-Mail, die die Aktivierung bestätigt. Prüfen Sie gegebenenfalls den Spamordner. Diese E-Mail dient nur zur Information; zur Bestätigung des Kontos ist kein Link anzuklicken.")
    step(11, "Auf der Registrierungsseite erscheint eine Begrüßung. Über „Login here“ gelangen Sie zur Anmeldung.")
    note("Kontoregeln", "Pro Person ist nur ein Konto erlaubt. Pro Haushalt bzw. IP-Adresse sind höchstens 3 Konten zulässig, jeweils mit eigener E-Mail-Adresse. Alle Konten im Haushalt müssen denselben ursprünglichen Sponsor haben und dürfen sich nicht gegenseitig werben. Beispiel: Hat Alice Sie geworben, muss Alice auch die anderen Mitglieder Ihres Haushalts werben. Sie dürfen niemanden werben, mit dem Sie zusammenwohnen.", "important")
    page()

    heading("Ihr Konto", "Anmelden und Kampagne wählen")
    step(1, "Geben Sie Ihren Benutzernamen und Ihr Passwort ein und klicken Sie auf „Login“.")
    step(2, "Öffnen Sie mit „Click Ad“ die Anmeldeanzeige. Sehen Sie diese 30 Sekunden lang an, schließen Sie den Tab und klicken Sie auf „Go to Dashboard“.")
    step(3, "Lesen Sie die Seite „How It Works“ und die FAQ im linken Menü, um sich mit ClickBaitPays vertraut zu machen.")
    step(4, "Wählen Sie eine passende Werbekampagnenstufe, um den erforderlichen Einzahlungsbetrag zu bestimmen. Pro Konto sind bis zu 3 gleichzeitig aktive Kampagnen möglich.")
    note("Wichtig", "Der Kauf einer Werbekampagne ist der Kauf einer Werbedienstleistung. Er stellt weder eine Investition noch ein Finanzprodukt oder ein Wertpapierangebot dar.", "important")
    story.append(layout.data_table(
        ["Stufe", "Gesamtkauf", "Anzeigen / Tag", "Pro Klick", "Kampagnenende", "Ihr Anteil (90 %)"],
        [["1", "14 USDT", "3", "0,48 USDT", "19,08 USDT", "17,17 USDT"],
         ["2", "84 USDT", "3", "2,83 USDT", "113,00 USDT", "101,70 USDT"],
         ["3", "165 USDT", "3", "5,40 USDT", "216,00 USDT", "194,40 USDT"],
         ["4", "330 USDT", "5", "6,48 USDT", "432,00 USDT", "388,80 USDT"],
         ["5", "660 USDT", "6", "10,80 USDT", "864,00 USDT", "777,60 USDT"],
         ["6", "1.320 USDT", "10", "12,96 USDT", "1.728,00 USDT", "1.555,20 USDT"],
         ["7", "2.640 USDT", "20", "13,50 USDT", "3.600,00 USDT", "3.240,00 USDT"]],
        [37, 78, 54, 75, 101, 123]))
    story.append(layout.Spacer(1, 7))
    story.append(layout.para("Der Gesamtkauf enthält die einmalige Aktivierungsgebühr der Stufe. Ihr Sponsor erhält 10 % des Werts am Kampagnenende. Alle Zahlungen werden innerhalb von bis zu 7 Tagen bearbeitet.", layout.SMALL))
    note("Beachten", "Auf alle Auszahlungen von Einnahmen wird unabhängig von der Kampagnenstufe eine Gebühr von 10 % erhoben.", "warning")
    page()

    heading("Kampagnen", "Weitere Käufe")
    note("Wichtig", "Eine Werbekampagne ist eine Werbedienstleistung und weder eine Investition noch ein Finanzprodukt oder Wertpapierangebot.", "important")
    story.append(layout.para("Diese Tabelle gilt nur für Käufe nach dem ersten Kauf einer bestimmten Stufe. Die einmalige Aktivierungsgebühr wird nicht erneut erhoben. „Folgekauf“ zeigt den zu zahlenden Betrag. Alle Beträge sind in USDT angegeben."))
    story.append(layout.data_table(
        ["Stufe", "Kosten", "Erst-aktivierung", "Folgekauf", "Anz. / Tag", "Pro Klick", "Kampagnen-ende", "Anteil (90 %)"],
        [["1", "13", "1", "13", "3", "0,48", "19,08", "17,17"],
         ["2", "77", "7", "77", "3", "2,83", "113,00", "101,70"],
         ["3", "150", "15", "150", "3", "5,40", "216,00", "194,40"],
         ["4", "300", "30", "300", "5", "6,48", "432,00", "388,80"],
         ["5", "600", "60", "600", "6", "10,80", "864,00", "777,60"],
         ["6", "1.200", "120", "1.200", "10", "12,96", "1.728,00", "1.555,20"],
         ["7", "2.400", "240", "2.400", "20", "13,50", "3.600,00", "3.240,00"]],
        [27, 57, 61, 61, 38, 57, 78, 89], 6.1))
    story.append(layout.Spacer(1, 14))
    story.append(layout.para("Die Aktivierungsgebühr fällt nur einmal pro Stufe beim ersten Kauf an. Außer bei Stufe 1 entspricht sie 10 % der Kampagnenkosten.", layout.SMALL))
    story.append(layout.data_table(["Stufe", "Einmalige Gebühr", "Hinweis"],
        [["1", "1 USDT", "Fester Betrag"], ["2", "7 USDT", "10 % der Kampagnenkosten"],
         ["3", "15 USDT", "10 % der Kampagnenkosten"], ["4", "30 USDT", "10 % der Kampagnenkosten"],
         ["5", "60 USDT", "10 % der Kampagnenkosten"], ["6", "120 USDT", "10 % der Kampagnenkosten"],
         ["7", "240 USDT", "10 % der Kampagnenkosten"]], [65, 115, 288], 7.2))
    page()

    heading("Einzahlungen", "Guthaben einzahlen", "Wählen Sie zuerst Ihre Kampagne und erstellen Sie dann eine neue Einzahlungsanfrage.")
    step(1, "Klicken Sie im linken Menü auf „Deposit“.")
    step(2, "Geben Sie unter „Make A Deposit“ den Einzahlungsbetrag in USDT ein. Sie können verschiedene Kryptowährungen verwenden. Die Mindesteinzahlung beträgt 10 USDT.")
    step(3, "Klicken Sie auf „Deposit Funds“. Sie werden zu NOWPayments weitergeleitet.")
    step(4, "Wählen Sie unter „Choose asset“ die Kryptowährung. NOWPayments unterstützt unter anderem Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), Tron (TRX), Ripple (XRP) und Hunderte weitere Vermögenswerte.")
    note("Achtung", "Die ausgewählte Kryptowährung muss genau der Währung entsprechen, die Sie senden. Eine Abweichung kann zum dauerhaften Verlust führen. Wählen Sie beispielsweise Ethereum (ETH), dürfen Sie kein Tether (USDT) senden.", "warning")
    step(5, "NOWPayments zeigt zunächst eine Schätzung des zu sendenden Betrags.")
    step(6, "Klicken Sie auf „Next step“.")
    step(7, "NOWPayments zeigt den genauen Betrag und die Empfängeradresse. Nur ein Beispiel, Ihre Werte werden abweichen: 0,00024851 BTC; Adresse bc1q36ngch858kff04z5g6yz7nftqqnwxp8qjpzxlq.")
    note("Achtung", "NOWPayments erstellt für jede Einzahlung eine eigene Wallet-Adresse. Verwenden Sie niemals eine alte Adresse erneut. Erstellen Sie stets eine neue Einzahlungsanfrage; Überweisungen an alte Adressen können zum Verlust führen.", "warning")
    step(8, "Notieren Sie die zehnstellige Zahlungs-ID von NOWPayments. Damit kann der Support die Transaktion bei Problemen schnell zuordnen.")
    page()

    heading("Einzahlungen", "Betrag sicher übertragen")
    step(9, "Öffnen Sie Ihre Kryptowallet und wählen Sie die zuvor festgelegte Kryptowährung.")
    step(10, "Klicken Sie in Ihrer Wallet auf „Send“.")
    step(11, "Kopieren Sie den Betrag von NOWPayments in das Betragsfeld Ihrer Wallet.")
    step(12, "Kopieren Sie die Wallet-Adresse von NOWPayments in das Feld „To“, „Address“ oder „Send To“ Ihrer Wallet.")
    step(13, "Prüfen Sie erneut, ob Betrag, Wallet-Adresse und Kryptowährung exakt mit den Angaben von NOWPayments übereinstimmen.")
    note("Achtung", "Fehler können an dieser Stelle zum dauerhaften Verlust der Mittel führen. Kontrollieren Sie alle Angaben vor dem Senden.", "warning")
    step(14, "Klicken Sie auf „Send“, um die Transaktion zu senden.")
    step(15, "Warten Sie, bis NOWPayments die Transaktion erkennt und gutschreibt. Je nach Kryptowährung dauert dies 10 Minuten bis einige Stunden. Ist nach 12 Stunden keine Gutschrift erfolgt, kontaktieren Sie den Telegram-Support mit Ihrem Benutzernamen und der Zahlungs-ID.")
    note("Kontrolle", "Genauer Betrag · richtige Kryptowährung und richtiges Netzwerk · neue Adresse für diese Anfrage.")
    page()

    heading("Kampagnen", "Eine Werbekampagne starten")
    step(1, "Nach Bearbeitung der Einzahlung kehren Sie von NOWPayments zu ClickBaitPays zurück. Öffnen Sie links „Buy Ad Campaigns“.")
    step(2, "Wählen Sie die gewünschte Stufe und klicken Sie auf „Buy This Ad Campaign“.")
    step(3, "Geben Sie Titel und URL Ihrer Anzeige ein. Viele Mitglieder verwenden einen Empfehlungslink zu einem anderen Programm. Sie können beispielsweise auch eine gemeinnützige Organisation oder ein Affiliate-Produkt auf ClickBank bewerben.")
    step(4, "Prüfen Sie die Anzeige und stellen Sie sicher, dass Ihr Kontoguthaben ausreicht.")
    step(5, "Klicken Sie auf „Confirm Purchase“.")
    step(6, "Nach dem Kauf wird Ihnen die Zahlung der einmaligen Aktivierungsgebühr dieser Stufe angeboten, um Einnahmen zu aktivieren.")
    step(7, "Für weitere Kampagnen kehren Sie zu „Buy Ad Campaigns“ zurück und wiederholen die Schritte 1 bis 6.")
    note("Zur Erinnerung", "Pro Konto sind bis zu 3 gleichzeitig aktive Werbekampagnen möglich.")
    page()

    heading("Tägliche Aktivität", "Anzeigen ansehen", "Nach dem Kauf und der Aktivierung Ihrer Kampagnen können Sie mit der täglichen Aktivität beginnen.")
    step(1, "Öffnen Sie im linken Menü „Click Ads“.")
    step(2, "Unter den Kampagneninformationen stehen die verfügbaren Anzeigen. Ihre Anzahl hängt von der Stufe ab. Jede Anzeige öffnet sich in einem neuen Tab: 15 Sekunden ansehen, Tab schließen und auf „Proceed“ klicken. Jede Kampagne hat ihre eigenen Anzeigen.")
    step(3, "Wenn Sie alle Anzeigen aller aktiven Kampagnen angeklickt haben, ist die Aktivität für diesen Tag abgeschlossen.")
    note("Zeitplan", "Die Anzeigen werden täglich um Mitternacht nach Panama-Zeit (EST / UTC-5) zurückgesetzt.", "important")
    note("Ablauf", "Öffnen → 15 Sekunden warten → Tab schließen → mit „Proceed“ fortfahren.")
    page()

    heading("Hilfe", "Häufige Fragen", "Einzahlungen, Übertragungen zwischen Mitgliedern und Anzeigen.")
    qa(1, "Welche Kryptowährungen werden akzeptiert?", "ClickBaitPays akzeptiert zahlreiche Kryptowährungen, darunter Bitcoin (BTC), Litecoin (LTC), Dogecoin (DOGE), Solana (SOL), Binance Coin (BNB) und Hunderte weitere. Die vollständige Liste steht auf der Einzahlungsseite von NOWPayments.")
    qa(2, "Welche Referenzwährung verwendet ClickBaitPays?", "Die Buchführung erfolgt in USDT-ERC20, auch USDT-ETH oder USDT auf Ethereum genannt. Diese Einheit wird bei Eingabe des Einzahlungsbetrags angezeigt, unabhängig von der gesendeten Kryptowährung.")
    qa(3, "Wann wird eine Einzahlung gutgeschrieben?", "Das hängt von der Kryptowährung und der Auslastung ihres Netzwerks ab. Planen Sie bis zu 12 Stunden ein. Fehlt die Gutschrift danach, wenden Sie sich an den Support.")
    qa(4, "Wie funktioniert Pay It Forward (PIF)?", "Öffnen Sie unter „Financial“ den Eintrag „Pay It Forward“. Geben Sie unter „Send Funds“ den Benutzernamen des Empfängers und den USDT-Betrag ein und klicken Sie auf „Send Funds“. Der Empfänger muss die Seite eventuell aktualisieren.")
    note("Wichtig", "Per PIF empfangene Mittel können weder ausgezahlt noch an ein anderes Mitglied weitergeleitet werden. Sie müssen für eine Werbekampagne verwendet werden.", "important")
    qa(5, "Wie sehe ich meine Anzeigen an?", "Öffnen Sie „Click Ads“ und klicken Sie auf die erste Anzeige unter der Kampagnenkarte. Auf der Countdown-Seite startet „Click Ad“ die Anzeige und den Timer. Nach 15 Sekunden schließen Sie den Tab bzw. gehen auf dem Handy zurück und klicken auf das grüne „Proceed“. Wiederholen Sie dies für alle Anzeigen. Bei mehreren Kampagnen wechseln Sie über die Tabs oberhalb der Karte.")
    qa(6, "Wie viele Kampagnen sind gleichzeitig möglich?", "Bis zu 3 aktive Kampagnen pro Konto, unabhängig von der Stufe. Drei Kampagnen der Stufe 4 zählen ebenso als drei wie je eine der Stufen 4, 5 und 6. Endet eine Kampagne nach 12 Tagen, können Sie mit verfügbarem Guthaben eine neue kaufen.")
    page()

    heading("Hilfe", "Häufige Fragen", "Guthaben, Auszahlungen und Wallet-Adressen.")
    qa(7, "Wann wechselt Guthaben von „In Earned Wallets“ zu „Available Balance“?", "Nach den 12 Klicktagen der Kampagne wird das Guthaben nach einer festen Wartezeit von 7 Tagen zu „Available Balance“ übertragen. Danach können Sie es per PIF übertragen, eine neue Kampagne kaufen oder eine Auszahlung beantragen. Auf Auszahlungen fällt eine Gebühr von 10 % an.")
    qa(8, "Wie beantrage ich eine Auszahlung?", "Eine Auszahlungsanfrage pro Woche ist erlaubt. Öffnen Sie unter „Financial“ den Eintrag „Withdraw“. Geben Sie unter „Request Withdrawal“ den USDT-Betrag ein; 10 % Gebühren werden abgezogen. Wählen Sie die gewünschte Kryptowährung, geben Sie Ihre Sicherheits-PIN ein und klicken Sie auf „Submit Withdrawal“.")
    note("Wallet-Wahl", "Der Ausgangsleitfaden empfiehlt eine selbstverwaltete Wallet wie Exodus oder MetaMask statt einer Börsenwallet wie Binance oder Coinbase. Börsen können eingehende Übertragungen ablehnen oder verzögern; in manchen Fällen können Mittel verloren gehen. Bei einer selbstverwalteten Wallet behalten Sie die Kontrolle. Auszahlungen werden innerhalb von 48 Stunden nach der Anfrage manuell vom Administrationsteam bearbeitet.", "important")
    qa(9, "Welche Kryptowährungen sind für Auszahlungen vorgesehen?", "Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Binance Coin (BNB), Tron (TRX), Ripple (XRP), Stellar (XLM), Polygon (POL) und Solana (SOL). Fügen Sie nach Auswahl der Währung die dazu passende Wallet-Adresse ein.")
    note("Achtung", "Die Adresse muss zur gewählten Kryptowährung passen. Eine Ethereum-Adresse kann beispielsweise keine Bitcoins empfangen. Eine unpassende Adresse kann zum dauerhaften Verlust führen. ClickBaitPays übernimmt keine Verantwortung für Verluste durch falsche Wallet-Adressen.", "warning")
    note("Diese Ausgabe", "Deutsche Übersetzung und Layoutanpassung der bestehenden Projektausgabe vom 4. September 2026, erstellt am 5. September 2026. Menü- und Schaltflächennamen bleiben passend zur Originaloberfläche auf Englisch. Zahlen und Inhalte wurden aus der vorhandenen Ausgabe übernommen. Maßgeblich bei Änderungen sind die aktuellen Angaben in Ihrem Konto und die offiziellen Bedingungen.")
    return story


def create_pdf(output):
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = layout.BaseDocTemplate(str(output), pagesize=layout.letter,
        rightMargin=52, leftMargin=52, topMargin=78, bottomMargin=47,
        title="ClickBaitPays Startanleitung - Deutsche Ausgabe", author="ProNeurs",
        subject="Deutsche Übersetzung der bestehenden ClickBaitPays Startanleitung")
    frame = layout.Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
        id="content", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([layout.PageTemplate(id="guide", frames=[frame], onPage=draw_page)])
    doc.build(build_story())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "public/docs/clickbaitpays-startanleitung-de.pdf")
    args = parser.parse_args()
    create_pdf(args.output.resolve())
    print(args.output.resolve())

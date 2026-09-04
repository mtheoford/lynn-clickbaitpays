#!/usr/bin/env python3
"""Generate the French ClickBaitPays getting-started guide.

The French copy is a faithful translation and layout adaptation of the ten
English source pages extracted under tmp/pdfs/cbp_getting/page-01.txt through
page-10.txt.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "public" / "docs" / "guide-demarrage-clickbaitpays-fr.pdf"

NAVY = colors.HexColor("#090827")
NAVY_2 = colors.HexColor("#11103A")
INK = colors.HexColor("#F8F9FF")
MUTED = colors.HexColor("#B9BED2")
CYAN = colors.HexColor("#19E0DF")
MAGENTA = colors.HexColor("#D04AF2")
VIOLET = colors.HexColor("#7959FF")
AMBER = colors.HexColor("#FFC45D")
RED = colors.HexColor("#FF7A8A")
GRID = colors.HexColor("#35345F")


def register_fonts() -> tuple[str, str]:
    regular_candidates = (
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    )
    bold_candidates = (
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    )
    regular = next((path for path in regular_candidates if path.exists()), None)
    bold = next((path for path in bold_candidates if path.exists()), None)
    if not regular or not bold:
        raise RuntimeError("A Unicode TrueType font is required to build the French guide.")
    pdfmetrics.registerFont(TTFont("GuideSans", str(regular)))
    pdfmetrics.registerFont(TTFont("GuideSansBold", str(bold)))
    return "GuideSans", "GuideSansBold"


REGULAR_FONT, BOLD_FONT = register_fonts()

BODY = ParagraphStyle(
    "Body",
    fontName=REGULAR_FONT,
    fontSize=9.2,
    leading=13.1,
    textColor=INK,
    spaceAfter=5,
)
SMALL = ParagraphStyle(
    "Small",
    parent=BODY,
    fontSize=7.7,
    leading=10.4,
    textColor=MUTED,
)
SECTION = ParagraphStyle(
    "Section",
    fontName=BOLD_FONT,
    fontSize=20,
    leading=23,
    textColor=INK,
    spaceAfter=12,
)
KICKER = ParagraphStyle(
    "Kicker",
    fontName=BOLD_FONT,
    fontSize=7.6,
    leading=10,
    textColor=CYAN,
    tracking=1.3,
    spaceAfter=5,
)
STEP = ParagraphStyle(
    "Step",
    parent=BODY,
    fontSize=8.9,
    leading=12.4,
    spaceAfter=0,
)
CALLOUT = ParagraphStyle(
    "Callout",
    parent=BODY,
    fontSize=8.5,
    leading=12,
    textColor=INK,
    spaceAfter=0,
)
QA_QUESTION = ParagraphStyle(
    "Question",
    fontName=BOLD_FONT,
    fontSize=9.1,
    leading=12.4,
    textColor=CYAN,
    spaceAfter=3,
)
QA_ANSWER = ParagraphStyle(
    "Answer",
    parent=BODY,
    fontSize=8.15,
    leading=11.3,
    textColor=INK,
    spaceAfter=0,
)
TABLE_HEADER = ParagraphStyle(
    "TableHeader",
    fontName=BOLD_FONT,
    fontSize=6.5,
    leading=7.5,
    textColor=NAVY,
    alignment=TA_LEFT,
)
TABLE_CELL = ParagraphStyle(
    "TableCell",
    fontName=REGULAR_FONT,
    fontSize=6.7,
    leading=8,
    textColor=INK,
)


def para(text: str, style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(escape(text).replace("\n", "<br/>"), style)


def rich(text: str, style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, style)


def page_heading(kicker: str, title: str, intro: str | None = None):
    items = [para(kicker.upper(), KICKER), para(title, SECTION)]
    if intro:
        items.extend([para(intro, BODY), Spacer(1, 5)])
    return items


def step(number: int, text: str):
    badge = Table(
        [[Paragraph(str(number), ParagraphStyle(
            f"Badge{number}",
            fontName=BOLD_FONT,
            fontSize=9,
            leading=10,
            textColor=NAVY,
            alignment=1,
        ))]],
        colWidths=[22],
        rowHeights=[22],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CYAN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0, CYAN),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    row = Table([[badge, para(text, STEP)]], colWidths=[30, 438])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 8),
        ("RIGHTPADDING", (1, 0), (1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return KeepTogether([row, Spacer(1, 5)])


def callout(label: str, text: str, tone: str = "note"):
    accent = {"note": CYAN, "important": AMBER, "warning": RED}[tone]
    label_p = Paragraph(
        escape(label.upper()),
        ParagraphStyle(
            f"CalloutLabel{tone}",
            fontName=BOLD_FONT,
            fontSize=7.2,
            leading=9,
            textColor=accent,
        ),
    )
    card = Table([[label_p, para(text, CALLOUT)]], colWidths=[76, 380])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_2),
        ("BOX", (0, 0), (-1, -1), 0.8, accent),
        ("LINEBEFORE", (1, 0), (1, -1), 0.6, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([card, Spacer(1, 8)])


def data_table(headers: list[str], rows: list[list[str]], widths: list[float], font_size: float = 6.7):
    header_cells = [para(value, TABLE_HEADER) for value in headers]
    cell_style = ParagraphStyle(
        f"TableCell{font_size}",
        parent=TABLE_CELL,
        fontSize=font_size,
        leading=font_size + 1.2,
    )
    body = [[para(value, cell_style) for value in row] for row in rows]
    table = Table([header_cells, *body], colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), CYAN),
        ("BACKGROUND", (0, 1), (-1, -1), NAVY_2),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [NAVY_2, colors.HexColor("#171642")]),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def qa(number: int, question: str, answer: str):
    card = Table(
        [[
            Paragraph(f"Q{number}", ParagraphStyle(
                f"QNumber{number}",
                fontName=BOLD_FONT,
                fontSize=9,
                leading=11,
                textColor=NAVY,
                alignment=1,
            )),
            [para(question, QA_QUESTION), para(answer, QA_ANSWER)],
        ]],
        colWidths=[30, 426],
    )
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), VIOLET),
        ("BACKGROUND", (1, 0), (1, 0), NAVY_2),
        ("BOX", (0, 0), (-1, -1), 0.5, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("LEFTPADDING", (0, 0), (0, 0), 3),
        ("RIGHTPADDING", (0, 0), (0, 0), 3),
        ("TOPPADDING", (0, 0), (0, 0), 10),
        ("BOTTOMPADDING", (0, 0), (0, 0), 8),
        ("LEFTPADDING", (1, 0), (1, 0), 9),
        ("RIGHTPADDING", (1, 0), (1, 0), 9),
        ("TOPPADDING", (1, 0), (1, 0), 7),
        ("BOTTOMPADDING", (1, 0), (1, 0), 8),
    ]))
    return KeepTogether([card, Spacer(1, 6)])


def draw_page(canvas, doc):
    width, height = letter
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    canvas.setFillColor(CYAN)
    canvas.setFont(REGULAR_FONT, 18)
    canvas.drawString(0.72 * inch, height - 0.52 * inch, "ClickBait")
    canvas.setFillColor(MAGENTA)
    canvas.drawString(1.68 * inch, height - 0.52 * inch, "Pays")
    canvas.setFillColor(MUTED)
    canvas.setFont(REGULAR_FONT, 7.5)
    canvas.drawString(0.72 * inch, height - 0.73 * inch, "GUIDE DE DÉMARRAGE")

    canvas.setFillColor(CYAN)
    canvas.rect(0, height - 0.88 * inch, width, 2.5, stroke=0, fill=1)
    for index, color in enumerate((CYAN, MAGENTA, CYAN, MAGENTA, CYAN, MAGENTA)):
        canvas.setFillColor(color)
        canvas.rect(width - 1.95 * inch + index * 0.21 * inch, height - 0.61 * inch, 10, 10, stroke=0, fill=1)

    canvas.setFillColor(MAGENTA)
    canvas.rect(0, 0.49 * inch, width, 2.5, stroke=0, fill=1)
    canvas.setFont(REGULAR_FONT, 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.72 * inch, 0.26 * inch, f"Page {doc.page}")
    canvas.drawCentredString(width / 2, 0.26 * inch, "Traduction et adaptation française de l’édition anglaise")
    canvas.drawRightString(width - 0.72 * inch, 0.26 * inch, "support@clickbaitpays.me")
    canvas.restoreState()


def build_story():
    story = []

    story.extend(page_heading("Premiers pas", "Inscription initiale", "Créez votre compte depuis le lien officiel de votre parrain."))
    story.append(callout(
        "Important",
        "Vous devez vous inscrire depuis l’adresse IP de votre domicile. Le système enregistre votre adresse IP lors de l’inscription. Connectez-vous donc à votre réseau domestique et n’utilisez ni VPN, ni données mobiles, ni autre connexion à la place de votre accès Internet domestique.",
        "important",
    ))
    story.append(step(1, "Demandez le lien de parrainage de votre parrain. Respectez le protocole de parrainage approprié."))
    story.append(step(2, "Ouvrez le lien de votre parrain dans le navigateur web de votre choix."))
    story.append(step(3, "Vous arrivez sur ClickBaitPays. En haut à droite de la page, cliquez sur l’icône composée de trois lignes horizontales pour ouvrir le menu."))
    story.append(step(4, "Dans le menu, cliquez sur « Join Now »."))
    story.append(step(5, "La page d’inscription s’affiche. Si un VPN est actif, désactivez-le avant de continuer."))
    story.append(callout("Conseil", "Avant de poursuivre, gardez le nom d’utilisateur de votre parrain à portée de main. Vous devrez le voir en haut du formulaire d’inscription.", "note"))
    story.append(PageBreak())

    story.extend(page_heading("Premiers pas", "Finaliser l’inscription"))
    story.append(step(6, "Ajoutez support@clickbaitpays.me à la liste des expéditeurs autorisés afin de recevoir l’e-mail de bienvenue et les communications ultérieures. La procédure varie selon le fournisseur de messagerie; recherchez ses instructions si nécessaire. Gmail est recommandé."))
    story.append(step(7, "Vérifiez que le nom d’utilisateur de votre parrain apparaît en haut du formulaire d’inscription."))
    story.append(step(8, "Remplissez le formulaire d’inscription."))
    story.append(callout(
        "Identifiants",
        "Nom d’utilisateur: au moins 7 caractères, uniquement des lettres et des chiffres, sans caractères spéciaux. Mot de passe: au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.",
        "note",
    ))
    story.append(step(9, "Une fois le formulaire rempli, cliquez sur « Join ClickBaitPays »."))
    story.append(step(10, "Dans les minutes qui suivent, vous recevrez à l’adresse enregistrée un e-mail de bienvenue confirmant l’activation du compte. S’il n’apparaît pas, consultez les dossiers de courriers indésirables. Cet e-mail est uniquement informatif: aucun clic n’est nécessaire pour valider le compte."))
    story.append(step(11, "Sur la page d’inscription, un message de bienvenue s’affiche. Cliquez sur le lien « Login here » pour accéder à la page de connexion."))
    story.append(callout(
        "Règles du compte",
        "Une seule personne ne peut posséder qu’un compte. Au maximum 3 comptes sont autorisés par foyer ou adresse IP, chacun avec sa propre adresse e-mail. Tous les comptes d’un même foyer doivent être rattachés au même parrain initial, et non se parrainer entre eux. Exemple: si Alice vous a parrainé, elle doit également parrainer les autres membres de votre foyer. Vous ne pouvez pas parrainer une personne avec qui vous vivez.",
        "important",
    ))
    story.append(PageBreak())

    story.extend(page_heading("Votre compte", "Connexion et choix d’une campagne"))
    story.append(step(1, "Saisissez votre nom d’utilisateur et votre mot de passe, puis cliquez sur « Login »."))
    story.append(step(2, "Cliquez sur « Click Ad » pour ouvrir la publicité de connexion. Vous devez la consulter pendant 30 secondes avant de fermer l’onglet et de cliquer sur « Go to Dashboard »."))
    story.append(step(3, "La page « How It Works » s’ouvre. Lisez cette page ainsi que la FAQ accessible depuis le menu de gauche afin de vous familiariser avec ClickBaitPays."))
    story.append(step(4, "Choisissez le niveau de campagne publicitaire qui vous convient afin de connaître le montant de cryptomonnaie à déposer. Vous pouvez avoir jusqu’à 3 campagnes actives simultanément par compte."))
    story.append(callout(
        "Important",
        "L’achat d’une campagne publicitaire constitue exactement cela: l’achat d’un service publicitaire. Il ne s’agit ni d’un investissement, ni d’un produit financier, ni d’une offre de titres, sous quelque forme que ce soit.",
        "important",
    ))
    story.append(para("Niveaux de campagne publicitaire", ParagraphStyle("Subhead", parent=SECTION, fontSize=12, leading=15, spaceAfter=7)))
    campaign_rows = [
        ["1", "14 USDT", "3", "0,48 USDT", "19,08 USDT", "17,17 USDT"],
        ["2", "84 USDT", "3", "2,83 USDT", "113,00 USDT", "101,70 USDT"],
        ["3", "165 USDT", "3", "5,40 USDT", "216,00 USDT", "194,40 USDT"],
        ["4", "330 USDT", "5", "6,48 USDT", "432,00 USDT", "388,80 USDT"],
        ["5", "660 USDT", "6", "10,80 USDT", "864,00 USDT", "777,60 USDT"],
        ["6", "1 320 USDT", "10", "12,96 USDT", "1 728,00 USDT", "1 555,20 USDT"],
        ["7", "2 640 USDT", "20", "13,50 USDT", "3 600,00 USDT", "3 240,00 USDT"],
    ]
    story.append(data_table(
        ["Niveau", "Achat total", "Pubs / jour", "Gain / clic", "Fin de campagne", "Vos gains (90 %)"],
        campaign_rows,
        [37, 78, 54, 75, 101, 123],
        6.7,
    ))
    story.append(Spacer(1, 7))
    story.append(para("Le montant de l’achat total inclut les frais d’activation uniques du niveau. Votre parrain reçoit 10 % de la valeur de fin de campagne. Tous les paiements sont traités dans un délai pouvant aller jusqu’à 7 jours.", SMALL))
    story.append(callout("Attention", "Des frais de 10 % s’appliquent à tous les retraits de gains, quel que soit le niveau de campagne.", "warning"))
    story.append(PageBreak())

    story.extend(page_heading("Campagnes", "Achats ultérieurs"))
    story.append(callout(
        "Important",
        "L’achat d’une campagne publicitaire est l’achat d’un service publicitaire. Il ne s’agit ni d’un investissement, ni d’un produit financier, ni d’une offre de titres.",
        "important",
    ))
    story.append(para("Le tableau ci-dessous s’applique uniquement aux achats effectués après le premier achat d’un niveau donné. Les frais d’activation uniques ne sont pas facturés à nouveau. La colonne « Achat suivant » indique le montant exact à payer. Tous les montants sont indiqués en USDT.", BODY))
    subsequent_rows = [
        ["1", "13", "1", "13", "3", "0,48", "19,08", "17,17"],
        ["2", "77", "7", "77", "3", "2,83", "113,00", "101,70"],
        ["3", "150", "15", "150", "3", "5,40", "216,00", "194,40"],
        ["4", "300", "30", "300", "5", "6,48", "432,00", "388,80"],
        ["5", "600", "60", "600", "6", "10,80", "864,00", "777,60"],
        ["6", "1 200", "120", "1 200", "10", "12,96", "1 728,00", "1 555,20"],
        ["7", "2 400", "240", "2 400", "20", "13,50", "3 600,00", "3 240,00"],
    ]
    story.append(data_table(
        ["Niv.", "Coût campagne", "Activation initiale", "Achat suivant", "Pubs / j", "Gain / clic", "Fin campagne", "Gains (90 %)"],
        subsequent_rows,
        [27, 57, 61, 61, 38, 57, 78, 89],
        6.1,
    ))
    story.append(Spacer(1, 10))
    story.append(para("Référence des frais d’activation", ParagraphStyle("Subhead2", parent=SECTION, fontSize=12, leading=15, spaceAfter=7)))
    story.append(para("Les frais d’activation ne sont payés qu’une seule fois par niveau, lors du premier achat à ce niveau. À l’exception du niveau 1, ils correspondent à 10 % du coût de la campagne.", SMALL))
    activation_rows = [
        ["1", "1 USDT", "Montant fixe"],
        ["2", "7 USDT", "10 % du coût de la campagne"],
        ["3", "15 USDT", "10 % du coût de la campagne"],
        ["4", "30 USDT", "10 % du coût de la campagne"],
        ["5", "60 USDT", "10 % du coût de la campagne"],
        ["6", "120 USDT", "10 % du coût de la campagne"],
        ["7", "240 USDT", "10 % du coût de la campagne"],
    ]
    story.append(data_table(["Niveau", "Frais uniques", "Remarque"], activation_rows, [65, 115, 288], 7.2))
    story.append(PageBreak())

    story.extend(page_heading("Dépôts", "Approvisionner votre compte", "Choisissez d’abord votre campagne, puis créez une nouvelle demande de dépôt."))
    story.append(step(1, "Dans le menu de gauche, cliquez sur « Deposit »."))
    story.append(step(2, "Sous « Make A Deposit », saisissez le montant en USDT à déposer. Plusieurs cryptomonnaies sont proposées. Le dépôt minimum est de 10 USDT."))
    story.append(step(3, "Cliquez sur « Deposit Funds ». Vous êtes redirigé vers NOWPayments pour finaliser le dépôt."))
    story.append(step(4, "Ouvrez la liste « Choose asset » et sélectionnez la cryptomonnaie à déposer. NOWPayments accepte notamment Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), Tron (TRX), Ripple (XRP) et des centaines d’autres actifs."))
    story.append(callout("Attention", "La cryptomonnaie sélectionnée doit correspondre exactement à celle que vous allez envoyer. Une discordance entraînera vraisemblablement une perte définitive. Exemple: si vous sélectionnez Ethereum (ETH), n’envoyez pas Tether (USDT).", "warning"))
    story.append(step(5, "NOWPayments affiche une estimation du montant à envoyer."))
    story.append(step(6, "Cliquez sur « Next step »."))
    story.append(step(7, "NOWPayments affiche le montant exact et l’adresse du portefeuille destinataire. Exemple uniquement - vos valeurs seront différentes: montant 0,00024851 BTC; adresse bc1q36ngch858kff04z5g6yz7nftqqnwxp8qjpzxlq."))
    story.append(callout("Attention", "NOWPayments génère une adresse de portefeuille unique pour chaque dépôt. Ne réutilisez jamais une ancienne adresse. Créez toujours une nouvelle demande afin d’obtenir une nouvelle adresse; l’envoi vers une ancienne adresse peut entraîner une perte de fonds.", "warning"))
    story.append(step(8, "NOWPayments crée également un identifiant de paiement à 10 chiffres. Notez-le: il permettra à l’assistance de retrouver rapidement la transaction en cas de problème."))
    story.append(PageBreak())

    story.extend(page_heading("Dépôts", "Envoyer les fonds en toute sécurité"))
    story.append(step(9, "Ouvrez votre portefeuille de cryptomonnaies et accédez à l’actif choisi."))
    story.append(step(10, "Dans votre portefeuille, cliquez sur le bouton d’envoi (« Send »)."))
    story.append(step(11, "Copiez le montant affiché par NOWPayments et collez-le dans le champ de montant de votre portefeuille."))
    story.append(step(12, "Copiez l’adresse de portefeuille affichée par NOWPayments et collez-la dans le champ « To », « Address » ou « Send To » de votre portefeuille."))
    story.append(step(13, "Vérifiez une nouvelle fois que le montant, l’adresse du portefeuille et la cryptomonnaie correspondent exactement aux informations affichées par NOWPayments."))
    story.append(callout("Attention", "Toute erreur à cette étape entraînera vraisemblablement une perte définitive des fonds. Contrôlez toujours chaque information avant l’envoi.", "warning"))
    story.append(step(14, "Cliquez sur « Send » dans votre portefeuille pour envoyer la transaction."))
    story.append(step(15, "Attendez que NOWPayments détecte et crédite la transaction. Selon la cryptomonnaie, cela peut prendre de 10 minutes à quelques heures. Si le compte n’est toujours pas crédité après 12 heures, contactez l’assistance sur Telegram avec votre nom d’utilisateur et votre identifiant de paiement."))
    safety = Table([
        [para("1. MONTANT EXACT", KICKER), para("2. BON RÉSEAU", KICKER), para("3. NOUVELLE ADRESSE", KICKER)],
        [para("Copiez le montant indiqué.", SMALL), para("Envoyez l’actif sélectionné.", SMALL), para("Utilisez l’adresse de cette demande.", SMALL)],
    ], colWidths=[156, 156, 156])
    safety.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_2),
        ("BOX", (0, 0), (-1, -1), 0.6, GRID),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([Spacer(1, 8), safety])
    story.append(PageBreak())

    story.extend(page_heading("Campagnes", "Lancer votre campagne publicitaire"))
    story.append(step(1, "Une fois le paiement traité, NOWPayments vous renvoie vers ClickBaitPays. Dans le menu de gauche, ouvrez « Buy Ad Campaigns »."))
    story.append(step(2, "Sélectionnez le niveau de campagne souhaité, puis cliquez sur « Buy This Ad Campaign »."))
    story.append(step(3, "Saisissez le titre et l’URL de votre publicité. La plupart des membres utilisent leur lien de parrainage d’un autre programme. Vous pouvez aussi promouvoir une association caritative ou un produit affilié proposé sur ClickBank."))
    story.append(step(4, "Vérifiez les informations de la publicité et assurez-vous que le solde du compte est suffisant."))
    story.append(step(5, "Cliquez sur « Confirm Purchase »."))
    story.append(step(6, "Après l’achat, le paiement des frais d’activation uniques correspondant à ce niveau vous est proposé afin d’activer vos gains."))
    story.append(step(7, "Pour acheter d’autres campagnes publicitaires, revenez à « Buy Ad Campaigns » et répétez les étapes 1 à 6."))
    story.append(callout("Rappel", "Vous pouvez avoir jusqu’à 3 campagnes publicitaires actives simultanément sur un même compte.", "note"))
    story.append(PageBreak())

    story.extend(page_heading("Activité quotidienne", "Consulter les publicités", "Une fois vos campagnes achetées et leurs frais d’activation payés, vous pouvez commencer l’activité quotidienne."))
    story.append(step(1, "Dans le menu de gauche, ouvrez « Click Ads »."))
    story.append(step(2, "Sous les informations de votre campagne, la liste des publicités disponibles s’affiche. Leur nombre dépend du niveau de la campagne. Chaque publicité s’ouvre dans un nouvel onglet: consultez-la pendant 15 secondes, fermez l’onglet, puis cliquez sur « Proceed ». Chaque campagne possède sa propre série de publicités."))
    story.append(step(3, "Lorsque vous avez cliqué sur toutes les publicités de toutes vos campagnes actives, votre activité est terminée pour la journée."))
    story.append(callout("Horaire", "Les publicités sont réinitialisées chaque jour à minuit, heure du Panama (EST / UTC-5).", "important"))
    rhythm = Table([
        [para("OUVRIR", KICKER), para("ATTENDRE 15 S", KICKER), para("FERMER", KICKER), para("CONTINUER", KICKER)],
        [para("Cliquez sur la première pub.", SMALL), para("Laissez l’onglet ouvert.", SMALL), para("Revenez à ClickBaitPays.", SMALL), para("Cliquez sur « Proceed ».", SMALL)],
    ], colWidths=[117, 117, 117, 117])
    rhythm.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_2),
        ("BOX", (0, 0), (-1, -1), 0.6, VIOLET),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.extend([Spacer(1, 10), rhythm])
    story.append(PageBreak())

    story.extend(page_heading("Aide", "Questions fréquentes", "Dépôts, transferts entre membres et consultation des publicités."))
    story.append(qa(1, "Quelles cryptomonnaies sont acceptées?", "ClickBaitPays accepte de nombreuses cryptomonnaies, notamment Bitcoin (BTC), Litecoin (LTC), Dogecoin (DOGE), Solana (SOL), Binance Coin (BNB) et des centaines d’autres. La liste complète est disponible sur la page de dépôt NOWPayments."))
    story.append(qa(2, "Quelle est la cryptomonnaie de référence utilisée par ClickBaitPays?", "Pour sa comptabilité, ClickBaitPays utilise l’USDT-ERC20, également appelé USDT-ETH ou USDT sur la chaîne Ethereum. C’est l’unité affichée lors de la saisie d’un montant de dépôt, quelle que soit la cryptomonnaie envoyée."))
    story.append(qa(3, "Combien de temps faut-il pour que mon dépôt soit crédité?", "Le délai dépend de la cryptomonnaie utilisée et de l’activité de son réseau blockchain. Prévoyez jusqu’à 12 heures. Si le dépôt n’est pas crédité après 12 heures, contactez l’assistance afin qu’elle puisse effectuer des recherches."))
    story.append(qa(4, "Comment transférer des fonds à un autre membre avec Pay It Forward (PIF)?", "Dans le menu de gauche, sous « Financial », cliquez sur « Pay It Forward ». Sous « Send Funds », saisissez le nom d’utilisateur du destinataire et le montant en USDT, puis cliquez sur « Send Funds ». Le destinataire devra peut-être actualiser la page pour mettre à jour son solde disponible."))
    story.append(callout("Important", "Les fonds envoyés avec Pay It Forward ne peuvent pas être retirés ni transférés à un autre membre. Ils doivent servir à acheter une campagne publicitaire.", "important"))
    story.append(qa(5, "Comment consulter mes publicités?", "Dans le menu de gauche, ouvrez « Click Ads ». Sous la fiche de campagne, cliquez sur la première publicité. Sur la page du compte à rebours, cliquez sur « Click Ad » pour ouvrir la publicité et lancer le décompte. Après 15 secondes, fermez l’onglet ou revenez en arrière sur mobile, puis cliquez sur le bouton vert « Proceed ». Répétez pour toutes les publicités requises. Si plusieurs campagnes sont actives, utilisez les onglets situés au-dessus de la fiche pour passer d’une campagne à l’autre."))
    story.append(qa(6, "Combien de campagnes publicitaires puis-je acheter en même temps?", "Vous pouvez avoir 3 campagnes actives simultanément par compte, quel que soit leur niveau. Par exemple, 3 campagnes de niveau 4 ou une campagne de chacun des niveaux 4, 5 et 6 comptent toutes deux comme 3 campagnes actives. Lorsqu’une campagne prend fin après 12 jours, vous pouvez en acheter une nouvelle avec votre solde disponible."))
    story.append(PageBreak())

    story.extend(page_heading("Aide", "Questions fréquentes", "Soldes, demandes de retrait et adresses de portefeuille."))
    story.append(qa(7, "Quand les fonds passent-ils de « In Earned Wallets » à « Available Balance »?", "Après les 12 jours de clics de la campagne, les fonds du solde « In Earned Wallets » sont transférés vers « Available Balance » après un délai fixe de 7 jours. Vous pouvez alors les transférer par PIF, acheter une nouvelle campagne ou demander un retrait. Des frais de 10 % s’appliquent à tous les retraits."))
    story.append(qa(8, "Comment demander un retrait?", "Une demande de retrait est autorisée par semaine. Dans le menu de gauche, sous « Financial », cliquez sur « Withdraw ». Sous « Request Withdrawal », saisissez le montant en USDT; des frais de 10 % seront déduits. Choisissez la cryptomonnaie à recevoir, saisissez votre code PIN de sécurité, puis cliquez sur « Submit Withdrawal »."))
    story.append(callout(
        "Conseil de retrait",
        "Il est vivement recommandé de retirer vers un portefeuille non dépositaire tel qu’Exodus ou MetaMask, et non directement vers un portefeuille de plateforme d’échange comme Binance ou Coinbase. Une plateforme peut refuser ou retarder les transferts entrants et, dans certains cas, les fonds envoyés vers son adresse de dépôt peuvent être perdus. Un portefeuille non dépositaire vous laisse le contrôle total de vos fonds. Les retraits sont traités manuellement par l’équipe d’administration dans les 48 heures suivant la demande.",
        "important",
    ))
    story.append(qa(9, "Quelles cryptomonnaies sont acceptées pour les retraits?", "ClickBaitPays accepte Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Binance Coin (BNB), Tron (TRX), Ripple (XRP), Stellar (XLM), Polygon (POL) et Solana (SOL). Après avoir choisi la cryptomonnaie, collez l’adresse du portefeuille correspondant."))
    story.append(callout(
        "Attention",
        "Vérifiez que l’adresse saisie est valide pour la cryptomonnaie choisie. Une adresse Ethereum ne peut pas recevoir de bitcoins, par exemple. Une adresse incompatible peut entraîner une perte définitive. ClickBaitPays n’est pas responsable des pertes résultant d’une adresse de portefeuille incorrecte.",
        "warning",
    ))
    story.append(callout(
        "À propos de cette édition",
        "Ce document est une traduction et une adaptation française du guide ClickBaitPays en anglais, actualisée d’après la FAQ officielle consultée le 4 septembre 2026. Les noms de menus et de boutons sont conservés en anglais pour correspondre à l’interface. En cas d’évolution du service, consultez toujours les informations affichées dans votre compte et les conditions officielles en vigueur.",
        "note",
    ))
    return story


def create_pdf(output: Path):
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(output),
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=1.08 * inch,
        bottomMargin=0.65 * inch,
        title="Guide de démarrage ClickBaitPays - édition française",
        author="ProNeurs",
        subject="Traduction et adaptation française du guide de démarrage ClickBaitPays",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="content",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=draw_page)])
    doc.build(build_story())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    create_pdf(args.output.resolve())
    print(args.output.resolve())


if __name__ == "__main__":
    main()

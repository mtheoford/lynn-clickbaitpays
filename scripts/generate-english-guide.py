#!/usr/bin/env python3
"""Generate the local English ClickBaitPays getting-started guide.

Uses the existing guide's layout and instructions, with referral commission
copy updated from the supplied October 6 overview on October 13, 2026.
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
    canvas.drawString(52, height - 53, "GETTING STARTED GUIDE · ENGLISH EDITION")
    canvas.setFillColor(layout.CYAN)
    canvas.rect(0, height - 64, width, 2.5, stroke=0, fill=1)
    canvas.setFillColor(layout.MAGENTA)
    canvas.rect(0, 35, width, 2.5, stroke=0, fill=1)
    canvas.setFont(layout.REGULAR_FONT, 6.7)
    canvas.setFillColor(layout.MUTED)
    canvas.drawString(52, 19, f"Page {doc.page}")
    canvas.drawCentredString(width / 2, 19, "ProNeurs edition · referral rule updated October 13, 2026")
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

    heading("Getting started", "Register an account", "Create your account through your sponsor's official referral link.")
    note("Important", "Register from your home internet connection. ClickBaitPays records the IP address at sign-up. Use your home network rather than a VPN, mobile data, or another internet connection.", "important")
    step(1, "Ask your sponsor for their referral link and follow the applicable sponsorship rules.")
    step(2, "Open your sponsor's link in your preferred web browser.")
    step(3, "On ClickBaitPays, open the menu near the top right using the icon with three horizontal lines.")
    step(4, "Choose \"Join Now\" from the menu.")
    step(5, "The registration page opens. Turn off any active VPN before continuing.")
    note("Tip", "Keep your sponsor's username ready. It should appear at the top of the registration form.")
    page()

    heading("Getting started", "Complete registration")
    step(6, "Add support@clickbaitpays.me to your allowed senders to receive the welcome message and later emails. The procedure depends on your email provider; check its instructions if needed. The source guide recommends Gmail.")
    step(7, "Check that your sponsor's username appears at the top of the form.")
    step(8, "Complete the registration form.")
    note("Account credentials", "Username: at least 7 characters, letters and numbers only, with no special characters. Password: at least 8 characters, including an uppercase letter, a lowercase letter, and a number.")
    step(9, "After completing the form, choose \"Join ClickBaitPays\".")
    step(10, "A welcome email should arrive within a few minutes, confirming activation. Check spam or junk folders if needed. The message is informational; you do not need to click a link to verify the account.")
    step(11, "The registration page displays a welcome message. Choose \"Login here\" to open the login page.")
    note("Account rules", "Each person may have one account. A household or IP address may have at most 3 accounts, each with its own email address. All accounts in a household must have the same original sponsor and may not sponsor each other. For example, if Alice sponsored you, Alice must sponsor other members of your household too. You cannot sponsor someone you live with.", "important")
    page()

    heading("Your account", "Log in and choose a campaign")
    step(1, "Enter your username and password, then choose \"Login\".")
    step(2, "Choose \"Click Ad\" to open the login advertisement. View it for 30 seconds, close the tab, then choose \"Go to Dashboard\".")
    step(3, "Read \"How It Works\" and the FAQ in the left menu to learn how ClickBaitPays works.")
    step(4, "Choose an advertising campaign level to determine the deposit amount you need. You may have up to 3 campaigns active at once per account.")
    note("Important", "An advertising campaign is a purchase of an advertising service. It is not an investment, financial product, or securities offering.", "important")
    story.append(layout.data_table(
        ["Level", "Total purchase", "Ads / day", "Per click", "Campaign end", "Your earnings"],
        [["1", "14 USDT", "3", "0.48 USDT", "19.08 USDT", "17.17 USDT"],
         ["2", "84 USDT", "3", "2.83 USDT", "113.00 USDT", "101.70 USDT"],
         ["3", "165 USDT", "3", "5.40 USDT", "216.00 USDT", "194.40 USDT"],
         ["4", "330 USDT", "5", "6.48 USDT", "432.00 USDT", "388.80 USDT"],
         ["5", "660 USDT", "6", "10.80 USDT", "864.00 USDT", "777.60 USDT"],
         ["6", "1,320 USDT", "10", "12.96 USDT", "1,728.00 USDT", "1,555.20 USDT"],
         ["7", "2,640 USDT", "20", "13.50 USDT", "3,600.00 USDT", "3,240.00 USDT"]],
        [37, 78, 54, 75, 101, 123]))
    story.append(layout.Spacer(1, 7))
    story.append(layout.para("Total purchase includes the level's one-time activation fee. Each new campaign purchase or repurchase on or after October 1, 2026 earns the sponsor 10% of the campaign price, excluding activation fees, credited immediately to Available Balance. This commission is not calculated from the member's click earnings. Campaigns purchased before October 1, 2026 retain the previous commission model until completion. The availability period for your own campaign earnings is separate.", layout.SMALL))
    note("Withdrawal fee", "A 10% fee applies to all earnings withdrawals, regardless of campaign level.", "warning")
    page()

    heading("Campaigns", "Subsequent purchases")
    note("Important", "An advertising campaign is an advertising service, not an investment, financial product, or securities offering.", "important")
    story.append(layout.para("This table applies to purchases after your first purchase at a given level. The one-time activation fee is not charged again. \"Repurchase\" shows the amount payable. All amounts are in USDT."))
    story.append(layout.data_table(
        ["Level", "Campaign cost", "First activation", "Repurchase", "Ads / day", "Per click", "Campaign end", "Your earnings"],
        [["1", "13", "1", "13", "3", "0.48", "19.08", "17.17"],
         ["2", "77", "7", "77", "3", "2.83", "113.00", "101.70"],
         ["3", "150", "15", "150", "3", "5.40", "216.00", "194.40"],
         ["4", "300", "30", "300", "5", "6.48", "432.00", "388.80"],
         ["5", "600", "60", "600", "6", "10.80", "864.00", "777.60"],
         ["6", "1,200", "120", "1,200", "10", "12.96", "1,728.00", "1,555.20"],
         ["7", "2,400", "240", "2,400", "20", "13.50", "3,600.00", "3,240.00"]],
        [27, 57, 61, 61, 38, 57, 78, 89], 6.1))
    story.append(layout.Spacer(1, 14))
    story.append(layout.para("The activation fee is paid once per level, at the first purchase. The following reference retains the activation amounts from the existing getting-started guide.", layout.SMALL))
    story.append(layout.data_table(["Level", "One-time activation fee", "When paid"],
        [["1", "1 USDT", "First purchase at this level"], ["2", "7 USDT", "First purchase at this level"],
         ["3", "15 USDT", "First purchase at this level"], ["4", "30 USDT", "First purchase at this level"],
         ["5", "60 USDT", "First purchase at this level"], ["6", "120 USDT", "First purchase at this level"],
         ["7", "240 USDT", "First purchase at this level"]], [65, 115, 288], 7.2))
    page()

    heading("Deposits", "Fund your account", "Choose your campaign first, then create a new deposit request.")
    step(1, "Choose \"Deposit\" from the left menu.")
    step(2, "Under \"Make A Deposit\", enter the deposit amount in USDT. Several cryptocurrencies are supported. The minimum deposit is 10 USDT.")
    step(3, "Choose \"Deposit Funds\" to continue to NOWPayments.")
    step(4, "Under \"Choose asset\", select the cryptocurrency. NOWPayments supports Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), Tron (TRX), Ripple (XRP), and hundreds of other assets.")
    note("Warning", "The cryptocurrency you select must exactly match the cryptocurrency you send. A mismatch can cause permanent loss. For example, if you select Ethereum (ETH), do not send Tether (USDT).", "warning")
    step(5, "NOWPayments initially displays an estimate of the amount to send.")
    step(6, "Choose \"Next step\".")
    step(7, "NOWPayments displays the exact amount and destination address. Example only, your values will differ: 0.00024851 BTC; address bc1q36ngch858kff04z5g6yz7nftqqnwxp8qjpzxlq.")
    note("Warning", "NOWPayments generates a unique wallet address for each deposit. Always create a new deposit request and use its new address. Reusing an old address can cause loss of funds.", "warning")
    step(8, "Record the ten-digit NOWPayments Payment ID. Support can use it to identify the transaction if there is a problem.")
    page()

    heading("Deposits", "Send the correct amount safely")
    step(9, "Open your cryptocurrency wallet and select the cryptocurrency you chose earlier.")
    step(10, "Choose \"Send\" in your wallet.")
    step(11, "Copy the NOWPayments amount into your wallet's amount field.")
    step(12, "Copy the NOWPayments wallet address into the \"To\", \"Address\", or \"Send To\" field.")
    step(13, "Check again that the amount, wallet address, and cryptocurrency exactly match NOWPayments.")
    note("Warning", "Errors at this stage can cause permanent loss. Verify all details before sending.", "warning")
    step(14, "Choose \"Send\" to submit the transaction.")
    step(15, "Wait for NOWPayments to detect and credit the payment. Depending on the cryptocurrency, this may take 10 minutes to several hours. If it is not credited after 12 hours, contact Telegram support with your username and Payment ID.")
    note("Final check", "Exact amount · correct cryptocurrency and network · new address for this request.")
    page()

    heading("Campaigns", "Start an advertising campaign")
    step(1, "After the deposit is processed, return from NOWPayments to ClickBaitPays. Open \"Buy Ad Campaigns\" on the left.")
    step(2, "Choose the desired level and select \"Buy This Ad Campaign\".")
    step(3, "Enter your ad title and URL. Many members advertise a referral link to another program. You can also advertise a charity or an affiliate product offered on ClickBank.")
    step(4, "Review your ad details and check that your account balance covers the purchase.")
    step(5, "Choose \"Confirm Purchase\".")
    step(6, "After purchase, you will be prompted to pay the level's one-time activation fee to activate earnings.")
    step(7, "For another campaign, return to \"Buy Ad Campaigns\" and repeat steps 1 through 6.")
    note("Reminder", "You may have up to 3 advertising campaigns active at once per account.")
    page()

    heading("Daily activity", "View your advertisements", "After purchasing and activating your campaigns, begin your daily activity.")
    step(1, "Open \"Click Ads\" in the left menu.")
    step(2, "Available ads appear below your campaign information. The number depends on the level. Each opens in a new tab: view it for 15 seconds, close the tab, then choose \"Proceed\". Each campaign has its own ads.")
    step(3, "After completing the ads for all active campaigns, your activity is finished for that day.")
    note("Schedule", "Ads reset daily at midnight Panama time (EST / UTC-5).", "important")
    note("Sequence", "Open the ad → wait 15 seconds → close the tab → choose \"Proceed\".")
    page()

    heading("Help", "Frequently asked questions", "Deposits, member transfers, and advertisements.")
    qa(1, "Which cryptocurrencies are accepted?", "ClickBaitPays accepts many cryptocurrencies, including Bitcoin (BTC), Litecoin (LTC), Dogecoin (DOGE), Solana (SOL), Binance Coin (BNB), and hundreds of others. Check the NOWPayments deposit page for the full list.")
    qa(2, "Which reference currency does ClickBaitPays use?", "Accounting uses USDT-ERC20, also called USDT-ETH or USDT on Ethereum. This is the unit displayed when entering a deposit amount, regardless of the cryptocurrency you send.")
    qa(3, "When is a deposit credited?", "Timing depends on the cryptocurrency and network traffic. Allow up to 12 hours. If it is still missing afterward, contact support.")
    qa(4, "How does Pay It Forward (PIF) work?", "Under \"Financial\", open \"Pay It Forward\". Under \"Send Funds\", enter the recipient's username and amount in USDT, then choose \"Send Funds\". The recipient may need to refresh the page.")
    note("Important", "Funds received through PIF cannot be withdrawn or transferred to another member. They must be used to buy an advertising campaign.", "important")
    qa(5, "How do I view my ads?", "Open \"Click Ads\" and select the first ad below the campaign card. On the countdown page, \"Click Ad\" opens the advertisement and starts its timer. After 15 seconds, close the tab, or go back on mobile, and choose the green \"Proceed\" button. Repeat for all required ads. For multiple campaigns, switch using the tabs above the card.")
    qa(6, "How many campaigns can be active at once?", "Up to 3 per account, regardless of level. Three level-4 campaigns count as three, just as one each at levels 4, 5, and 6 does. When a campaign ends after 12 days, you can buy a new campaign using available funds.")
    page()

    heading("Help", "Frequently asked questions", "Balances, withdrawals, and wallet addresses.")
    qa(7, "When do funds move from In Earned Wallets to Available Balance?", "The existing guide describes a fixed 7-day waiting period after the campaign's 12 clicking days. Once available, funds may be used for PIF, another campaign, or a withdrawal request. Withdrawals have a 10% fee. This campaign-earnings timing is separate from the referral commission credited at purchase.")
    qa(8, "How do I request a withdrawal?", "One withdrawal request per week is allowed. Under \"Financial\", open \"Withdraw\". Under \"Request Withdrawal\", enter the USDT amount; a 10% fee is deducted. Choose the cryptocurrency, enter your Security PIN, and select \"Submit Withdrawal\".")
    note("Wallet choice", "The existing project guide recommends a noncustodial wallet such as Exodus or MetaMask instead of an exchange wallet such as Binance or Coinbase. Exchanges may reject or delay incoming transfers, and in some cases funds can be lost. A noncustodial wallet gives you control of your funds. Withdrawals are processed manually by the administration team. Processing times vary.", "important")
    qa(9, "Which cryptocurrencies are supported for withdrawals?", "Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Binance Coin (BNB), Tron (TRX), Ripple (XRP), Stellar (XLM), Polygon (POL), and Solana (SOL). After selecting the cryptocurrency, enter the matching wallet address.")
    note("Warning", "The address must match the selected cryptocurrency. An Ethereum address cannot receive Bitcoin, for example. An incompatible address can cause permanent loss. ClickBaitPays does not take responsibility for losses from incorrect wallet addresses.", "warning")
    note("About this edition", "This ProNeurs edition updates referral commissions and withdrawal processing using the official FAQ checked October 13, 2026. Other figures and instructions remain from the existing September 4 project guide. Check your account and current official terms for applicable rules and payout timing.")
    return story


def create_pdf(output):
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = layout.BaseDocTemplate(str(output), pagesize=layout.letter,
        rightMargin=52, leftMargin=52, topMargin=78, bottomMargin=47,
        title="ClickBaitPays Getting Started Guide - English Edition", author="ProNeurs",
        subject="Getting-started guide with updated campaign-purchase referral commission")
    frame = layout.Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
        id="content", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([layout.PageTemplate(id="guide", frames=[frame], onPage=draw_page)])
    doc.build(build_story())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "public/docs/getting-started-clickbaitpays-en.pdf")
    args = parser.parse_args()
    create_pdf(args.output.resolve())
    print(args.output.resolve())

# Referral purchase commission and updated overview

Date: October 13, 2026

## Current rule and scope

The owner's instruction and supplied October 6 overview establish a direct
referral commission of **10% of campaign purchase price**, excluding activation
fees, credited immediately when the referred member purchases or repurchases a
campaign. Referral commissions no longer accrue from the referred member's
daily clicks. The supplied video explicitly shows 7.70 USDT for a 77-USDT
campaign, 30 USDT for a 300-USDT campaign, and 240 USDT for a 2,400-USDT campaign.

The [official FAQ](https://clickbaitpays.me/questions.php), checked October 13,
confirms this rule applies to purchases on or after October 1, 2026. Campaigns
purchased earlier retain their previous referral calculation until completion.
The translated FAQs and all guides now state that transition. The current FAQ
also describes variable manual withdrawal processing; the outdated 48-hour
promise has been removed from the localized FAQs and guides.

The shared sponsor template, calculator, English/French/German explanations,
translated FAQ answers, and all three downloadable getting-started guides use
this rule. The English resource now uses a local ProNeurs edition because the
previous external PDF described the old referral calculation. Older strategy
and back-office recordings remain available with adjacent referral corrections.

The updated welcome recording is used in English. The owner subsequently
confirmed that French/German should retain their September 28 native-language
overview recordings with a prominent, translated referral correction beside
each welcome video. Their original native-language welcome posters are restored.

## Media record

- Supplied file: `ClickBaitPays UPDATED Overview 10-6-26.mp4`
- Original Desktop file retained; local archive:
  `media/videos/2026-10-06/en/ClickBaitPays UPDATED Overview 10-6-26.mp4`
- R2 bucket: `proneurs-cbp-media`
- Object: `videos/clickbaitpays-overview-2026-10-06.mp4`
- Public URL: <https://cbp-media.proneurs.org/videos/clickbaitpays-overview-2026-10-06.mp4>
- Bytes: 53,730,304
- SHA-256: `e40636c08f73a930719f90a076dc1bcb870d1b80c78cd9a2da1b4fbaff001b03`
- Video: H.264, 1920×1080, 30 fps; audio: AAC stereo; duration: 387.20 seconds
- Poster: `public/video-posters/welcome-2026-10-06.jpg`, 1280×720
- Poster SHA-256: `f4f07a50a7e162a3486e6bcc5ca731f2dd6f516b1b299757dc3162783cbbf665`

The new immutable version preserves all previous video objects. Hosted bytes
match the original SHA-256. HEAD reports MP4 type, English language, inline
disposition, byte-range support, and immutable one-year caching; a 1,024-byte
range request returns HTTP 206 and the expected total object size.

## Calculator assumptions and confirmed hold timing

All calculator paths credit the full referral commission on the modeled
purchase day, including day 0. Available commissions can fund later campaign
purchases when slots reopen without waiting for own click earnings. Existing
withdrawal fees apply only to modeled withdrawals, not to internal reinvestment
or the credited commission itself. UI labels distinguish credited commission
from estimated cash after the withdrawal fee.

The assumed 19-day/12-day referral cadence describes when referred people buy
again; it is not a delay in paying referral commissions. The active UI assumes
19-day repurchases for referrals independently of the user's own continuation
choice. Existing participant campaign earnings remain unchanged.

The new overview's “Earn & Withdraw” slide says earnings are held for **18
days**, while the current calculator and earlier guides use 12 completed click
days plus a seven-day hold. The official FAQ still explicitly states 12 click
days followed by a seven-day hold as of October 13. The owner explicitly
confirmed to keep the current timing as is. The calculator continues to use
12 click days plus a 7-day hold, and the temporary timing-uncertainty note has
been removed from all three locales. Referral commissions remain immediate
and independent of this hold.

## Verification and publication

- All 37 calculator tests passed, including purchase-day credit, repurchases,
  activation exclusion, initial cash availability, and early reinvestment.
- All 161 unit/integration tests passed in the clean release snapshot.
- Dependency audit, lint, typecheck, and OpenNext Worker build passed.
- English/French/German guides each have ten pages and passed text and visual QA.
- Local desktop Chromium/mobile WebKit checks: 77 passed, one existing mobile
  keyboard-only check skipped. The new six referral checks passed after their
  assertion was corrected to recognize the actual translated purchase wording.
- The final content pass also passed 30 media/i18n tests, lint, and typecheck.
- Staging: all 29 smoke checks passed, with one existing mobile keyboard skip;
  eight focused routing/referral checks passed again after the final FAQ/guide
  wording changes. Latest staging version:
  `e4830b75-d204-4018-90af-48a6fee3cddc`.
- Initial staging routing checks exposed production URLs in the staging build.
  Rebuilding with the existing staging URL variables resolved the mismatch.
- Production deployed successfully: `58748fe6-d1a1-40d0-8fd1-2e263fcb2f1b`.
  All 29 live desktop/mobile smoke checks passed; one existing mobile keyboard
  check remains intentionally skipped. Native playback, all three languages,
  purchase-entry dialogs, routing, responsive layout, and actual referral
  calculations were verified without submitting payments or analytics.
- Five public pages, all three guide files, and both legacy tenant hosts passed
  independent live HTTP checks. Every deployed PDF matches its local SHA-256.
  Desktop/mobile welcome and calculator screenshots were visually checked.
- Previous production version for recovery:
  `f12085f1-701e-4e0e-84f0-97af2c9eda74`.

### Owner preference follow-up

The French/German welcome sources/posters and captions were restored, the
translated referral correction was added beside both welcome videos, and the
calculator's timing-uncertainty note was removed. Follow-up dependency audit,
lint, typecheck, 30 media/i18n tests, and the Worker build passed. All 14 focused
desktop/mobile playback, language-switching, caption, and calculator checks
passed locally and on staging (`895c7185-35d6-4c27-92c7-b464f40a7719`).
Production follow-up deployed as `3854c07b-a648-478a-b22f-ee2e0a7f35ca`. All
14 focused live desktop/mobile checks passed. Independent HTTP checks confirm
English uses the updated overview, French/German use their native recordings,
and both localized welcome corrections are present. Desktop German and mobile
French screenshots were visually checked. No calculator math or guide PDF
changed. The previous production version for this follow-up is
`58748fe6-d1a1-40d0-8fd1-2e263fcb2f1b`. Follow-up evidence is saved in
`../reports/2026-10-13-cbp-language-followup/` at the ProNeurs workspace root.

Live application: <https://cbp.proneurs.org/s/your-name>. Evidence is saved in
`../reports/2026-10-13-cbp-referral-update/` at the ProNeurs workspace root.

The original checkout contains pre-existing iCloud duplicate files named
`* 2.ts`/`* 2.sql`; one obsolete duplicate causes typecheck to fail and another
contains a retired video-poster assertion. Release checks use the canonical
source snapshot excluding those untracked sync backups. The originals remain
untouched. Fresh dependencies and the release snapshot are at
`/Users/mtheo/.cache/cbp-referral-update-runtime`.

Rollback restores the earlier application build/source mappings. All old R2
objects and poster images remain available; no billing or database migration is
part of this release.

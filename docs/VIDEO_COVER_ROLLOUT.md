# Clean video covers — click-to-play rollout

Date: 2026-09-05

Baseline: `a049fde69f9cabdd1550dd54c105100934dd9ecb`

## Approved behavior

Show a local cover image and a clearly labeled Play button instead of a live YouTube iframe on initial page load. Explicit click or keyboard activation replaces the entire cover with the existing video. Do not cover, crop, or interfere with YouTube's interface once it loads. Its title/channel overlay can appear after playback activation; this change removes it from the initial page view, not from the YouTube service.

Keep the current recordings, content, order, captions preferences, 16:9 containers, page URLs, language selection, referrals, calculator, signup, accounts, and billing unchanged. No video downloads, paid hosting, or channel modifications are part of this release.

## Original videos and cover sources

| Slot | Video ID | Original thumbnail | Local cover names |
| --- | --- | --- | --- |
| Welcome | `PhTIPCzqMjw` | https://i.ytimg.com/vi/PhTIPCzqMjw/maxresdefault.jpg | `public/video-posters/welcome-{en,fr,de}.jpg` |
| Strategy | `YFbW5RSLOQM` | https://i.ytimg.com/vi/YFbW5RSLOQM/maxresdefault.jpg | `public/video-posters/strategy-{en,fr,de}.jpg` |
| Member tour | `JQEnm6I37dI` | https://i.ytimg.com/vi/JQEnm6I37dI/maxresdefault.jpg | `public/video-posters/tour-{en,fr,de}.jpg` |

The welcome and tour currently use identical upstream thumbnail artwork. Keep their English thumbnails byte-for-byte and share the corresponding localized artwork while retaining distinct filenames/slot identities. Their existing page titles/descriptions distinguish the two recordings.

The strategy thumbnail has a faint, overlapping background slide. Clean that ghosting from the cover only while retaining the main foreground comparison. Do not edit the underlying video.

## Implementation and verification

- One shared client component, `app/SiteVideo.tsx`, renders covers for all three slots across English/French/German and every personalized site.
- The initial render contains local artwork and a native button, with no YouTube iframe, scripts, thumbnail URLs, or preconnects.
- Clicking creates only the selected iframe. `lib/video-playback.ts` adds `autoplay=1` and `playsinline=1` to its existing URL; original IDs and localized caption settings are retained.
- Normal YouTube controls remain available if a browser blocks automatic playback after loading. Keyboard focus moves into the player without scrolling.
- Changing language or video resets the component to the appropriate cover. Hover/focus alone never activates the player.
- Existing content/media-baseline tests stay intact. New regression coverage checks real SSR markup, local assets, accessible names, locale/slot integration, and playback parameters.
- Before production: lint, typecheck, complete tests, dependency policy, Worker build; then Chrome desktop/mobile checks, green GitHub CI, staging verification, and the existing approved production workflow.
- Browser checks must include zero initial iframes, no YouTube resource-loading elements before activation, all three click activations, unchanged IDs, a working player, localized covers and caption preferences, responsive dimensions, and resetting to a cover on language switch.

### Pre-release results

- All 119 tests passed, including 12 new video-facade tests and the unchanged media-preservation baseline.
- Full lint, typecheck, dependency-security policy, and production Cloudflare Worker build passed.
- Independent code and visual asset review found no actionable issues. All nine JPEG covers are 1280 × 720.
- Chrome confirmed three local covers and zero iframes initially, with no YouTube resource-loading elements. All three current recordings played after activation; keyboard Enter also activated the strategy player and moved focus into it.
- French and German playback URLs retained their existing caption-language preferences. Desktop and 390 px / 320 px phone checks preserved 16:9 frames without horizontal overflow. Language changes restored three appropriate covers and stopped the previously activated player.
- No browser console errors were reported during local verification. Network timing APIs were unavailable through the browser inspection interface; the resource check used rendered DOM and SSR regression assertions, not a captured network trace.

## Image-edit record

Mode: built-in image-generation tool, text-localization and precise-object-edit. No API/CLI fallback.

English welcome/tour covers are unchanged original thumbnail copies, not generated images. The following five outputs are inspected and optimized as JPEG assets. The welcome French/German outputs also supply the matching tour language asset.

### Final prompt set

#### welcome-fr

Use case: text-localization. Edit target: attached current ClickBaitPays YouTube thumbnail. Create a precise French version of this 16:9 video cover. Preserve the ClickBaitPays logo and brand wordmark exactly, the black/navy circuit-board background, cyan and magenta neon lines, glowing frame, gradient bold italic 3D lettering and overall geometry. Replace only English promotional text. Large cyan headline: "ENTREZ DANS". Large magenta headline: "UNE NOUVELLE ÈRE". Subtitle: "Les revenus numériques, simplifiés". Bottom label: "Présentation pas à pas". Render these exact accented French words legibly; adjust font size minimally to fit. No extra text, no people, no YouTube interface/channel name, no avatar, no captions, no player controls, no play button. Keep 16:9 framing with all borders visible.

#### welcome-de

Use case: text-localization. Edit target: attached current ClickBaitPays YouTube thumbnail. Create a precise German version of this 16:9 video cover. Preserve the ClickBaitPays logo and brand wordmark exactly, the black/navy circuit-board background, cyan and magenta neon lines, glowing frame, gradient bold italic 3D lettering and overall geometry. Replace only English promotional text. Large cyan headline: "STARTEN SIE IN". Large magenta headline: "EINE NEUE ÄRA". Subtitle: "Digitale Einnahmen, einfach erklärt". Bottom label: "Schritt-für-Schritt-Überblick". Render these exact German words and umlauts legibly; adjust font size minimally to fit. No extra text, no people, no YouTube interface/channel name, no avatar, no captions, no player controls, no play button. Keep 16:9 framing with all borders visible.

#### strategy-en

Use case: precise-object-edit. Edit target: the attached current income-strategy YouTube thumbnail. Clean up this exact 16:9 thumbnail: remove ONLY the faint ghosted background slide/text (LEVEL 7 EXAMPLE, the $2,445 amount, and other faint overlapping writing) so there is a clean nearly black background behind the bright foreground. Preserve foreground content exactly: title "ONE CAMPAIGN VS." then "STAGGERED STRATEGY"; left cyan/magenta frame heading "JUST ONE CAMPAIGN", bullets "One-time income cycle", "Income stops at completion", "Longer wait between payouts", "Limited monthly potential"; center circle "VS."; right frame heading "THREE STAGGERED CAMPAIGNS", bullets "Overlapping income cycles", "Multiple payouts every week", "Consistent rolling cash flow", "Much higher monthly potential"; bottom "STAGGER. REINVEST. MULTIPLY.". Keep neon blue/magenta circuit borders and composition, sharp white text, all foreground frame edges. Remove no primary bullet. Do not add amounts, promises, people, logo watermarks, player controls, YouTube branding, a channel name or a play button. Output 16:9.

#### strategy-fr

Use case: text-localization. Edit target: attached current income-strategy YouTube thumbnail. Make a clean French localized 16:9 edition, preserving the dark background, cyan/magenta circuit borders, two outlined comparison panels, VS circle and all geometry. Remove the faint ghosted secondary background slide entirely (including LEVEL 7 EXAMPLE and $2,445); retain only the main foreground comparison, translated as follows. Title top line "UNE CAMPAGNE OU", second line "UNE STRATÉGIE ÉCHELONNÉE". Left heading "UNE SEULE CAMPAGNE". Left bullets: "Un seul cycle de revenus", "Les revenus cessent à la fin", "Plus d’attente entre les versements", "Potentiel mensuel limité". Center "VS". Right heading "TROIS CAMPAGNES ÉCHELONNÉES". Right bullets: "Des cycles de revenus qui se chevauchent", "Plusieurs versements chaque semaine", "Des rentrées régulières", "Un potentiel mensuel bien plus élevé". Bottom: "ÉCHELONNER. RÉINVESTIR. MULTIPLIER.". Render exact French words and accents, resizing or wrapping only as needed without crowding. No other text, no dollar amounts, people, captions, channel name, YouTube overlay or play button. All edges in frame.

#### strategy-de

Use case: text-localization. Edit target: attached current income-strategy YouTube thumbnail. Make a clean German localized 16:9 edition, preserving the dark background, cyan/magenta circuit borders, two outlined comparison panels, VS circle and all geometry. Remove the faint ghosted secondary background slide entirely (including LEVEL 7 EXAMPLE and $2,445); retain only the main foreground comparison, translated as follows. Title top line "EINE KAMPAGNE ODER", second line "EINE ZEITVERSETZTE STRATEGIE". Left heading "NUR EINE KAMPAGNE". Left bullets: "Einmaliger Einnahmezyklus", "Einnahmen enden mit dem Abschluss", "Längere Wartezeit zwischen Auszahlungen", "Begrenztes monatliches Potenzial". Center "VS". Right heading "DREI ZEITVERSETZTE KAMPAGNEN". Right bullets: "Überlappende Einnahmezyklen", "Mehrere Auszahlungen pro Woche", "Regelmäßige laufende Einnahmen", "Deutlich höheres monatliches Potenzial". Bottom: "STAFFELN. REINVESTIEREN. VERVIELFACHEN.". Render exact German words and umlauts, resizing or wrapping only as needed without crowding. No other text, no dollar amounts, people, captions, channel name, YouTube overlay or play button. All edges in frame.

## Known limits

YouTube branding can reappear after a viewer intentionally starts the video, including on hover, pause, or completion. This is expected. Existing English audio remains; cover localization is not dubbing, and requested captions depend on track availability.

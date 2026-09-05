# Multilingual site rollout plan

Created: 2026-09-05

Status: implementation complete; local validation passed; release through existing gated CI/staging/production workflow

Baseline: production commit `99c945181c183916cbd812162c58ae501255c253`

## Goal and approved experience

One ProNeurs application, domain, customer account, sponsor identity, and design serves multiple languages. Visitors can start at the same shared site address and select their language. Existing English and French links continue to work. German is the next complete language; future languages use the same registry and template structure.

The top of public and customer pages will feature country flags with readable language names: 🇺🇸 English, 🇫🇷 French · Français, and 🇩🇪 German · Deutsch. Flags are decorative; the language names identify the actual choice. Up to five available languages appear directly. A compact dropdown is used on narrow screens and becomes available when the registry grows beyond five. Do not display unfinished languages as working choices.

The selector marks the current language, works with keyboard and screen readers, retains the same sponsor and equivalent page, and preserves approved attribution parameters (`source`, `utm_*`) and canceled-checkout state. Authentication and checkout tokens must not leak through language links. Language changes on token-bearing confirmation/success pages go to the appropriate localized sign-in/account entry rather than copying tokens.

Remember an explicit selection locally. Honor deliberately shared language URLs. When someone returns to a neutral English entry, offer their remembered language without forcibly overriding a direct link or browser language. All internal navigation, signup, and account return paths carry the chosen locale.

## URL and template structure

| Surface | English | French | German |
| --- | --- | --- | --- |
| Sales | `/get-your-site` | `/fr/get-your-site` | `/de/get-your-site` |
| Path-based sponsor | `/s/{slug}` | `/fr/s/{slug}` | `/de/s/{slug}` |
| Sponsor host | `/` | `/fr` | `/de` |
| Account | `/manage` | `/fr/manage` | `/de/manage` |

Keep these paths within the same deployment. Publish correct page language and reciprocal language metadata. Consolidate the English/French sales markup into one template with locale-specific copy and media, preserving each existing version's content and styling. Continue using the shared sponsor page, calculator, and customer components.

## Content and functionality preservation

Start from the latest production source; do not copy older site versions. Preserve existing English/French copy, media, sponsor profile data, authored biographies, referral links, billing prices, calculator assumptions/math, analytics events, and authentication behavior.

The exact current YouTube sources are frozen for this rollout:

| Placement | Current video ID | Source |
| --- | --- | --- |
| Welcome / overview | `PhTIPCzqMjw` | https://www.youtube.com/watch?v=PhTIPCzqMjw |
| Income strategy | `YFbW5RSLOQM` | https://www.youtube.com/watch?v=YFbW5RSLOQM |
| Back-office tour | `JQEnm6I37dI` | https://www.youtube.com/watch?v=JQEnm6I37dI |

Retain YouTube embeds, not earlier Vimeo players. Preserve English and French raster artwork; create sibling German assets. Test source IDs in rendered output and in the regression suite. Captions and player interface language may vary by locale, but these source videos remain unchanged until a separate, reviewed dubbing release.

## German delivery scope

1. Extend the validated locale registry and URL helpers to `en`, `fr`, and `de`; add the shared flag selector and German document language/response headers.
2. Translate public sponsor content, navigation, calculator labels, testimonials' accompanying text, resource descriptions, FAQs, accessibility text, metadata, and social/preview images. Preserve original testimonial screenshots.
3. Translate the sales template, signup/validation, success and cancellation experience, customer sign-in, profile editing, share tools, billing portal actions, and account states.
4. Carry German through Stripe Checkout locale and metadata, provisioning, billing return paths, welcome/reminder emails, magic links, sign-out and customer updates. Keep prices at USD 9/month and USD 79/year; display US dollars explicitly. Language selection does not silently convert currency.

   Pending-payment continuity: if a customer already has an open payment for the same site/account, plan, and sponsor attribution, signup resumes that exact payment in its original language, including after a language change. Its return links and transactional email language remain associated with the original payment. This prevents duplicate payable sessions and idempotency conflicts. New payments use the selected language.
5. Produce a German edition of the current getting-started guide and translated explanatory/policy routes. Preserve source figures and interface names, and identify original-language third-party resources.
6. Preserve current English video audio while requesting German captions when available. Supply German summaries and explain how to choose an available audio/caption track. A requested caption language is not proof that a translated track exists.

## Video localization recommendation

Preferred publishing setup: keep each existing YouTube video ID and attach French/German audio tracks, captions, and translated titles/descriptions through the source channel's YouTube Studio. This retains embedded links and video history. YouTube can auto-dub English into French and German on eligible videos; actual availability must be checked in that channel. Preview translations, brand pronunciation, figures, and timing before publication.

HeyGen is a useful production tool for a controlled dub, especially a presenter-led overview. Test one short segment before translating whole videos. Use audio-only translation for slides/dashboard walkthroughs; lip sync adds value where a face is visible. Preserve the current source, visuals, figures, and music settings. HeyGen does not automatically translate text baked into the image. Its translated video can also be a separate language upload when a changed visual track is required; that would need a deliberate locale-to-video mapping in a later release. Do not replace any live source during this website rollout.

For custom audio on the same YouTube video, match the original duration and use the source channel's multi-language audio feature. HeyGen's dynamic-duration setting can alter length, so review that setting. Check the plan's export options before purchase; audio-only download and script proofreading availability vary by plan. We have not purchased a plan, submitted videos to a dubbing service, or verified channel access in this rollout.

Sources checked 2026-09-05:

- [YouTube multi-language audio](https://support.google.com/youtube/answer/13338784?hl=en)
- [YouTube automatic dubbing](https://support.google.com/youtube/answer/15569972?hl=en)
- [YouTube embed parameters](https://developers.google.com/youtube/player_parameters): `hl` is interface language; `cc_lang_pref` requests a caption language, not a dubbed audio track.
- [HeyGen video translation workflow](https://help.heygen.com/en/articles/10029081-how-to-get-started-with-video-translation)

## Validation and release

- Verify all three languages, same-page switches, sponsor/source retention, safe token handling, saved preference behavior, keyboard focus and the mobile dropdown.
- Compare the current video IDs and calculator outcomes with the baseline. Ensure English/French assets remain byte-for-byte unchanged.
- Check German content for complete keys, natural wording, long-label wrapping, umlauts, ß, number formatting, and USD labels.
- Render and inspect every German PDF page; validate guide links and image loading.
- Exercise signup validation and account return/error paths without charging a live card or changing customer records.
- Run repository lint, typecheck, tests, dependency policy, and Cloudflare Worker build. Use green GitHub CI, staging, then the existing approved production deployment workflow.
- Verify production language headers, routes, image/PDF content, mobile layouts, and video embeds. The implementation commit's GitHub Actions CI and deployment runs are the release audit trail; dubbing remains a separate follow-up.

### Completed implementation checks (2026-09-05)

- Repository suite: 107 tests pass, including new locale/lifecycle coverage and source-media preservation checks.
- ESLint, TypeScript, dependency security policy, and optimized Cloudflare Worker build pass. No dependency upgrades, pricing changes, database migrations, or video-source changes were required.
- Chrome: English/French/German sales pages; German signup dialog; 320px and 390px mobile layouts; desktop flags; saved-language offer; same-sponsor switching with source/UTM/hash retention; current-language no-op; account entry/error paths; all three current YouTube embeds; German calculator interaction. No browser errors observed in the checked flows.
- German PDF: all 10 pages rendered and visually inspected; translated content checked against the current source. German preview/social images inspected. Existing EN/FR preview images remain byte-for-byte unchanged.
- Legal page metadata: 17 locale/page maps checked against existing internal routes. FAQ advertises only FR/DE equivalents; the official English FAQ remains a source link rather than an incorrect alternate HTML page.
- No live card was charged, customer record modified, sign-in email sent, or dubbing service purchased as part of verification. Local account testing used a configuration-free preview; staging/live verification checks the configured email entry without submitting it.

### German assets and reproducible edit brief

The built-in image-generation tool was used in **text-localization edit mode**, not the API/CLI. Final project assets:

- `public/clickbaitpays-replicated-site-preview-de.jpg` — 1674 × 714; German sibling of the existing English preview.
- `public/og-de.png` — 1536 × 1024; German sibling of the existing French social artwork.
- `public/docs/clickbaitpays-startanleitung-de.pdf` — 10-page German guide, generated by `scripts/generate-german-guide.py` with the existing guide's layout helpers.

Final image prompt set / edit brief:

1. **Sales preview:** localize the existing preview's in-image English copy into formal German. Preserve the dark background, cyan/purple gradients, layout, proportions, ClickBaitPays branding, player artwork, and risk disclosure. Main lines: “So funktioniert es.”, “Verstehen Sie die Risiken.”, “Entscheiden Sie gut informiert.” Button: “ClickBaitPays beitreten”. Player heading: “Hier starten · Willkommen bei ClickBaitPays”; cover: “Willkommen bei ClickBaitPays”. Keep the complete independent-affiliate/financial-risk/no-guaranteed-income disclaimer in German. Change only in-image copy; do not alter any live embed.
2. **Social artwork:** preserve the existing French artwork's composition, colors, logos, and visual style; replace only its text with “IHRE CBP-WEBSITE”, “Finden Sie Ihren Rhythmus.”, “Erweitern Sie Ihre Reichweite.”, “Kampagnenstrategie + Simulator für direkte Empfehlungen”, and “Beispielhafte Ergebnisse · Einnahmen nicht garantiert”.

These are marketing stills, not replacement video files. Original third-party video audio and testimonial screenshots are intentionally retained and labeled where relevant.

## Adding another language

Add its locale/format/flag/name to the registry, complete every public/sales/customer/backend translation, produce document and image variants, verify media fallbacks, add language alternates and coverage, then activate the selector entry. Once more than five languages exist, the overflow dropdown exposes all available languages while featured choices remain compact. This needs no new site or deployment infrastructure.

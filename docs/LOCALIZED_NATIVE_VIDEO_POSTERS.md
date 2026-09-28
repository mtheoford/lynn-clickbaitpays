# Localized covers for the current native videos

Date: 2026-09-28

The migration to project-hosted MP4 playback and new English title-frame posters
left French and German pages using English covers. Restore the previously approved
French/German artwork as native `video` posters, without reverting the migration.

## Scope

- `lib/video-posters.ts` maps English, French and German to their three covers.
- English keeps the current `welcome.jpg`, `income-strategy.jpg`, and `back-office.jpg` files unchanged.
- French/German reuse the six approved `welcome-{fr,de}.jpg`, `strategy-{fr,de}.jpg`, and `tour-{fr,de}.jpg` assets from commit `b488dc7`; no images are regenerated.
- The current September 10 overview, income-strategy and back-office MP4 URLs remain unchanged.
- Native controls, inline playback, metadata preloading, layout, captions policy, and all other page content remain unchanged. No YouTube iframe or custom overlay is restored.
- A changed poster keys the native video element so switching language after playback shows the new cover instead of retaining the old video frame.
- Only pre-playback covers are translated. Audio and text within the recordings are still English.

## Verification and release

Unit/SSR checks cover all nine language/slot combinations, current source URLs,
English poster hashes, and the page's locale-aware wiring. Browser regression tests
check all three languages on desktop Chromium and mobile WebKit, decode the covers,
and start each current native recording. Language-switch checks exercise a played
video and confirm that selecting French restores a paused, zero-time player with
the French cover. Release through the existing green-CI, staging, and approved
production workflow, then verify the main and personalized live routes in all languages.

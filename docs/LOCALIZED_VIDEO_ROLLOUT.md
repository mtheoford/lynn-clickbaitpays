# French and German video rollout

Date: 2026-09-28

## Scope

Use the six translated MP4s supplied on the Desktop for the French and German
replicated sites. Preserve all three English recordings, all nine existing poster
images, native player controls, responsive layout, referral attribution, and
purchase flows. Only the source mapping and now-outdated English-audio notices
change. No YouTube player is restored.

## Original files and hosting

The six originals were moved, without re-encoding or renaming, into
`media/videos/2026-09-28/fr/` and `media/videos/2026-09-28/de/` in this project.
These large local masters are excluded from Git. The deployment references R2
objects in the existing `proneurs-cbp-media` bucket, served by
`https://cbp-media.proneurs.org/videos/`.

| Language / slot | Original filename | Hosted filename | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| French welcome | CBP-Overview-French.mp4 | clickbaitpays-overview-fr-2026-09-28.mp4 | 40461559 | f9a0bf856e374bab3c2eef82cba1d2df49b8b46443be56a4240dd8024e3b4b9c |
| French strategy | CBP-IncomeStrat-French.mp4 | clickbaitpays-income-strategy-fr-2026-09-28.mp4 | 63513156 | 1766be371ae406f58899aca425e6e1e1cb6c3f5a3da748c0550551509011d6e5 |
| French third video | 30_min_CBP_Presentation-French.mp4 | clickbaitpays-presentation-fr-2026-09-28.mp4 | 138815952 | 01f71f1c033fb4d6aa4ea08f52935fb26175ce9ab97b5961b507748a2288b2eb |
| German welcome | CBP-Overview-German.mp4 | clickbaitpays-overview-de-2026-09-28.mp4 | 40469794 | 0d553c0ad146bf59ae8cfecc9407a3d0d89b547f082f633e70766c016d7cb6f9 |
| German strategy | CBP-IncomeStrat-German.mp4 | clickbaitpays-income-strategy-de-2026-09-28.mp4 | 63519785 | b9221ed999ded8949e25fcb807ea8758faaab7aabfc90f6a0832843f0078381f |
| German third video | 30_min_CBP_Presentation-German.mp4 | clickbaitpays-presentation-de-2026-09-28.mp4 | 139065560 | 3cbbfe49b4d8ea9407c455ae95abf0797c4415e36f46f23a2874914bf59cdbe4 |

All files have H.264 video and AAC audio. Overview and strategy are 1920×1080,
approximately 5:51 and 7:37. The longer presentations are 1280×720, approximately
33:50 (French) and 34:02 (German), and retain their embedded subtitle tracks.
This release does not promise browser subtitle support or translate text baked
into the supplied recordings. It serves the supplied files unchanged.

## Implementation and release plan

1. Inventory, inspect, hash, and move the six supplied files into the archive.
2. Upload to new dated, language-specific objects without overwriting any current
   English media. Set MP4 content type, language, inline disposition, and immutable
   one-year cache headers.
3. Select the source using the page locale in `lib/video-sources.ts`. Retain the
   existing language-specific posters and native player remount on language change.
4. Correct only the French/German video-language titles and summary notices.
5. Verify exact hosted bytes, range requests, matching source/poster per locale,
   actual desktop/mobile playback, and switching languages after playback.
6. Run release checks, push, deploy staging, then production with existing gates.
   Check both path-based and tenant-subdomain URLs.

## Preservation and rollback

English URLs and poster hashes remain fixed in regression tests. The French copy
baseline changes only for the six audio-language notices. All unrelated content
and assets remain unchanged. To roll back this release, revert its application
commit and redeploy through the same release gates; keep the archived originals
and versioned R2 objects for recovery.

This document supersedes the all-English audio note in `VIDEO_MEDIA_ROLLOUT.md`
and the unchanged-English-audio note in `LOCALIZED_NATIVE_VIDEO_POSTERS.md`.

# Project-hosted site videos

Date: 2026-09-13

The three public-site videos are native HTML video players backed by MP4 objects in the project-specific Cloudflare R2 bucket `proneurs-cbp-media`. They are served from `https://cbp-media.proneurs.org` with native controls, inline mobile playback, and metadata-only preload. The previous YouTube iframe facade and its nine localized cover images are retired.

## Approved sources

| Page slot | Source file | R2 object | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Welcome | `ClickBaitPaysVideo.mp4` | `videos/clickbaitpays-overview-2026-09-10.mp4` | 41,689,413 | `ad74ae48ce95b152794529672ce1fc027415b0fbdd473449fc348e583878c988` |
| Income strategy | `ClickBaitPaysIncomeStrat.mp4` | `videos/clickbaitpays-income-strategy-2026-09-10.mp4` | 65,141,240 | `aa8ac82c40c77a36359a9ffc19526a0c3e290fd94faecb52691adbe13d586146` |
| Back-office walkthrough | `CBP New Deck Presentation 9-10-26.mp4` | `videos/clickbaitpays-back-office-2026-09-10.mp4` | 162,096,539 | `081fb12acaa6325d7696866d7534b5c27e8877278697f587a731b14ee23169e1` |

All three supplied files are H.264 video with AAC audio. Objects use `Content-Type: video/mp4`, inline content disposition, and `Cache-Control: public, max-age=31536000, immutable`. New recordings must use new versioned object names so a release never depends on cache invalidation.

The supplied files contain no subtitle tracks. French and German page summaries
identify the English-language presentation without promising captions that are
not present. Add reviewed WebVTT tracks to the native players before advertising
localized captions in a future release.

## Why the files are not in Worker static assets

Cloudflare Workers Static Assets have a 25 MiB per-file limit. Each approved MP4 exceeds that limit, and the back-office recording also exceeds GitHub's normal 100 MiB file limit. R2 retains the original files without recompression while keeping media separate from the application bundle.

## Release checks

- Keep the three source URLs and their order covered by `tests/media-preservation.test.ts` and `tests/video-facade.test.ts`.
- Preserve the existing 16:9 containment rules that prevent mobile overflow.
- Verify every public media URL supports byte-range requests and reports the expected object length, type, and immutable cache header.
- Run the complete release verification and browser checks before staging and production deployment.

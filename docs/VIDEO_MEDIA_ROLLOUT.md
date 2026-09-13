# Project-hosted site videos

Date: 2026-09-13

The three public-site videos are native HTML video players backed by MP4 objects in the project-specific Cloudflare R2 bucket `proneurs-cbp-media`. They are served from `https://cbp-media.proneurs.org` with native controls, inline mobile playback, and metadata-only preload. Each player uses an approved title frame from its replacement recording as its native poster. The previous YouTube iframe facade and its nine localized Russ Curran cover images remain retired.

## Approved sources

| Page slot | Source file | R2 object | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Welcome | `ClickBaitPaysVideo.mp4` | `videos/clickbaitpays-overview-2026-09-10.mp4` | 41,689,413 | `ad74ae48ce95b152794529672ce1fc027415b0fbdd473449fc348e583878c988` |
| Income strategy | `ClickBaitPaysIncomeStrat.mp4` | `videos/clickbaitpays-income-strategy-2026-09-10.mp4` | 65,141,240 | `aa8ac82c40c77a36359a9ffc19526a0c3e290fd94faecb52691adbe13d586146` |
| Back-office walkthrough | `CBP New Deck Presentation 9-10-26.mp4` | `videos/clickbaitpays-back-office-2026-09-10.mp4` | 162,096,539 | `081fb12acaa6325d7696866d7534b5c27e8877278697f587a731b14ee23169e1` |

## Approved poster frames

| Page slot | Project asset | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Welcome | `public/video-posters/welcome.jpg` | 1280 × 720 | 297,506 | `01bb0706fde7f13c44a1413d2feaecdf0dca0e2f7a33f76deee7987d342a71a5` |
| Income strategy | `public/video-posters/income-strategy.jpg` | 1280 × 720 | 292,048 | `420b5c421dab88e27ee9b5173dc408dbf43ab6bbf4a5f52d45f7a65bffa9ffc8` |
| Back-office walkthrough | `public/video-posters/back-office.jpg` | 1280 × 720 | 271,826 | `6d8ca98c883a93fe1537a527e7e2294accaf1809e058145b5f0ee3bbfb398699` |

These are static JPEG exports of the new videos' opening title cards. They are
not restored copies of the retired YouTube-cover artwork. The browser supplies
the play control directly over each native poster.

All three supplied files are H.264 video with AAC audio. Objects use `Content-Type: video/mp4`, inline content disposition, and `Cache-Control: public, max-age=31536000, immutable`. New recordings must use new versioned object names so a release never depends on cache invalidation.

The supplied files contain no subtitle tracks. French and German page summaries
identify the English-language presentation without promising captions that are
not present. Add reviewed WebVTT tracks to the native players before advertising
localized captions in a future release.

## Why the files are not in Worker static assets

Cloudflare Workers Static Assets have a 25 MiB per-file limit. Each approved MP4 exceeds that limit, and the back-office recording also exceeds GitHub's normal 100 MiB file limit. R2 retains the original files without recompression while keeping media separate from the application bundle.

## Release checks

- Keep the three source URLs, poster paths, poster hashes, and their order covered by `tests/media-preservation.test.ts` and `tests/video-facade.test.ts`.
- Preserve the existing 16:9 containment rules that prevent mobile overflow.
- Verify every public media URL supports byte-range requests and reports the expected object length, type, and immutable cache header.
- Run the complete release verification and browser checks before staging and production deployment.

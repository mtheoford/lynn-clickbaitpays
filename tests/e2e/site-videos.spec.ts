import { expect, test, type Locator } from "@playwright/test";

const approvedVideos = [
  {
    poster: "/video-posters/welcome.jpg",
    source: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-2026-09-10.mp4",
  },
  {
    poster: "/video-posters/income-strategy.jpg",
    source: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-2026-09-10.mp4",
  },
  {
    poster: "/video-posters/back-office.jpg",
    source: "https://cbp-media.proneurs.org/videos/clickbaitpays-back-office-2026-09-10.mp4",
  },
] as const;
const haveMetadataReadyState = 1;

test.beforeEach(async ({ context }) => {
  // Keep local and deployed smoke checks read-only, including page analytics.
  await context.route("**/api/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));
});

async function exerciseNativePlayback(player: Locator, playbackMs: number) {
  return player.evaluate(async (element, waitMs) => {
    const video = element as HTMLVideoElement;
    video.muted = true;

    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error(`Timed out loading video metadata from ${video.currentSrc}`));
        }, 20_000);
        const cleanup = () => {
          window.clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", loaded);
          video.removeEventListener("error", failed);
        };
        const loaded = () => {
          cleanup();
          resolve();
        };
        const failed = () => {
          const code = video.error?.code ?? "unknown";
          cleanup();
          reject(new Error(`Video metadata failed to load (${code}) from ${video.currentSrc}`));
        };
        video.addEventListener("loadedmetadata", loaded, { once: true });
        video.addEventListener("error", failed, { once: true });
        video.load();
      });
    }

    await video.play();
    const started = !video.paused;
    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    video.pause();

    return {
      duration: video.duration,
      paused: video.paused,
      readyState: video.readyState,
      started,
    };
  }, playbackMs);
}

test("personal site serves the three approved native videos responsively @smoke", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/s/your-name", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  const players = page.locator(".site-video > video");
  await expect(players).toHaveCount(approvedVideos.length);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("video[poster]")).toHaveCount(approvedVideos.length);
  await expect(page.locator(".site-video__cover, .site-video__poster, .site-video img, .site-video button")).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    videos: Array.from(document.querySelectorAll<HTMLElement>(".site-video"), (element) => {
      const rect = element.getBoundingClientRect();
      return { height: rect.height, left: rect.left, right: rect.right, width: rect.width };
    }),
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  for (const video of layout.videos) {
    expect(video.width).toBeGreaterThan(0);
    expect(video.height).toBeGreaterThan(0);
    expect(video.left).toBeGreaterThanOrEqual(-1);
    expect(video.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(video.width / video.height).toBeCloseTo(16 / 9, 1);
  }

  for (const [index, { poster, source }] of approvedVideos.entries()) {
    const player = players.nth(index);
    const configuration = await player.evaluate((element) => {
      const video = element as HTMLVideoElement;
      const sourceElement = video.querySelector("source");
      return {
        controls: video.controls,
        poster: video.getAttribute("poster"),
        playsInline: video.playsInline,
        preload: video.preload,
        source: sourceElement?.getAttribute("src"),
        sourceType: sourceElement?.getAttribute("type"),
      };
    });
    expect(configuration).toEqual({
      controls: true,
      poster,
      playsInline: true,
      preload: "metadata",
      source,
      sourceType: "video/mp4",
    });

    const posterDimensions = await player.evaluate(async (_element, posterPath) => {
      const image = new Image();
      image.src = posterPath;
      await image.decode();
      return { height: image.naturalHeight, width: image.naturalWidth };
    }, poster);
    expect(posterDimensions).toEqual({ height: 720, width: 1280 });

    // Muted programmatic playback is read-only. The shorter deployed check
    // limits transfer while still proving that the hosted media can start.
    await player.scrollIntoViewIfNeeded();
    const playback = await exerciseNativePlayback(player, process.env.BASE_URL ? 75 : 250);
    expect(playback.readyState).toBeGreaterThanOrEqual(haveMetadataReadyState);
    expect(Number.isFinite(playback.duration) && playback.duration > 0).toBe(true);
    expect(playback.started).toBe(true);
    expect(playback.paused).toBe(true);
  }
  expect(pageErrors).toEqual([]);
});

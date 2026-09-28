import type { SiteLocale } from "./i18n";

type VideoSlot = "welcome" | "strategy" | "tour";

// Versioned objects preserve the English recordings and avoid stale cached media.
export const siteVideoSources = {
  en: {
    welcome: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-2026-09-10.mp4",
    strategy: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-2026-09-10.mp4",
    tour: "https://cbp-media.proneurs.org/videos/clickbaitpays-back-office-2026-09-10.mp4",
  },
  fr: {
    welcome: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-fr-2026-09-28.mp4",
    strategy: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-fr-2026-09-28.mp4",
    tour: "https://cbp-media.proneurs.org/videos/clickbaitpays-presentation-fr-2026-09-28.mp4",
  },
  de: {
    welcome: "https://cbp-media.proneurs.org/videos/clickbaitpays-overview-de-2026-09-28.mp4",
    strategy: "https://cbp-media.proneurs.org/videos/clickbaitpays-income-strategy-de-2026-09-28.mp4",
    tour: "https://cbp-media.proneurs.org/videos/clickbaitpays-presentation-de-2026-09-28.mp4",
  },
} as const satisfies Record<SiteLocale, Record<VideoSlot, string>>;

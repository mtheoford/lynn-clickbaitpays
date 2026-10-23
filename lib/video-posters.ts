import type { SiteLocale } from "./i18n";

type VideoSlot = "welcome" | "strategy" | "tour";

// The updated English overview has its own versioned opening frame.
// French/German recordings retain their approved language-specific covers.
export const siteVideoPosters = {
  en: {
    welcome: "/video-posters/welcome-2026-10-06.jpg",
    strategy: "/video-posters/income-strategy.jpg",
    tour: "/video-posters/back-office.jpg",
  },
  fr: {
    welcome: "/video-posters/welcome-fr.jpg",
    strategy: "/video-posters/strategy-fr.jpg",
    tour: "/video-posters/tour-fr.jpg",
  },
  de: {
    welcome: "/video-posters/welcome-de.jpg",
    strategy: "/video-posters/strategy-de.jpg",
    tour: "/video-posters/tour-de.jpg",
  },
} as const satisfies Record<SiteLocale, Record<VideoSlot, string>>;

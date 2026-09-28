import type { SiteLocale } from "./i18n";

type VideoSlot = "welcome" | "strategy" | "tour";

// Keep the current English title frames and the approved translated covers.
// Poster selection must never change the current project-hosted recordings.
export const siteVideoPosters = {
  en: {
    welcome: "/video-posters/welcome.jpg",
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

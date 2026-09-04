export const SITE_LOCALES = ["en", "fr"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

export const localeCode: Record<SiteLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

export function isSiteLocale(value: string): value is SiteLocale {
  return SITE_LOCALES.includes(value as SiteLocale);
}

function normalizeInternalPath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash === "/fr") return "/";
  if (withLeadingSlash.startsWith("/fr/")) return withLeadingSlash.slice(3);
  return withLeadingSlash;
}

export function localizedPath(locale: SiteLocale, pathname: string): string {
  const englishPath = normalizeInternalPath(pathname);
  if (locale === "en") return englishPath;
  return englishPath === "/" ? "/fr" : `/fr${englishPath}`;
}

export function sponsorSitePath(
  locale: SiteLocale,
  slug?: string | null,
): string {
  return localizedPath(locale, slug ? `/s/${encodeURIComponent(slug)}` : "/");
}

export function localizedGrowthSignupUrl(
  signupUrl: string,
  locale: SiteLocale,
): string {
  if (locale === "en") return signupUrl;

  const url = new URL(signupUrl);
  url.pathname = localizedPath(locale, url.pathname);
  return url.toString();
}

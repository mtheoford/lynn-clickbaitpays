export const SITE_LOCALES = ["en", "fr", "de"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

export const localeCode: Record<SiteLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
};

export const languageOptions = [
  { locale: "en", flag: "🇺🇸", englishName: "English", nativeName: "English" },
  { locale: "fr", flag: "🇫🇷", englishName: "French", nativeName: "Français" },
  { locale: "de", flag: "🇩🇪", englishName: "German", nativeName: "Deutsch" },
] as const satisfies ReadonlyArray<{
  locale: SiteLocale;
  flag: string;
  englishName: string;
  nativeName: string;
}>;

export const LANGUAGE_PREFERENCE_KEY = "proneurs-language";
export const FEATURED_LANGUAGE_LIMIT = 5;

export function localeFromPath(pathname: string): SiteLocale {
  const segment = pathname.split("/")[1];
  return isSiteLocale(segment) ? segment : DEFAULT_SITE_LOCALE;
}

export function isSiteLocale(value: string): value is SiteLocale {
  return SITE_LOCALES.includes(value as SiteLocale);
}

export function normalizeInternalPath(pathname: string): string {
  const withLeadingSlash = `/${pathname.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  const firstSegment = withLeadingSlash.split("/")[1];
  if (isSiteLocale(firstSegment)) {
    return `/${withLeadingSlash.slice(firstSegment.length + 1).replace(/^\/+/, "")}`;
  }
  return withLeadingSlash;
}

export function localizedPath(locale: SiteLocale, pathname: string): string {
  const englishPath = normalizeInternalPath(pathname);
  if (locale === "en") return englishPath;
  return englishPath === "/" ? `/${locale}` : `/${locale}${englishPath}`;
}

/** Never carry checkout tokens or auth secrets to a different route. */
export function languageSwitchHref(
  locale: SiteLocale,
  pathname: string,
  query: string = "",
  hash: string = "",
): string {
  let basePath = normalizeInternalPath(pathname);
  if (basePath === "/get-your-site/success") basePath = "/manage";
  if (basePath === "/manage/confirm") basePath = "/manage/sign-in";
  // English resources are currently embedded on the sponsor page.
  if (basePath === "/faq" && locale === "en") basePath = "/";
  const params = new URLSearchParams(query);
  for (const key of [...params.keys()]) {
    if (!["source", "checkout"].includes(key) && !key.startsWith("utm_")) {
      params.delete(key);
    }
  }
  const serialized = params.toString();
  const fragment = hash.startsWith("#") ? hash : "";
  return `${localizedPath(locale, basePath)}${serialized ? `?${serialized}` : ""}${fragment}`;
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
  const url = new URL(signupUrl);
  url.pathname = localizedPath(locale, url.pathname);
  return url.toString();
}

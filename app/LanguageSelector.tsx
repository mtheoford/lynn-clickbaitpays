"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import {
  FEATURED_LANGUAGE_LIMIT,
  LANGUAGE_PREFERENCE_KEY,
  isSiteLocale,
  languageOptions,
  languageSwitchHref,
  localeFromPath,
  normalizeInternalPath,
  type SiteLocale,
} from "@/lib/i18n";

const preferenceEvent = "proneurs-language-change";
const selectorCopy = {
  en: { label: "Language", choose: "Choose your language", all: "All languages", continue: "Continue in" },
  fr: { label: "Langue", choose: "Choisir votre langue", all: "Toutes les langues", continue: "Continuer en" },
  de: { label: "Sprache", choose: "Sprache wählen", all: "Alle Sprachen", continue: "Weiter auf" },
};

function subscribePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(preferenceEvent, onChange);
  };
}

function readPreference(): SiteLocale | null {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    return saved && isSiteLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

function rememberLanguage(locale: SiteLocale) {
  try {
    window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
    window.dispatchEvent(new Event(preferenceEvent));
  } catch {
    // Language navigation also works when storage is unavailable.
  }
}

export default function LanguageSelector() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const locale = localeFromPath(pathname);
  const copy = selectorCopy[locale];
  const saved = useSyncExternalStore(subscribePreference, readPreference, () => null);
  const internalPath = normalizeInternalPath(pathname);

  // Admin/auth handlers are not public language surfaces.
  if (internalPath.startsWith("/admin") || internalPath.startsWith("/auth/") || internalPath.startsWith("/api/")) return null;

  const lightSurface = !internalPath.startsWith("/manage") && internalPath !== "/" && !internalPath.startsWith("/s/");
  const hasMore = languageOptions.length > FEATURED_LANGUAGE_LIMIT;
  const featured = languageOptions.slice(0, FEATURED_LANGUAGE_LIMIT);
  const hrefFor = (target: SiteLocale, hash = "") => languageSwitchHref(target, pathname, search.toString(), hash);
  const followLanguage = (event: MouseEvent<HTMLAnchorElement>, target: SiteLocale) => {
    rememberLanguage(target);
    if (target === locale) {
      event.preventDefault();
      return;
    }
    // Keep normal browser behavior for new tabs and modifier keys.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.push(hrefFor(target, window.location.hash), { scroll: false });
  };
  const preferredOption = saved && saved !== locale && (pathname === "/" || pathname === "/get-your-site")
    ? languageOptions.find((option) => option.locale === saved)
    : null;

  return (
    <div className="language-banner" data-surface={lightSurface ? "light" : "dark"} lang={locale}>
      <div className="language-banner-inner">
        <span className="language-banner-label"><span aria-hidden="true">◎</span> {copy.label}</span>
        <nav className="language-featured" aria-label={copy.choose}>
          {featured.map((option) => (
            <Link
              key={option.locale}
              href={option.locale === locale ? "#" : hrefFor(option.locale)}
              hrefLang={option.locale}
              aria-current={option.locale === locale ? "page" : undefined}
              className="language-option"
              onClick={(event) => followLanguage(event, option.locale)}
              scroll={false}
              prefetch={false}
            >
              <span className="language-flag" aria-hidden="true">{option.flag}</span>
              <span className="language-name" lang="en">{option.englishName}</span>
              {option.englishName !== option.nativeName && <span className="language-native" lang={option.locale}><span aria-hidden="true"> · </span>{option.nativeName}</span>}
            </Link>
          ))}
        </nav>
        <label className={`language-dropdown${hasMore ? " has-more" : ""}`}>
          <span className="visually-hidden">{hasMore ? copy.all : copy.choose}</span>
          <select
            aria-label={hasMore ? copy.all : copy.choose}
            value={locale}
            onChange={(event) => {
              const selected = event.target.value;
              if (!isSiteLocale(selected)) return;
              rememberLanguage(selected);
              if (selected === locale) return;
              router.push(hrefFor(selected, window.location.hash), { scroll: false });
            }}
          >
            {languageOptions.map((option) => (
              <option key={option.locale} value={option.locale} lang={option.locale}>
                {option.flag} {option.englishName}{option.englishName !== option.nativeName ? ` · ${option.nativeName}` : ""}
              </option>
            ))}
          </select>
        </label>
        {preferredOption && <Link
          className="language-preference"
          href={hrefFor(preferredOption.locale)}
          onClick={(event) => followLanguage(event, preferredOption.locale)}
          hrefLang={preferredOption.locale}
          prefetch={false}
        >{copy.continue} <span lang={preferredOption.locale}>{preferredOption.nativeName}</span> <span aria-hidden="true">→</span></Link>}
      </div>
    </div>
  );
}

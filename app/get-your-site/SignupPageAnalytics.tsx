"use client";

import { useEffect, type ReactNode } from "react";
import {
  isAnalyticsVisitorToken,
  isSignupAnalyticsErrorCode,
  isSignupAnalyticsField,
  type SignupBrowserEventType,
  type SignupAnalyticsDeviceType,
  type SignupAnalyticsErrorCode,
  type SignupAnalyticsField,
  type SignupPagePlacement,
} from "@/lib/signup-page-analytics";
import type { SiteLocale } from "@/lib/i18n";

const VISITOR_STORAGE_KEY = "proneurs_signup_visitor_v1";
const JOURNEY_STORAGE_KEY = "proneurs_signup_journey_v1";
const FORM_STARTED_STORAGE_KEY = "proneurs_signup_form_started_v1";
let memoryVisitorToken = "";
let memoryJourneyToken = "";
const startedJourneys = new Set<string>();

function newToken(): string | undefined {
  try {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // Some browser policies disable randomUUID but still allow random bytes.
  }
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
  } catch {
    return undefined;
  }
}

function analyticsToken(kind: "visitor" | "journey"): string | undefined {
  const memory = kind === "visitor" ? memoryVisitorToken : memoryJourneyToken;
  if (memory) return memory;
  const storage = kind === "visitor" ? "localStorage" : "sessionStorage";
  const key = kind === "visitor" ? VISITOR_STORAGE_KEY : JOURNEY_STORAGE_KEY;
  let token: string | undefined;
  try {
    const stored = window[storage].getItem(key);
    if (stored && isAnalyticsVisitorToken(stored)) {
      token = stored;
    }
  } catch {
    // The memory fallback preserves this page's journey when storage is blocked.
  }
  token ??= newToken();
  if (!token) return undefined;
  if (kind === "visitor") memoryVisitorToken = token;
  else memoryJourneyToken = token;
  try {
    window[storage].setItem(key, token);
  } catch {
    // Storage failure must never affect signup.
  }
  return token;
}

export function getSignupAnalyticsContext(locale?: SiteLocale) {
  try {
    const visitorToken = analyticsToken("visitor");
    const journeyToken = analyticsToken("journey");
    if (!visitorToken || !journeyToken) return undefined;
    const pageLocale = window.location.pathname.split("/")[1];
    const resolvedLocale: SiteLocale = locale ?? (pageLocale === "fr" || pageLocale === "de" ? pageLocale : "en");
    // Viewport groups are deliberately coarse; no user agent or fingerprint.
    const deviceType: SignupAnalyticsDeviceType = window.innerWidth < 768
      ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    return { visitorToken, journeyToken, locale: resolvedLocale, deviceType };
  } catch {
    return undefined;
  }
}

export function recordSignupPageEvent(
  eventType: SignupBrowserEventType,
  placement: SignupPagePlacement,
  source?: string,
  details: { locale?: SiteLocale; errorCode?: SignupAnalyticsErrorCode; field?: SignupAnalyticsField } = {},
) {
  try {
    const context = getSignupAnalyticsContext(details.locale);
    if (!context) return;
    let referrer: string | undefined;
    try {
      referrer = document.referrer ? new URL(document.referrer).origin : undefined;
    } catch {
      // Ignore malformed referrers and never collect their path or query.
    }
    const body = JSON.stringify({
      eventType, placement, source, ...context, referrer,
      errorCode: isSignupAnalyticsErrorCode(details.errorCode) ? details.errorCode : undefined,
      field: isSignupAnalyticsField(details.field) ? details.field : undefined,
    });

    try {
      if (navigator.sendBeacon?.("/api/signup-page-analytics", new Blob([body], { type: "application/json" }))) return;
    } catch {
      // A disabled beacon API may still permit the fetch fallback.
    }
    void fetch("/api/signup-page-analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics is best-effort, including crypto, serialization and fetch setup.
  }
}

export function recordSignupFormStart(source?: string, locale?: SiteLocale) {
  try {
    const context = getSignupAnalyticsContext(locale);
    if (!context || startedJourneys.has(context.journeyToken)) return;
    try {
      if (window.sessionStorage.getItem(FORM_STARTED_STORAGE_KEY) === context.journeyToken) {
        startedJourneys.add(context.journeyToken);
        return;
      }
      window.sessionStorage.setItem(FORM_STARTED_STORAGE_KEY, context.journeyToken);
    } catch {
      // Deduplicate in memory if session storage is unavailable.
    }
    startedJourneys.add(context.journeyToken);
    recordSignupPageEvent("form_start", "form", source, { locale });
  } catch {
    // Editing the form must keep working under every analytics failure.
  }
}

export function SignupPageViewTracker({ source }: { source?: string }) {
  useEffect(() => {
    recordSignupPageEvent("page_view", "page", source);
  }, [source]);
  return null;
}

export function TrackedDemoLink({
  href,
  placement,
  source,
  className,
  target,
  rel,
  ariaLabel,
  children,
}: {
  href: string;
  placement: Extract<SignupPagePlacement, "header" | "hero" | "product_preview">;
  source?: string;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      onClick={() => recordSignupPageEvent("demo_click", placement, source)}
    >
      {children}
    </a>
  );
}

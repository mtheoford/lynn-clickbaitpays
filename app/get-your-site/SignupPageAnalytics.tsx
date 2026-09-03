"use client";

import { useEffect, type ReactNode } from "react";
import {
  isAnalyticsVisitorToken,
  type SignupPageEventType,
  type SignupPagePlacement,
} from "@/lib/signup-page-analytics";

const VISITOR_STORAGE_KEY = "proneurs_signup_visitor_v1";
let memoryVisitorToken = "";

function fallbackUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function visitorToken(): string {
  if (memoryVisitorToken) return memoryVisitorToken;

  try {
    const stored = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (stored && isAnalyticsVisitorToken(stored)) {
      memoryVisitorToken = stored;
      return stored;
    }
  } catch {
    // Privacy settings may disable local storage; the in-memory token still
    // deduplicates events during this page visit.
  }

  memoryVisitorToken =
    typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackUuid();
  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, memoryVisitorToken);
  } catch {
    // Analytics remains best-effort when browser storage is unavailable.
  }
  return memoryVisitorToken;
}

export function recordSignupPageEvent(
  eventType: SignupPageEventType,
  placement: SignupPagePlacement,
  source?: string,
) {
  const body = JSON.stringify({
    eventType,
    placement,
    source,
    visitorToken: visitorToken(),
    referrer: document.referrer || undefined,
  });

  if (
    navigator.sendBeacon &&
    navigator.sendBeacon(
      "/api/signup-page-analytics",
      new Blob([body], { type: "application/json" }),
    )
  ) {
    return;
  }

  void fetch("/api/signup-page-analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
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

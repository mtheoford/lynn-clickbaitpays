"use client";

import { ReactNode, useEffect } from "react";

type EventType = "page_view" | "referral_click" | "growth_click";

function record(siteSlug: string, eventType: EventType) {
  const body = JSON.stringify({ siteSlug, eventType });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function SiteViewTracker({ siteSlug }: { siteSlug: string }) {
  useEffect(() => record(siteSlug, "page_view"), [siteSlug]);
  return null;
}

export function TrackedLink({
  siteSlug,
  eventType,
  href,
  className,
  target,
  rel,
  children,
}: {
  siteSlug: string;
  eventType: Exclude<EventType, "page_view">;
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}) {
  function handleClick() {
    record(siteSlug, eventType);
  }

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

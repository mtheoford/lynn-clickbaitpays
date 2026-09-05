"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n";
import { getCustomerCopy } from "@/app/manage/customer-copy";

export default function BillingPortalButton({
  enabled,
  locale = "en",
}: {
  enabled: boolean;
  locale?: SiteLocale;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const t = getCustomerCopy(locale);

  async function openPortal() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(locale === "en" ? result.error ?? t["Billing could not be opened."] : t["Billing could not be opened."]);
      }
      window.location.assign(result.url);
    } catch (error) {
      setMessage(locale === "de" ? t["Billing could not be opened."] : error instanceof Error ? error.message : t["Billing could not be opened."]);
      setLoading(false);
    }
  }

  return (
    <div className="manage-billing-action">
      <button type="button" onClick={openPortal} disabled={!enabled || loading}>
        {loading
          ? (t["Opening billing…"])
          : (t["Manage billing"])}
      </button>
      {!enabled ? (
        <small>{t["Billing access appears after the first subscription is activated."]}</small>
      ) : null}
      {message ? <small role="alert">{message}</small> : null}
    </div>
  );
}

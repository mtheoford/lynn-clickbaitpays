"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n";

export default function BillingPortalButton({
  enabled,
  locale = "en",
}: {
  enabled: boolean;
  locale?: SiteLocale;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isFrench = locale === "fr";

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
        throw new Error(isFrench ? "Impossible d’ouvrir la gestion de la facturation." : result.error ?? "Billing could not be opened.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isFrench ? "Impossible d’ouvrir la gestion de la facturation." : "Billing could not be opened.");
      setLoading(false);
    }
  }

  return (
    <div className="manage-billing-action">
      <button type="button" onClick={openPortal} disabled={!enabled || loading}>
        {loading
          ? (isFrench ? "Ouverture de la facturation…" : "Opening billing…")
          : (isFrench ? "Gérer la facturation" : "Manage billing")}
      </button>
      {!enabled ? (
        <small>{isFrench
          ? "L’accès à la facturation apparaît après l’activation du premier abonnement."
          : "Billing access appears after the first subscription is activated."}</small>
      ) : null}
      {message ? <small role="alert">{message}</small> : null}
    </div>
  );
}

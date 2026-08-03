"use client";

import { useState } from "react";

export default function BillingPortalButton({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Billing could not be opened.");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Billing could not be opened.");
      setLoading(false);
    }
  }

  return (
    <div className="manage-billing-action">
      <button type="button" onClick={openPortal} disabled={!enabled || loading}>
        {loading ? "Opening billing…" : "Manage billing"}
      </button>
      {!enabled ? <small>Billing access appears after the first subscription is activated.</small> : null}
      {message ? <small role="alert">{message}</small> : null}
    </div>
  );
}


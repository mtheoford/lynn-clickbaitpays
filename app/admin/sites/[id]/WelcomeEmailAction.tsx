"use client";

import { useState } from "react";

export default function WelcomeEmailAction({ siteId }: { siteId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resend() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/welcome-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const result = (await response.json()) as { error?: string; delivery?: string };
      if (!response.ok) throw new Error(result.error ?? "The welcome email could not be queued.");
      setMessage(
        result.delivery === "sent"
          ? "Welcome email sent."
          : "Welcome email queued for delivery.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Welcome email recovery failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-email-recovery">
      <button type="button" disabled={busy} onClick={resend}>
        {busy ? "Queueing…" : "Resend welcome email"}
      </button>
      <small>
        Use this if the customer cannot find their site link or the original delivery exhausted its retries.
      </small>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}

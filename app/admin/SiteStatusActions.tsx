"use client";

import { useState } from "react";

export default function SiteStatusActions({
  siteId,
  status,
}: {
  siteId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: "active" | "suspended" | "canceled") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) throw new Error(result.error ?? "The site could not be updated.");
      setCurrent(result.status ?? nextStatus);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-site-actions">
      <span className={`status-pill status-${current}`}>{current.replace("_", " ")}</span>
      {current === "active" || current === "past_due" ? (
        <button type="button" disabled={busy} onClick={() => updateStatus("suspended")}>Suspend</button>
      ) : (
        <button type="button" disabled={busy} onClick={() => updateStatus("active")}>Activate</button>
      )}
      {current !== "canceled" ? (
        <button className="secondary" type="button" disabled={busy} onClick={() => updateStatus("canceled")}>Unpublish</button>
      ) : null}
      {message ? <small role="status">{message}</small> : null}
    </div>
  );
}


"use client";

import { useState } from "react";

export default function AccountDeletionAction({
  siteId,
  initialScheduledAt,
  deletionAllowed,
}: {
  siteId: string;
  initialScheduledAt: string | null;
  deletionAllowed: boolean;
}) {
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateDeletion(action: "schedule" | "cancel") {
    if (
      action === "schedule" &&
      !window.confirm(
        "Schedule permanent account data deletion in 30 days? The public site will remain unavailable. This can be reversed before the scheduled date.",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/deletion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as {
        error?: string;
        deletionScheduledAt?: string | null;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "The deletion schedule could not be updated.");
      }
      setScheduledAt(result.deletionScheduledAt ?? null);
      setMessage(action === "schedule" ? "Deletion scheduled." : "Deletion canceled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-deletion-panel" aria-label="Account data deletion">
      <strong>Account data deletion</strong>
      {scheduledAt ? (
        <>
          <p>
            Permanent deletion is scheduled for {new Date(scheduledAt).toLocaleString()}.
            The site remains unpublished during the retention window.
          </p>
          <button type="button" disabled={busy} onClick={() => updateDeletion("cancel")}>
            Cancel data deletion
          </button>
        </>
      ) : deletionAllowed ? (
        <>
          <p>
            Schedule a 30-day recovery window, followed by permanent removal of the
            site and eligible customer data.
          </p>
          <button className="danger" type="button" disabled={busy} onClick={() => updateDeletion("schedule")}>
            Schedule data deletion
          </button>
        </>
      ) : (
        <p>
          Cancel the subscription in Stripe first. Data deletion becomes available
          after the paid subscription period ends.
        </p>
      )}
      {message ? <small role="status">{message}</small> : null}
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";

type SiteForm = {
  displayName: string;
  publicEmail: string;
  publicPhone: string;
  bio: string;
  referralUrl: string;
  showEmail: boolean;
  showPhone: boolean;
};

export default function ManageSiteForm({ initial }: { initial: SiteForm }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function field<K extends keyof SiteForm>(key: K, value: SiteForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/manage/site", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your changes could not be saved.");
      setMessage("Your public page has been updated.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Your changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="manage-editor" onSubmit={save}>
      <div className="manage-panel-heading">
        <div><span>Page details</span><h2>Edit your sponsor information</h2></div>
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>

      <div className="manage-form-grid">
        <label>
          Display name
          <input value={form.displayName} onChange={(event) => field("displayName", event.target.value)} required maxLength={80} />
        </label>
        <label>
          Public email
          <input type="email" value={form.publicEmail} onChange={(event) => field("publicEmail", event.target.value)} required />
        </label>
        <label>
          Public phone
          <input type="tel" value={form.publicPhone} onChange={(event) => field("publicPhone", event.target.value)} required />
        </label>
        <label className="manage-wide-field">
          Official ClickBaitPays referral link
          <input type="url" value={form.referralUrl} onChange={(event) => field("referralUrl", event.target.value)} required />
          <small>The link must use https://clickbaitpays.me and include your referral code.</small>
        </label>
        <label className="manage-wide-field">
          Sponsor introduction
          <textarea value={form.bio} onChange={(event) => field("bio", event.target.value)} required minLength={20} maxLength={400} rows={4} />
          <small>{form.bio.length}/400 characters</small>
        </label>
      </div>

      <fieldset className="manage-visibility">
        <legend>Public contact visibility</legend>
        <label><input type="checkbox" checked={form.showEmail} onChange={(event) => field("showEmail", event.target.checked)} /><span>Show my email address</span></label>
        <label><input type="checkbox" checked={form.showPhone} onChange={(event) => field("showPhone", event.target.checked)} /><span>Show my phone number</span></label>
      </fieldset>

      {message ? <p className={isError ? "manage-message is-error" : "manage-message"} role="status">{message}</p> : null}
    </form>
  );
}


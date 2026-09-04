"use client";

import { FormEvent, useState } from "react";
import type { SiteLocale } from "@/lib/i18n";

type SiteForm = {
  firstName: string;
  lastName: string;
  companyName: string;
  displayNameType: "personal" | "business";
  publicEmail: string;
  publicPhone: string;
  bio: string;
  referralUrl: string;
  showEmail: boolean;
  showPhone: boolean;
};

export default function ManageSiteForm({
  initial,
  locale = "en",
}: {
  initial: SiteForm;
  locale?: SiteLocale;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const isFrench = locale === "fr";

  function field<K extends keyof SiteForm>(key: K, value: SiteForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const personalName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  const displayName =
    form.companyName.trim() && form.displayNameType === "business"
      ? form.companyName.trim()
      : personalName;

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
      if (!response.ok) throw new Error(isFrench ? "Impossible d’enregistrer vos modifications." : result.error ?? "Your changes could not be saved.");
      setMessage(isFrench ? "Votre page publique a été mise à jour." : "Your public page has been updated.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : isFrench ? "Impossible d’enregistrer vos modifications." : "Your changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="manage-editor" onSubmit={save}>
      <div className="manage-panel-heading">
        <div>
          <span>{isFrench ? "Détails de la page" : "Page details"}</span>
          <h2>{isFrench ? "Modifier vos informations de sponsor" : "Edit your sponsor information"}</h2>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? (isFrench ? "Enregistrement…" : "Saving…") : (isFrench ? "Enregistrer" : "Save changes")}
        </button>
      </div>

      <div className="manage-form-grid">
        <label>
          {isFrench ? "Prénom" : "First name"}
          <input value={form.firstName} onChange={(event) => field("firstName", event.target.value)} required maxLength={60} autoComplete="given-name" />
        </label>
        <label>
          {isFrench ? "Nom" : "Last name"}
          <input value={form.lastName} onChange={(event) => field("lastName", event.target.value)} required maxLength={60} autoComplete="family-name" />
        </label>
        <label className="manage-wide-field">
          {isFrench ? "Nom de l’entreprise" : "Company name"} <span className="signup-optional">{isFrench ? "Facultatif" : "Optional"}</span>
          <input
            value={form.companyName}
            onChange={(event) => {
              const companyName = event.target.value;
              setForm((current) => ({
                ...current,
                companyName,
                displayNameType: companyName.trim() ? current.displayNameType : "personal",
              }));
            }}
            maxLength={120}
            autoComplete="organization"
          />
        </label>
        {form.companyName.trim() ? (
          <fieldset className="manage-display-choice manage-wide-field">
            <legend>{isFrench ? "Nom public sur votre site personnalisé" : "Public name on your replicated site"}</legend>
            <label><input type="radio" name="displayNameType" checked={form.displayNameType === "personal"} onChange={() => field("displayNameType", "personal")} /><span>{isFrench ? "Personnel" : "Personal"} — {personalName || (isFrench ? "Votre nom" : "Your name")}</span></label>
            <label><input type="radio" name="displayNameType" checked={form.displayNameType === "business"} onChange={() => field("displayNameType", "business")} /><span>{isFrench ? "Entreprise" : "Business"} — {form.companyName.trim()}</span></label>
            <small>{isFrench ? "Les visiteurs verront :" : "Visitors will see:"} <strong>{displayName}</strong></small>
          </fieldset>
        ) : null}
        <label>
          {isFrench ? "Adresse e-mail publique" : "Public email"}
          <input type="email" value={form.publicEmail} onChange={(event) => field("publicEmail", event.target.value)} required />
        </label>
        <label>
          {isFrench ? "Téléphone public" : "Public phone"}
          <input type="tel" value={form.publicPhone} onChange={(event) => field("publicPhone", event.target.value)} required />
        </label>
        <label className="manage-wide-field">
          {isFrench ? "Lien de parrainage ClickBaitPays officiel" : "Official ClickBaitPays referral link"}
          <input type="url" value={form.referralUrl} onChange={(event) => field("referralUrl", event.target.value)} required />
          <small>{isFrench ? "Le lien doit utiliser https://clickbaitpays.me et contenir votre code de parrainage." : "The link must use https://clickbaitpays.me and include your referral code."}</small>
        </label>
        <label className="manage-wide-field">
          {isFrench ? "Présentation du sponsor" : "Sponsor introduction"}
          <textarea value={form.bio} onChange={(event) => field("bio", event.target.value)} required minLength={20} maxLength={400} rows={4} />
          <small>{form.bio.length}/400 {isFrench ? "caractères" : "characters"}</small>
        </label>
      </div>

      <fieldset className="manage-visibility">
        <legend>{isFrench ? "Visibilité des coordonnées publiques" : "Public contact visibility"}</legend>
        <label><input type="checkbox" checked={form.showEmail} onChange={(event) => field("showEmail", event.target.checked)} /><span>{isFrench ? "Afficher mon adresse e-mail" : "Show my email address"}</span></label>
        <label><input type="checkbox" checked={form.showPhone} onChange={(event) => field("showPhone", event.target.checked)} /><span>{isFrench ? "Afficher mon numéro de téléphone" : "Show my phone number"}</span></label>
      </fieldset>

      {message ? <p className={isError ? "manage-message is-error" : "manage-message"} role="status">{message}</p> : null}
    </form>
  );
}

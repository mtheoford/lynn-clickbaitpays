"use client";

import { FormEvent, useState } from "react";
import type { SiteLocale } from "@/lib/i18n";
import { submitMagicLinkRequest } from "./magic-link-submission";

export default function SignInForm({ locale = "en" }: { locale?: SiteLocale }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const isFrench = locale === "fr";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      setMessage(await submitMagicLinkRequest(form.get("email"), formElement, fetch, locale));
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : isFrench
          ? "Impossible d’envoyer l’e-mail de connexion."
          : "Sign-in email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="site-signup-form" onSubmit={submit}>
      <label>
        {isFrench ? "Adresse e-mail utilisée lors de l’achat" : "Email used during purchase"}
        <input name="email" type="email" autoComplete="email" required />
        <small>{isFrench
          ? "Utilisez exactement l’adresse indiquée sur votre reçu d’achat."
          : "Use the exact address shown on your purchase receipt, including spelling."}</small>
      </label>
      <button className="signup-submit" type="submit" disabled={busy}>
        {busy
          ? (isFrench ? "Envoi du lien sécurisé…" : "Sending secure link…")
          : (isFrench ? "Recevoir un lien de connexion" : "Email me a sign-in link")}
        <span aria-hidden="true">→</span>
      </button>
      {message ? <p role="status">{message}</p> : null}
      <p className="signup-safe-note">{isFrench
        ? "Le lien expire après 15 minutes et ne peut être utilisé qu’une seule fois."
        : "The link expires in 15 minutes and can be used only once."}</p>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import type { SiteLocale } from "@/lib/i18n";
import { getCustomerCopy } from "@/app/manage/customer-copy";
import { submitMagicLinkRequest } from "./magic-link-submission";

export default function SignInForm({ locale = "en" }: { locale?: SiteLocale }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const t = getCustomerCopy(locale);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      setMessage(await submitMagicLinkRequest(form.get("email"), formElement, fetch, locale));
    } catch (error) {
      setMessage(locale === "de" && (error instanceof TypeError || error instanceof SyntaxError)
        ? t["Sign-in email could not be sent."]
        : error instanceof Error
        ? error.message
        : t["Sign-in email could not be sent."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="site-signup-form" onSubmit={submit}>
      <label>
        {t["Email used during purchase"]}
        <input name="email" type="email" autoComplete="email" required />
        <small>{t["Use the exact address shown on your purchase receipt, including spelling."]}</small>
      </label>
      <button className="signup-submit" type="submit" disabled={busy}>
        {busy
          ? (t["Sending secure link…"])
          : (t["Email me a sign-in link"])}
        <span aria-hidden="true">→</span>
      </button>
      {message ? <p role="status">{message}</p> : null}
      <p className="signup-safe-note">{t["The link expires in 15 minutes and can be used only once."]}</p>
    </form>
  );
}

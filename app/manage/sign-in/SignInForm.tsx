"use client";

import { FormEvent, useState } from "react";
import { submitMagicLinkRequest } from "./magic-link-submission";

export default function SignInForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      setMessage(await submitMagicLinkRequest(form.get("email"), formElement));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="site-signup-form" onSubmit={submit}>
      <label>
        Email used during purchase
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <button className="signup-submit" type="submit" disabled={busy}>
        {busy ? "Sending secure link…" : "Email me a sign-in link"}
        <span aria-hidden="true">→</span>
      </button>
      {message ? <p role="status">{message}</p> : null}
      <p className="signup-safe-note">The link expires in 15 minutes and can be used only once.</p>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";

export default function SignInForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      if (!response.ok) throw new Error("Sign-in email could not be sent.");
      setMessage("If that email is connected to a site, a secure sign-in link is on its way.");
      event.currentTarget.reset();
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

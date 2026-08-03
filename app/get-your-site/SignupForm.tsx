"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

export default function SignupForm({
  source = "",
  addressPrefix = "https://",
  addressSuffix = ".cbp.proneurs.org",
}: {
  source?: string;
  addressPrefix?: string;
  addressSuffix?: string;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const effectiveSlug = useMemo(() => slugify(slugTouched ? slug : name), [name, slug, slugTouched]);

  useEffect(() => {
    if (window.location.hash !== "#build") return;
    const section = document.getElementById("build");
    if (!section) return;

    void document.fonts.ready.then(() => {
      window.requestAnimationFrame(() => section.scrollIntoView({ block: "start" }));
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          slug: effectiveSlug,
          referralUrl: form.get("referralUrl"),
          source,
          plan,
          acceptedTerms: form.get("acceptedTerms") === "on",
        }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error ?? "Checkout could not be started.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Checkout could not be started.");
    }
  }

  return (
    <form className="site-signup-form" onSubmit={submit}>
      <div className="signup-form-heading">
        <span>Build your page</span>
        <strong>Preview your address before paying.</strong>
      </div>

      <label>
        Your full name
        <input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          placeholder="Lynn Theobald"
          required
          maxLength={80}
        />
      </label>

      <div className="signup-field-row">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <label>
          Mobile phone
          <input name="phone" type="tel" autoComplete="tel" placeholder="(801) 555-0123" required />
        </label>
      </div>

      <label>
        Your page address
        <span className="slug-input">
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="your-name"
            required
          />
          <b>{addressSuffix || " on this site"}</b>
        </span>
      </label>

      <div className="signup-url-preview" aria-live="polite">
        <small>Your new sharing page</small>
        <strong>{addressPrefix}{effectiveSlug || "your-name"}{addressSuffix}</strong>
      </div>

      <label>
        ClickBaitPays referral link
        <input
          name="referralUrl"
          type="url"
          inputMode="url"
          placeholder="https://clickbaitpays.me/?ref=yourcode"
          required
        />
        <small>Only official clickbaitpays.me referral links are accepted.</small>
      </label>

      <fieldset className="signup-plan-picker">
        <legend>Choose billing</legend>
        <button
          type="button"
          className={plan === "monthly" ? "is-selected" : ""}
          onClick={() => setPlan("monthly")}
        >
          <span>Monthly</span><strong>$9</strong><small>per month</small>
        </button>
        <button
          type="button"
          className={plan === "annual" ? "is-selected" : ""}
          onClick={() => setPlan("annual")}
        >
          <span>Annual</span><strong>$79</strong><small>save $29</small>
        </button>
      </fieldset>

      <label className="signup-consent">
        <input name="acceptedTerms" type="checkbox" required />
        <span>
          I agree to the <a href="/terms" target="_blank">subscription terms</a>, <a href="/privacy" target="_blank">privacy policy</a>, and <a href="/refund-policy" target="_blank">cancellation and refund policy</a>. I understand this is an independent website service, not a ClickBaitPays membership or earnings guarantee.
        </span>
      </label>

      {message ? <p className="signup-error" role="alert">{message}</p> : null}

      <button className="signup-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Opening secure checkout…" : `Continue with ${plan === "annual" ? "$79/year" : "$9/month"}`}
        <span aria-hidden="true">→</span>
      </button>
      <p className="signup-safe-note">Secure billing through Stripe. No ClickBaitPays password or wallet information is collected.</p>
    </form>
  );
}

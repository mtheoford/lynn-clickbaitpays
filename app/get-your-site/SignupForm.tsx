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
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState<{
    state: "idle" | "checking" | "available" | "unavailable" | "error";
    message: string;
  }>({ state: "idle", message: "" });
  const effectiveSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (effectiveSlug.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailability({ state: "checking", message: "Checking availability…" });
      try {
        const response = await fetch("/api/site-address/availability", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: effectiveSlug, email }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { available?: boolean; message?: string };
        if (!response.ok) throw new Error(result.message ?? "Availability could not be checked.");
        setAvailability({
          state: result.available ? "available" : "unavailable",
          message: result.message ?? (result.available ? "This site address is available." : "That site address is already taken."),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setAvailability({
          state: "error",
          message: error instanceof Error ? error.message : "Availability will be verified at checkout.",
        });
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [effectiveSlug, email]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const submittedName = String(form.get("name") ?? "");
    const submittedSlug = slugify(submittedName);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: submittedName,
          email: form.get("email"),
          phone: form.get("phone"),
          slug: submittedSlug,
          referralUrl: form.get("referralUrl"),
          source,
          plan,
          acceptedTerms: form.get("acceptedTerms") === "on",
        }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        code?: string;
      };
      if (!response.ok || !result.checkoutUrl) {
        const checkoutError = result.error ?? "Checkout could not be started.";
        if (response.status === 409 && result.code === "site_unavailable") {
          setAvailability({
            state: "unavailable",
            message: checkoutError,
          });
        }
        throw new Error(checkoutError);
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
        <span>Personalize your site</span>
        <strong>Preview your replicated site address before checkout.</strong>
      </div>

      <label>
        Name
        <input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
            setAvailability({ state: "idle", message: "" });
          }}
          onInput={(event) => {
            setName(event.currentTarget.value);
            setAvailability({ state: "idle", message: "" });
          }}
          placeholder="Name/Business Name"
          required
          maxLength={80}
        />
      </label>

      <div className="signup-field-row">
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.currentTarget.value);
              setAvailability({ state: "idle", message: "" });
            }}
            onInput={(event) => {
              setEmail(event.currentTarget.value);
              setAvailability({ state: "idle", message: "" });
            }}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Mobile phone
          <input name="phone" type="tel" autoComplete="tel" placeholder="(801) 555-0123" required />
        </label>
      </div>

      <label>
        Your replicated site address
        <span className="slug-input" aria-live="polite">
          <span className="slug-value">{effectiveSlug || "your-name"}</span>
          <b>{addressSuffix || " on this site"}</b>
        </span>
      </label>

      <div className="signup-url-preview" aria-live="polite">
        <small>Your new replicated site</small>
        <strong>{addressPrefix}{effectiveSlug || "your-name"}{addressSuffix}</strong>
        {availability.message ? (
          <span className={`signup-availability is-${availability.state}`}>
            {availability.message}
          </span>
        ) : null}
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
          <span>Annual</span><strong>$79</strong><small>Save $29 · 27% off</small>
        </button>
      </fieldset>

      <label className="signup-consent">
        <input name="acceptedTerms" type="checkbox" required />
        <span>
          I agree to the <a href="/terms" target="_blank">subscription terms</a>, <a href="/privacy" target="_blank">privacy policy</a>, and <a href="/refund-policy" target="_blank">cancellation and refund policy</a>. I understand this is an independent website service, not a ClickBaitPays membership or earnings guarantee.
        </span>
      </label>

      {message ? <p className="signup-error" role="alert">{message}</p> : null}

      <button
        className="signup-submit"
        type="submit"
        disabled={status === "submitting" || availability.state === "unavailable"}
      >
        {status === "submitting" ? "Opening secure checkout…" : `Continue with ${plan === "annual" ? "$79/year" : "$9/month"}`}
        <span aria-hidden="true">→</span>
      </button>
      <p className="signup-safe-note">Secure billing through Stripe. No ClickBaitPays password or wallet information is collected.</p>
    </form>
  );
}

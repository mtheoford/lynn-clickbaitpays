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

function referralUrlFor(username: string) {
  return `https://clickbaitpays.me/?ref=${encodeURIComponent(username.trim())}`;
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
  const [referralUsername, setReferralUsername] = useState("");
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [availability, setAvailability] = useState<{
    state: "idle" | "checking" | "available" | "unavailable" | "error";
    message: string;
  }>({ state: "idle", message: "" });
  const effectiveSlug = useMemo(() => slugify(name), [name]);
  const replicatedSiteUrl = `${addressPrefix}${effectiveSlug || "your-name"}${addressSuffix}`;
  const referralUrl = referralUsername.trim() ? referralUrlFor(referralUsername) : "";

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
    const submittedReferralUsername = String(form.get("referralUsername") ?? "");
    const submittedReferralUrl = referralUrlFor(submittedReferralUsername);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: submittedName,
          email: form.get("email"),
          phone: form.get("phone"),
          slug: submittedSlug,
          referralUrl: submittedReferralUrl,
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

  async function copyReplicatedSiteUrl() {
    try {
      await navigator.clipboard.writeText(replicatedSiteUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <form className="site-signup-form" onSubmit={submit}>
      <div className="signup-form-heading">
        <span>Personalize your site</span>
      </div>

      <label>
        Name / Business Name
        <input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
            setAvailability({ state: "idle", message: "" });
            setCopyStatus("idle");
          }}
          onInput={(event) => {
            setName(event.currentTarget.value);
            setAvailability({ state: "idle", message: "" });
            setCopyStatus("idle");
          }}
          placeholder="Name/Business Name"
          required
          maxLength={80}
        />
        <small>This is the name visitors will see on your replicated site.</small>
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
        ClickBaitPays User Name
        <input
          name="referralUsername"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={referralUsername}
          onChange={(event) => setReferralUsername(event.currentTarget.value)}
          onInput={(event) => setReferralUsername(event.currentTarget.value)}
          placeholder="Your ClickBaitPays user name"
          pattern="[A-Za-z0-9._-]+"
          title="Use letters, numbers, periods, underscores, or hyphens."
          required
        />
        <small>We’ll create your ClickBaitPays referral link automatically.</small>
        {referralUrl ? (
          <span className="signup-referral-preview" aria-live="polite">
            <small>Your ClickBaitPays company page</small>
            <a href={referralUrl} target="_blank" rel="noopener noreferrer">
              {referralUrl}
            </a>
          </span>
        ) : null}
      </label>

      <div className="signup-url-preview" aria-live="polite">
        <div className="signup-url-preview-row">
          <div>
            <small>Your new replicated site</small>
            <strong>{replicatedSiteUrl}</strong>
          </div>
          <button
            className="signup-copy-url"
            type="button"
            onClick={copyReplicatedSiteUrl}
            aria-label="Copy your new replicated site address"
            title="Copy site address"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
            </svg>
          </button>
        </div>
        {copyStatus === "copied" ? <span className="signup-copy-status">Copied!</span> : null}
        {copyStatus === "error" ? <span className="signup-copy-status is-error">Couldn’t copy. Select the address above to copy it.</span> : null}
        {availability.message ? (
          <span className={`signup-availability is-${availability.state}`}>
            {availability.message}
          </span>
        ) : null}
      </div>

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

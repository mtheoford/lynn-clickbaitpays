"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { localizedPath, type SiteLocale } from "@/lib/i18n";

const signupCopy = {
  en: {
    checking: "Checking availability…",
    availabilityError: "Availability could not be checked.",
    available: "This site address is available.",
    unavailable: "That site address is already taken.",
    verifyAtCheckout: "Availability will be verified at checkout.",
    checkoutStartError: "Checkout could not be started.",
    personalize: "Personalize your site",
    firstName: "First Name",
    firstNamePlaceholder: "First name",
    lastName: "Last Name",
    lastNamePlaceholder: "Last name",
    companyName: "Company Name",
    optional: "Optional",
    companyPlaceholder: "Company or business name",
    companyHint: "Leave blank if you want your personal name displayed.",
    displayChoice: "Which name should appear on your replicated site?",
    personal: "Personal",
    personalFallback: "Your personal name",
    business: "Business",
    email: "Email",
    phone: "Mobile phone",
    phonePlaceholder: "(801) 555-0123",
    username: "ClickBaitPays User Name",
    usernamePlaceholder: "Your ClickBaitPays user name",
    usernameTitle: "Use letters, numbers, periods, underscores, or hyphens.",
    referralHint: "We’ll create your ClickBaitPays referral link automatically.",
    companyPage: "Your ClickBaitPays company page",
    newSite: "Your new replicated site",
    copyAddress: "Copy your new replicated site address",
    copyTitle: "Copy site address",
    copied: "Copied!",
    copyError: "Couldn’t copy. Select the address above to copy it.",
    chooseBilling: "Choose billing",
    monthly: "Monthly",
    perMonth: "Per Month",
    annual: "Annual",
    save: "Save 27%",
    consentPrefix: "I agree to the",
    subscriptionTerms: "subscription terms",
    privacy: "privacy policy",
    cancellation: "cancellation and refund policy",
    consentSuffix: "I understand this is an independent website service, not a ClickBaitPays membership or earnings guarantee.",
    opening: "Opening secure checkout…",
    continueAnnual: "Continue with $79/year",
    continueMonthly: "Continue with $9/month",
    safeNote: "Secure billing through Stripe. No ClickBaitPays password or wallet information is collected.",
  },
  fr: {
    checking: "Vérification de la disponibilité…",
    availabilityError: "Impossible de vérifier la disponibilité.",
    available: "Cette adresse de site est disponible.",
    unavailable: "Cette adresse de site est déjà prise.",
    verifyAtCheckout: "La disponibilité sera vérifiée au moment du paiement.",
    checkoutStartError: "Impossible de lancer le paiement.",
    personalize: "Personnalisez votre site",
    firstName: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    lastName: "Nom",
    lastNamePlaceholder: "Votre nom",
    companyName: "Nom de l’entreprise",
    optional: "Facultatif",
    companyPlaceholder: "Entreprise ou raison sociale",
    companyHint: "Laissez ce champ vide pour afficher votre nom personnel.",
    displayChoice: "Quel nom doit apparaître sur votre site personnalisé ?",
    personal: "Personnel",
    personalFallback: "Votre nom personnel",
    business: "Entreprise",
    email: "Adresse e-mail",
    phone: "Téléphone portable",
    phonePlaceholder: "+33 6 12 34 56 78",
    username: "Nom d’utilisateur ClickBaitPays",
    usernamePlaceholder: "Votre nom d’utilisateur ClickBaitPays",
    usernameTitle: "Utilisez uniquement des lettres, chiffres, points, tirets bas ou traits d’union.",
    referralHint: "Nous créerons automatiquement votre lien de parrainage ClickBaitPays.",
    companyPage: "Votre page ClickBaitPays",
    newSite: "Votre nouveau site personnalisé",
    copyAddress: "Copier l’adresse de votre nouveau site",
    copyTitle: "Copier l’adresse du site",
    copied: "Copiée !",
    copyError: "Impossible de copier l’adresse. Sélectionnez-la ci-dessus pour la copier.",
    chooseBilling: "Choisissez votre abonnement",
    monthly: "Mensuel",
    perMonth: "par mois",
    annual: "Annuel",
    save: "Économisez 27 %",
    consentPrefix: "J’accepte les",
    subscriptionTerms: "conditions d’abonnement",
    privacy: "politique de confidentialité",
    cancellation: "conditions d’annulation et de remboursement",
    consentSuffix: "Je comprends qu’il s’agit d’un service de site web indépendant, et non d’une adhésion à ClickBaitPays ni d’une garantie de revenus.",
    opening: "Ouverture du paiement sécurisé…",
    continueAnnual: "Continuer avec 79 $ US par an",
    continueMonthly: "Continuer avec 9 $ US par mois",
    safeNote: "Paiement sécurisé par Stripe. Aucun mot de passe ClickBaitPays ni renseignement de portefeuille n’est collecté.",
  },
  de: {
    checking: "Verfügbarkeit wird geprüft…",
    availabilityError: "Die Verfügbarkeit konnte nicht geprüft werden.",
    available: "Diese Website-Adresse ist verfügbar.",
    unavailable: "Diese Website-Adresse ist bereits vergeben.",
    verifyAtCheckout: "Die Verfügbarkeit wird beim Bezahlen erneut geprüft.",
    checkoutStartError: "Der Zahlungsvorgang konnte nicht gestartet werden.",
    personalize: "Gestalten Sie Ihre Website",
    firstName: "Vorname", firstNamePlaceholder: "Ihr Vorname",
    lastName: "Nachname", lastNamePlaceholder: "Ihr Nachname",
    companyName: "Firmenname", optional: "Optional", companyPlaceholder: "Unternehmen oder Firmenname",
    companyHint: "Lassen Sie das Feld leer, wenn Ihr persönlicher Name angezeigt werden soll.",
    displayChoice: "Welcher Name soll auf Ihrer persönlichen Website erscheinen?",
    personal: "Privatperson", personalFallback: "Ihr persönlicher Name", business: "Unternehmen",
    email: "E-Mail-Adresse", phone: "Mobiltelefon", phonePlaceholder: "+49 151 12345678",
    username: "ClickBaitPays-Benutzername", usernamePlaceholder: "Ihr ClickBaitPays-Benutzername",
    usernameTitle: "Verwenden Sie Buchstaben, Zahlen, Punkte, Unterstriche oder Bindestriche.",
    referralHint: "Wir erstellen Ihren ClickBaitPays-Empfehlungslink automatisch.",
    companyPage: "Ihre ClickBaitPays-Seite", newSite: "Ihre neue persönliche Website",
    copyAddress: "Adresse Ihrer neuen Website kopieren", copyTitle: "Website-Adresse kopieren",
    copied: "Kopiert!", copyError: "Kopieren nicht möglich. Wählen Sie die Adresse oben aus, um sie zu kopieren.",
    chooseBilling: "Abrechnung wählen", monthly: "Monatlich", perMonth: "pro Monat", annual: "Jährlich", save: "27 % sparen",
    consentPrefix: "Ich akzeptiere die", subscriptionTerms: "Abonnementbedingungen", privacy: "Datenschutzerklärung", cancellation: "Kündigungs- und Erstattungsbedingungen",
    consentSuffix: "Mir ist bewusst, dass dies ein unabhängiger Website-Service ist, keine ClickBaitPays-Mitgliedschaft und keine Einkommensgarantie.",
    opening: "Sichere Zahlung wird geöffnet…", continueAnnual: "Weiter mit 79 US$ pro Jahr", continueMonthly: "Weiter mit 9 US$ pro Monat",
    safeNote: "Sichere Abrechnung über Stripe in US-Dollar. Es werden weder Ihr ClickBaitPays-Passwort noch Wallet-Daten erfasst.",
  },
} as const;

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
  locale = "en",
}: {
  source?: string;
  addressPrefix?: string;
  addressSuffix?: string;
  locale?: SiteLocale;
}) {
  const t = signupCopy[locale];
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [displayNameType, setDisplayNameType] = useState<"" | "personal" | "business">("");
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
  const personalName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const effectiveDisplayName =
    companyName.trim() && displayNameType === "business"
      ? companyName.trim()
      : personalName;
  const effectiveSlug = useMemo(() => slugify(effectiveDisplayName), [effectiveDisplayName]);
  const replicatedSiteUrl = `${addressPrefix}${effectiveSlug || "your-name"}${addressSuffix}`;
  const referralUrl = referralUsername.trim() ? referralUrlFor(referralUsername) : "";

  useEffect(() => {
    if (effectiveSlug.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailability({ state: "checking", message: t.checking });
      try {
        const response = await fetch("/api/site-address/availability", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: effectiveSlug, email, locale }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { available?: boolean; message?: string };
        if (!response.ok) throw new Error(locale !== "en" ? t.availabilityError : result.message ?? t.availabilityError);
        setAvailability({
          state: result.available ? "available" : "unavailable",
          message: locale !== "en"
            ? (result.available ? t.available : t.unavailable)
            : result.message ?? (result.available ? t.available : t.unavailable),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setAvailability({
          state: "error",
          message: locale !== "en"
            ? t.verifyAtCheckout
            : error instanceof Error ? error.message : t.verifyAtCheckout,
        });
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [effectiveSlug, email, locale, t]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const submittedFirstName = String(form.get("firstName") ?? "");
    const submittedLastName = String(form.get("lastName") ?? "");
    const submittedCompanyName = String(form.get("companyName") ?? "");
    const submittedDisplayNameType = String(form.get("displayNameType") ?? "personal");
    const submittedDisplayName =
      submittedCompanyName.trim() && submittedDisplayNameType === "business"
        ? submittedCompanyName.trim()
        : `${submittedFirstName.trim()} ${submittedLastName.trim()}`.trim();
    const submittedSlug = slugify(submittedDisplayName);
    const submittedReferralUsername = String(form.get("referralUsername") ?? "");
    const submittedReferralUrl = referralUrlFor(submittedReferralUsername);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: submittedFirstName,
          lastName: submittedLastName,
          companyName: submittedCompanyName,
          displayNameType: submittedDisplayNameType,
          email: form.get("email"),
          phone: form.get("phone"),
          slug: submittedSlug,
          referralUrl: submittedReferralUrl,
          source,
          plan,
          acceptedTerms: form.get("acceptedTerms") === "on",
          locale,
        }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        code?: string;
      };
      if (!response.ok || !result.checkoutUrl) {
        const frenchError =
          result.code === "site_unavailable"
            ? "Cette adresse de site n’est plus disponible. Veuillez choisir un autre nom."
            : result.code === "email_has_site"
              ? "Cette adresse e-mail gère déjà un site. Connectez-vous pour le mettre à jour."
              : result.code === "checkout_processing"
                ? "Votre paiement précédent est encore en cours de traitement. Veuillez patienter un instant."
                : t.checkoutStartError;
        const germanError =
          result.code === "site_unavailable"
            ? "Diese Website-Adresse ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Namen."
            : result.code === "email_has_site"
              ? "Mit dieser E-Mail-Adresse wird bereits eine Website verwaltet. Melden Sie sich an, um sie zu aktualisieren."
              : result.code === "checkout_processing"
                ? "Ihre vorherige Zahlung wird noch verarbeitet. Bitte warten Sie einen Moment."
                : t.checkoutStartError;
        const checkoutError = locale === "fr" ? frenchError : locale === "de" ? germanError : result.error ?? t.checkoutStartError;
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
      setMessage(locale === "de" && (error instanceof TypeError || error instanceof SyntaxError)
        ? t.checkoutStartError
        : error instanceof Error ? error.message : t.checkoutStartError);
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
        <span>{t.personalize}</span>
      </div>

      <div className="signup-field-row">
        <label>
          {t.firstName}
          <input
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.currentTarget.value);
              setAvailability({ state: "idle", message: "" });
              setCopyStatus("idle");
            }}
            placeholder={t.firstNamePlaceholder}
            required
            maxLength={60}
          />
        </label>
        <label>
          {t.lastName}
          <input
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.currentTarget.value);
              setAvailability({ state: "idle", message: "" });
              setCopyStatus("idle");
            }}
            placeholder={t.lastNamePlaceholder}
            required
            maxLength={60}
          />
        </label>
      </div>

      <label className="signup-compact-field">
        {t.companyName} <span className="signup-optional">{t.optional}</span>
        <input
          name="companyName"
          autoComplete="organization"
          value={companyName}
          onChange={(event) => {
            const nextCompanyName = event.currentTarget.value;
            setCompanyName(nextCompanyName);
            setDisplayNameType((current) => {
              if (!nextCompanyName.trim()) return "";
              return companyName.trim() ? current : "";
            });
            setAvailability({ state: "idle", message: "" });
            setCopyStatus("idle");
          }}
          placeholder={t.companyPlaceholder}
          maxLength={120}
        />
        <small>{t.companyHint}</small>
      </label>

      {companyName.trim() ? (
        <fieldset className="signup-display-choice">
          <legend>{t.displayChoice}</legend>
          <label>
            <input
              name="displayNameType"
              type="radio"
              value="personal"
              checked={displayNameType === "personal"}
              onChange={() => {
                setDisplayNameType("personal");
                setAvailability({ state: "idle", message: "" });
                setCopyStatus("idle");
              }}
              required
            />
            <span><strong>{t.personal}</strong><small>{personalName || t.personalFallback}</small></span>
          </label>
          <label>
            <input
              name="displayNameType"
              type="radio"
              value="business"
              checked={displayNameType === "business"}
              onChange={() => {
                setDisplayNameType("business");
                setAvailability({ state: "idle", message: "" });
                setCopyStatus("idle");
              }}
              required
            />
            <span><strong>{t.business}</strong><small>{companyName.trim()}</small></span>
          </label>
        </fieldset>
      ) : (
        <input name="displayNameType" type="hidden" value="personal" />
      )}

      <div className="signup-field-row">
        <label>
          {t.email}
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
            placeholder={locale === "fr" ? "vous@exemple.fr" : locale === "de" ? "sie@beispiel.de" : "you@example.com"}
            required
          />
        </label>
        <label>
          {t.phone}
          <input name="phone" type="tel" autoComplete="tel" placeholder={t.phonePlaceholder} required />
        </label>
      </div>

      <label className="signup-compact-field">
        {t.username}
        <input
          name="referralUsername"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={referralUsername}
          onChange={(event) => setReferralUsername(event.currentTarget.value)}
          onInput={(event) => setReferralUsername(event.currentTarget.value)}
          placeholder={t.usernamePlaceholder}
          pattern="[A-Za-z0-9._-]+"
          title={t.usernameTitle}
          required
        />
        <small>{t.referralHint}</small>
        {referralUrl ? (
          <span className="signup-referral-preview" aria-live="polite">
            <small>{t.companyPage}</small>
            <a href={referralUrl} target="_blank" rel="noopener noreferrer">
              {referralUrl}
            </a>
          </span>
        ) : null}
      </label>

      <div className="signup-url-preview" aria-live="polite">
        <div className="signup-url-preview-row">
          <div>
            <small>{t.newSite}</small>
            <strong>{replicatedSiteUrl}</strong>
          </div>
          <button
            className="signup-copy-url"
            type="button"
            onClick={copyReplicatedSiteUrl}
            aria-label={t.copyAddress}
            title={t.copyTitle}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
            </svg>
          </button>
        </div>
        {copyStatus === "copied" ? <span className="signup-copy-status">{t.copied}</span> : null}
        {copyStatus === "error" ? <span className="signup-copy-status is-error">{t.copyError}</span> : null}
        {availability.message ? (
          <span className={`signup-availability is-${availability.state}`}>
            {availability.message}
          </span>
        ) : null}
      </div>

      <fieldset className="signup-plan-picker">
        <legend>{t.chooseBilling}</legend>
        <button
          type="button"
          className={plan === "monthly" ? "is-selected" : ""}
          onClick={() => setPlan("monthly")}
        >
          <span className="signup-plan-name">{t.monthly}</span>
          <span className="signup-plan-price"><strong>{locale === "fr" ? "9 $ US" : locale === "de" ? "9 US$" : "$9"}</strong><small>{t.perMonth}</small></span>
        </button>
        <button
          type="button"
          className={plan === "annual" ? "is-selected" : ""}
          onClick={() => setPlan("annual")}
        >
          <span className="signup-plan-name">{t.annual}</span>
          <span className="signup-plan-price"><strong>{locale === "fr" ? "79 $ US" : locale === "de" ? "79 US$" : "$79"}</strong><small className="signup-plan-savings">{t.save}</small></span>
        </button>
      </fieldset>

      <label className="signup-consent">
        <input name="acceptedTerms" type="checkbox" required />
        <span>
          {t.consentPrefix} <a href={localizedPath(locale, "/terms")} target="_blank">{t.subscriptionTerms}</a>, <a href={localizedPath(locale, "/privacy")} target="_blank">{t.privacy}</a>, {locale === "fr" ? "ainsi que les " : locale === "de" ? "sowie die " : "and "}<a href={localizedPath(locale, "/refund-policy")} target="_blank">{t.cancellation}</a>. {t.consentSuffix}
        </span>
      </label>

      {message ? <p className="signup-error" role="alert">{message}</p> : null}

      <button
        className="signup-submit"
        type="submit"
        disabled={status === "submitting" || availability.state === "unavailable"}
      >
        {status === "submitting" ? t.opening : plan === "annual" ? t.continueAnnual : t.continueMonthly}
        <span aria-hidden="true">→</span>
      </button>
      <p className="signup-safe-note">{t.safeNote}</p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProvisioningState = "processing" | "ready" | "action_required";

const copy = {
  en: {
    viewPage: "View my new page",
    managePage: "Manage my page",
    accountHelp: "Get account help",
    returnToSites: "Return to Personal CBP Sites",
    confirming: "Confirming payment and publishing your page…",
    signIn: "Sign in to check your account",
  },
  fr: {
    viewPage: "Voir ma nouvelle page",
    managePage: "Gérer ma page",
    accountHelp: "Obtenir de l’aide pour mon compte",
    returnToSites: "Retourner aux sites CBP personnalisés",
    confirming: "Confirmation du paiement et publication de votre page…",
    signIn: "Se connecter pour consulter mon compte",
  },
} as const;

export default function ProvisioningStatus({
  sessionId,
  locale = "en",
}: {
  sessionId: string;
  locale?: "en" | "fr";
}) {
  const [state, setState] = useState<ProvisioningState>("processing");
  const [publicUrl, setPublicUrl] = useState("");
  const t = copy[locale];

  useEffect(() => {
    let canceled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId)}&locale=${locale}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as {
          state?: ProvisioningState;
          publicUrl?: string;
        };
        if (canceled) return;
        if (result.state === "ready" && result.publicUrl) {
          setPublicUrl(result.publicUrl);
          setState("ready");
          return;
        }
        if (result.state === "action_required") {
          setState("action_required");
          return;
        }
      } catch {
        // A temporary network failure should not turn a successful payment into an error state.
      }

      if (!canceled && attempts < 30) timer = setTimeout(check, 2_000);
    }

    void check();
    return () => {
      canceled = true;
      if (timer) clearTimeout(timer);
    };
  }, [locale, sessionId]);

  if (state === "ready") {
    return (
      <div className="checkout-success-actions">
        <a className="join-button" href={publicUrl}>{t.viewPage} <i aria-hidden="true">→</i></a>
        <Link href={locale === "fr" ? "/fr/manage" : "/manage"}>{t.managePage}</Link>
      </div>
    );
  }

  if (state === "action_required") {
    return (
      <div className="checkout-success-actions">
        <Link className="join-button" href={locale === "fr" ? "/fr/manage/sign-in" : "/manage/sign-in"}>{t.accountHelp} <i aria-hidden="true">→</i></Link>
        <Link href={locale === "fr" ? "/fr/get-your-site" : "/get-your-site"}>{t.returnToSites}</Link>
      </div>
    );
  }

  return (
    <div className="checkout-success-actions" aria-live="polite">
      <span>{t.confirming}</span>
      <Link href={locale === "fr" ? "/fr/manage/sign-in" : "/manage/sign-in"}>{t.signIn}</Link>
    </div>
  );
}

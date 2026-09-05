"use client";

import { useRef } from "react";
import SignupForm from "./SignupForm";
import { recordSignupPageEvent } from "./SignupPageAnalytics";
import type { SiteLocale } from "@/lib/i18n";

export default function SignupDialog({
  source,
  addressPrefix,
  addressSuffix,
  checkoutCanceled,
  dialogId,
  triggerLabel,
  analyticsPlacement,
  locale = "en",
}: {
  source?: string;
  addressPrefix: string;
  addressSuffix: string;
  checkoutCanceled: boolean;
  dialogId: string;
  triggerLabel: string;
  analyticsPlacement: "hero" | "closing";
  locale?: SiteLocale;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    recordSignupPageEvent("signup_click", analyticsPlacement, source);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button className="sales-button" type="button" onClick={openDialog}>
        {triggerLabel} <span aria-hidden="true">→</span>
      </button>

      <dialog
        id={dialogId}
        ref={dialogRef}
        className="signup-dialog"
        aria-labelledby={`${dialogId}-title`}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
      >
        <div className="signup-dialog-shell">
          <header>
            <div>
              <p className="eyebrow">{locale === "fr" ? "Votre site personnalisé commence ici" : locale === "de" ? "Hier beginnt Ihre persönliche Website" : "Your replicated site starts here"}</p>
              <h2 id={`${dialogId}-title`}>{locale === "fr" ? "Créez votre site personnalisé." : locale === "de" ? "Erstellen Sie Ihre persönliche Website." : "Get your personalized replicated site."}</h2>
            </div>
            <button type="button" onClick={closeDialog} aria-label={locale === "fr" ? "Fermer le formulaire d’inscription" : locale === "de" ? "Anmeldeformular schließen" : "Close signup form"}>×</button>
          </header>
          {checkoutCanceled ? (
            <p className="checkout-note">{locale === "fr" ? "Le paiement a été annulé. Votre page n’a pas été activée." : locale === "de" ? "Die Zahlung wurde abgebrochen. Ihre Website wurde nicht aktiviert." : "Checkout was canceled. Your page has not been activated."}</p>
          ) : null}
          <SignupForm
            source={source}
            addressPrefix={addressPrefix}
            addressSuffix={addressSuffix}
            locale={locale}
          />
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useRef } from "react";
import SignupForm from "./SignupForm";

export default function SignupDialog({
  source,
  addressPrefix,
  addressSuffix,
  checkoutCanceled,
  dialogId,
  triggerLabel,
}: {
  source?: string;
  addressPrefix: string;
  addressSuffix: string;
  checkoutCanceled: boolean;
  dialogId: string;
  triggerLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
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
              <p className="eyebrow">Your replicated site starts here</p>
              <h2 id={`${dialogId}-title`}>Get your personalized replicated site.</h2>
            </div>
            <button type="button" onClick={closeDialog} aria-label="Close signup form">×</button>
          </header>
          {checkoutCanceled ? (
            <p className="checkout-note">Checkout was canceled. Your page has not been activated.</p>
          ) : null}
          <SignupForm
            source={source}
            addressPrefix={addressPrefix}
            addressSuffix={addressSuffix}
          />
        </div>
      </dialog>
    </>
  );
}

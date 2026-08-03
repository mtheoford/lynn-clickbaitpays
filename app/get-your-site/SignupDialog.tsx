"use client";

import { useCallback, useEffect, useRef } from "react";
import SignupForm from "./SignupForm";

export default function SignupDialog({
  source,
  addressPrefix,
  addressSuffix,
  checkoutCanceled,
}: {
  source?: string;
  addressPrefix: string;
  addressSuffix: string;
  checkoutCanceled: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#build`);
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#build") openDialog();
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [openDialog]);

  function clearHash() {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  return (
    <>
      <button className="one-page-cta" type="button" onClick={openDialog}>
        Build my page <span aria-hidden="true">→</span>
      </button>

      <dialog
        ref={dialogRef}
        className="signup-dialog"
        aria-labelledby="signup-dialog-title"
        onClose={clearHash}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
      >
        <div className="signup-dialog-shell">
          <header>
            <div>
              <p className="eyebrow">Your page starts here</p>
              <h2 id="signup-dialog-title">Build your personal CBP page.</h2>
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

"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n";

const copy = {
  en: { sharePrefix: "Learn about ClickBaitPays with", title: (name: string) => `${name}'s CBP Site`, addressCopied: "Page address copied.", messageCopied: "Sharing message copied.", copyError: "Copying is unavailable in this browser. Select the address manually.", shareError: "Sharing is unavailable. Copy the page address instead.", copyAddress: "Copy page address", sharePage: "Share page", sms: "Open text message" },
  fr: { sharePrefix: "Découvrez ClickBaitPays avec", title: (name: string) => `Site CBP de ${name}`, addressCopied: "Adresse de la page copiée.", messageCopied: "Message de partage copié.", copyError: "La copie n’est pas disponible dans ce navigateur. Sélectionnez l’adresse manuellement.", shareError: "Le partage n’est pas disponible. Copiez l’adresse de la page.", copyAddress: "Copier l’adresse", sharePage: "Partager la page", sms: "Ouvrir un SMS" },
  de: { sharePrefix: "Entdecken Sie ClickBaitPays mit", title: (name: string) => `CBP-Website von ${name}`, addressCopied: "Seitenadresse kopiert.", messageCopied: "Nachricht zum Teilen kopiert.", copyError: "Kopieren ist in diesem Browser nicht verfügbar. Wählen Sie die Adresse manuell aus.", shareError: "Teilen ist nicht verfügbar. Kopieren Sie stattdessen die Seitenadresse.", copyAddress: "Seitenadresse kopieren", sharePage: "Seite teilen", sms: "SMS öffnen" },
};

export default function ShareTools({
  url,
  displayName,
  locale = "en",
}: {
  url: string;
  displayName: string;
  locale?: SiteLocale;
}) {
  const [message, setMessage] = useState("");
  const t = copy[locale];
  const shareText = `${t.sharePrefix} ${displayName}${locale === "fr" ? " " : ""}: ${url}`;

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successMessage);
    } catch {
      setMessage(t.copyError);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: t.title(displayName), text: shareText, url });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(t.shareError);
      }
      return;
    }
    await copyText(shareText, t.messageCopied);
  }

  return (
    <div className="manage-share-tools">
      <button type="button" onClick={() => copyText(url, t.addressCopied)}>
        {t.copyAddress}
      </button>
      <button type="button" className="secondary" onClick={share}>
        {t.sharePage}
      </button>
      <a href={`sms:?&body=${encodeURIComponent(shareText)}`}>
        {t.sms}
      </a>
      {message ? <small role="status">{message}</small> : null}
    </div>
  );
}

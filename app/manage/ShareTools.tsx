"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n";

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
  const isFrench = locale === "fr";
  const shareText = isFrench
    ? `Découvrez ClickBaitPays avec ${displayName} : ${url}`
    : `Learn about ClickBaitPays with ${displayName}: ${url}`;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(isFrench ? `${label} copié${label === "Adresse de la page" ? "e" : ""}.` : `${label} copied.`);
    } catch {
      setMessage(isFrench
        ? "La copie n’est pas disponible dans ce navigateur. Sélectionnez l’adresse manuellement."
        : "Copying is unavailable in this browser. Select the address manually.");
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: isFrench ? `Site CBP de ${displayName}` : `${displayName}'s CBP Site`,
        text: shareText,
        url,
      });
      return;
    }
    await copy(shareText, isFrench ? "Message de partage" : "Sharing message");
  }

  return (
    <div className="manage-share-tools">
      <button type="button" onClick={() => copy(url, isFrench ? "Adresse de la page" : "Page address")}>
        {isFrench ? "Copier l’adresse" : "Copy page address"}
      </button>
      <button type="button" className="secondary" onClick={share}>
        {isFrench ? "Partager la page" : "Share page"}
      </button>
      <a href={`sms:?&body=${encodeURIComponent(shareText)}`}>
        {isFrench ? "Ouvrir un SMS" : "Open text message"}
      </a>
      {message ? <small role="status">{message}</small> : null}
    </div>
  );
}

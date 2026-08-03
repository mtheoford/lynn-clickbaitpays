"use client";

import { useState } from "react";

export default function ShareTools({ url, displayName }: { url: string; displayName: string }) {
  const [message, setMessage] = useState("");
  const shareText = `Learn about ClickBaitPays with ${displayName}: ${url}`;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copying is unavailable in this browser. Select the address manually.");
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: `${displayName}'s CBP Site`, text: shareText, url });
      return;
    }
    await copy(shareText, "Sharing message");
  }

  return (
    <div className="manage-share-tools">
      <button type="button" onClick={() => copy(url, "Page address")}>Copy page address</button>
      <button type="button" className="secondary" onClick={share}>Share page</button>
      <a href={`sms:?&body=${encodeURIComponent(shareText)}`}>Open text message</a>
      {message ? <small role="status">{message}</small> : null}
    </div>
  );
}


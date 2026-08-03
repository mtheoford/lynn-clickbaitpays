"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProvisioningState = "processing" | "ready" | "action_required";

export default function ProvisioningStatus({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<ProvisioningState>("processing");
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => {
    let canceled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
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
  }, [sessionId]);

  if (state === "ready") {
    return (
      <div className="checkout-success-actions">
        <a className="join-button" href={publicUrl}>View my new page <i aria-hidden="true">→</i></a>
        <Link href="/manage">Manage my page</Link>
      </div>
    );
  }

  if (state === "action_required") {
    return (
      <div className="checkout-success-actions">
        <Link className="join-button" href="/manage/sign-in">Get account help <i aria-hidden="true">→</i></Link>
        <Link href="/get-your-site">Return to Personal CBP Sites</Link>
      </div>
    );
  }

  return (
    <div className="checkout-success-actions" aria-live="polite">
      <span>Confirming payment and publishing your page…</span>
      <Link href="/manage/sign-in">Sign in to check your account</Link>
    </div>
  );
}

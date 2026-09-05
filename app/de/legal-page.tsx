import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { policyAlternates, type PolicyPagePath } from "@/lib/policy-metadata";

export function germanLegalMetadata({ path, title, description }: { path: PolicyPagePath; title: string; description: string }): Metadata {
  return {
    title, description,
    robots: { index: true, follow: true },
    alternates: policyAlternates("de", path),
    openGraph: { title, description, type: "website", locale: "de_DE", alternateLocale: path === "faq" ? ["fr_FR"] : ["en_US", "fr_FR"], images: [{ url: "/og-de.png", width: 1536, height: 1024 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-de.png"] },
  };
}

export default function GermanLegalPage({ eyebrow, title, summary, updatedLabel = "Gültig seit dem 3. August 2026 · Zuletzt aktualisiert am 3. August 2026", children }: { eyebrow: string; title: string; summary: string; updatedLabel?: string; children: ReactNode }) {
  return (
    <main className="policy-page" lang="de">
      <header>
        <Link href="/de" className="marketing-brand"><span>PN</span><div><strong>ProNeurs™</strong><small>Persönliche CBP-Websites</small></div></Link>
        <Link href="/de">← Zurück zur deutschen Website</Link>
      </header>
      <article>
        <p className="eyebrow">{eyebrow}</p><h1>{title}</h1>
        <p className="policy-summary">{summary}</p><p className="policy-effective">{updatedLabel}</p>
        {children}
      </article>
      <footer aria-label="Website-Richtlinien">
        <Link href="/de/terms">Bedingungen</Link><Link href="/de/privacy">Datenschutz</Link>
        <Link href="/de/refund-policy">Kündigung und Erstattungen</Link><Link href="/de/acceptable-use">Zulässige Nutzung</Link>
        <Link href="/de/affiliate-disclosure">Affiliate-Hinweise</Link><Link href="/de/faq">FAQ</Link>
      </footer>
    </main>
  );
}

export function GermanSupportContact() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@proneurs.org";
  return <a href={`mailto:${email}`}>{email}</a>;
}

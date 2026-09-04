import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export function frenchLegalMetadata({
  path,
  englishPath,
  title,
  description,
}: {
  path: string;
  englishPath: string;
  title: string;
  description: string;
}): Metadata {
  const canonical = `/fr/${path}`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: { "en-US": englishPath, "fr-FR": canonical },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      alternateLocale: ["en_US"],
      images: [{ url: "/og-fr.png", width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-fr.png"],
    },
  };
}

export default function FrenchLegalPage({
  eyebrow,
  title,
  summary,
  updatedLabel = "Entrée en vigueur le 3 août 2026 · Dernière mise à jour le 3 août 2026",
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  updatedLabel?: string;
  children: ReactNode;
}) {
  return (
    <main className="policy-page" lang="fr">
      <header>
        <Link href="/fr" className="marketing-brand">
          <span>PN</span>
          <div>
            <strong>ProNeurs™</strong>
            <small>Sites CBP personnels</small>
          </div>
        </Link>
        <Link href="/fr">← Retour au site en français</Link>
      </header>
      <article>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="policy-summary">{summary}</p>
        <p className="policy-effective">{updatedLabel}</p>
        {children}
      </article>
      <footer aria-label="Politiques du site">
        <Link href="/fr/terms">Conditions</Link>
        <Link href="/fr/privacy">Confidentialité</Link>
        <Link href="/fr/refund-policy">Résiliation et remboursements</Link>
        <Link href="/fr/acceptable-use">Utilisation acceptable</Link>
        <Link href="/fr/affiliate-disclosure">Divulgation d’affiliation</Link>
        <Link href="/fr/faq">FAQ</Link>
      </footer>
    </main>
  );
}

export function FrenchSupportContact() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@proneurs.org";
  return <a href={`mailto:${email}`}>{email}</a>;
}

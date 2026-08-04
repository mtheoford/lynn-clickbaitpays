import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="policy-page">
      <header>
        <Link href="/get-your-site" className="marketing-brand">
          <span>PN</span><div><strong>ProNeurs</strong><small>Personal CBP Sites</small></div>
        </Link>
        <Link href="/get-your-site">← Back to Personal CBP Sites</Link>
      </header>
      <article>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="policy-summary">{summary}</p>
        <p className="policy-effective">Effective August 3, 2026 · Last updated August 3, 2026</p>
        {children}
      </article>
      <footer>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/refund-policy">Cancellation and refunds</Link>
        <Link href="/acceptable-use">Acceptable use</Link>
        <Link href="/affiliate-disclosure">Affiliate disclosure</Link>
      </footer>
    </main>
  );
}

export function SupportContact() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@proneurs.org";
  return <a href={`mailto:${email}`}>{email}</a>;
}

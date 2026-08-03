import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";

export const metadata: Metadata = {
  title: "Your Personal CBP Site",
  description:
    "Your own polished ClickBaitPays page with videos, calculator, FAQs, and your official referral link.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your own CBP page—ready to share",
    description: "Everything your prospects need in one professional page for $9/month.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites-v3.png", width: 1734, height: 907 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your own CBP page—ready to share",
    description: "Everything your prospects need in one professional page.",
    images: ["/og-personal-cbp-sites-v3.png"],
  },
};

const features = [
  { icon: "▶", label: "Videos" },
  { icon: "123", label: "Calculator" },
  { icon: "?", label: "FAQs" },
  { icon: "↗", label: "Your referral link" },
];

export default async function GetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const exampleSiteUrl = siteUrl("your-name");
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split("your-name");

  return (
    <main className="compact-sales-page">
      <section className="compact-sales-card" id="build" aria-labelledby="compact-sales-title">
        <header className="compact-sales-brand-row">
          <Link href="/" className="compact-sales-brand" aria-label="ProNeurs Personal CBP Sites">
            <span>PN</span>
            <div><strong>Pro<span>Neurs</span></strong><small>Personal CBP Sites</small></div>
          </Link>
          <nav className="compact-utility-links" aria-label="Page links">
            <Link href="/s/lynn-theobald">View live example</Link>
            <Link href="/manage">Manage my page</Link>
          </nav>
        </header>

        <div className="compact-sales-copy">
          <h1 id="compact-sales-title">Your own<br />CBP page.</h1>
          <p>Ready to share.</p>
        </div>

        <div className="compact-device-scene" aria-label="Preview of a personal CBP site">
          <figure className="compact-site-browser">
            <div className="compact-site-browser-bar">
              <span className="compact-site-dots"><i /><i /><i /></span>
              <span className="compact-site-address">your-name.cbp.proneurs.org</span>
              <span className="compact-site-menu" aria-hidden="true">≡</span>
            </div>
            <div className="compact-site-screenshot">
              <Image
                src="/replicated-site-hero.jpg"
                alt="Actual personalized ClickBaitPays replicated website"
                fill
                priority
                sizes="(max-width: 720px) 88vw, 42vw"
              />
            </div>
            <figcaption><span>Actual replicated site</span><strong>Personalized with your information</strong></figcaption>
          </figure>
        </div>

        <aside className="compact-sales-offer" aria-label="Personal site features and price">
          <div className="compact-feature-list">
            {features.map((feature) => (
              <div key={feature.label}>
                <span>{feature.icon}</span>
                <strong>{feature.label}</strong>
              </div>
            ))}
          </div>
          <div className="compact-price-box">
            <div><strong>$9</strong><span>/month</span></div>
            <SignupDialog
              source={params.source}
              addressPrefix={addressPrefix}
              addressSuffix={addressSuffix}
              checkoutCanceled={params.checkout === "canceled"}
              dialogId="compact-signup"
              triggerLabel="Get my page"
            />
          </div>
        </aside>

        <footer className="compact-sales-footer">
          <p>One professional page for your videos, calculator, FAQs, and official referral link.</p>
          <nav aria-label="Legal links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </footer>
      </section>
    </main>
  );
}

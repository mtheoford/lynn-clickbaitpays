import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";

export const metadata: Metadata = {
  title: "Your Personal CBP Site",
  description:
    "Replace a bare ClickBaitPays referral link with a polished personal page featuring your referral link, contact information, videos, calculator, FAQs, and resources.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your own CBP page—ready to share",
    description:
      "Your referral link, videos, calculator, resources, and contact details in one professional page for $9/month.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites-v3.png", width: 1734, height: 907 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your own CBP page—ready to share",
    description: "Everything your prospects need in one polished personal page.",
    images: ["/og-personal-cbp-sites-v3.png"],
  },
};

const heroFeatures = [
  { icon: "▶", title: "Videos", body: "A guided introduction and member tour" },
  { icon: "123", title: "Calculator", body: "Model scenarios and explore the program’s potential" },
  { icon: "?", title: "FAQs & resources", body: "Answers and official links in one place" },
  { icon: "↗", title: "Your referral link", body: "Built into every important action" },
];

const included = [
  "Your own personalized page address",
  "Your official referral link on every join button",
  "Sponsor introduction and contact information",
  "Welcome video and member dashboard tour",
  "Calculator for modeling campaign and referral scenarios",
  "FAQs, official resources, and sharing tools",
  "Mobile-ready design maintained for you",
  "Basic page-view and referral-click analytics",
];

export default async function GetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const exampleSiteUrl = siteUrl("your-name");
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split("your-name");
  const signupProps = {
    source: params.source,
    addressPrefix,
    addressSuffix,
    checkoutCanceled: params.checkout === "canceled",
  };

  return (
    <main className="marketing-page sales-page">
      <header className="marketing-header sales-header" id="top">
        <Link href="/" className="marketing-brand">
          <span>PN</span>
          <div>
            <strong>ProNeurs</strong>
            <small>Personal CBP Sites</small>
          </div>
        </Link>
        <nav className="marketing-account-links" aria-label="Personal site account">
          <Link href="/manage">Manage my page</Link>
          <a href="#pricing">Get my page</a>
        </nav>
      </header>

      <section className="sales-hero" id="build" aria-labelledby="sales-title">
        <div className="sales-hero-glow sales-hero-glow-one" aria-hidden="true" />
        <div className="sales-hero-glow sales-hero-glow-two" aria-hidden="true" />

        <div className="sales-hero-copy">
          <p className="eyebrow">Built for ClickBaitPays members</p>
          <h1 id="sales-title">
            Your own CBP page. <em>Ready to share.</em>
          </h1>
          <p>
            Share one polished page that explains CBP, models its potential,
            answers common questions, and keeps your official referral link at
            the center.
          </p>
          <div className="sales-personalized-row" aria-label="Personalized page features">
            <span>Your name</span><i>•</i><span>Your link</span><i>•</i><span>Your contact info</span>
          </div>
          <div className="sales-hero-actions" id="top-offer">
            <SignupDialog {...signupProps} dialogId="hero-signup" triggerLabel="Build my page" />
            <Link className="sales-secondary-link" href="/s/lynn-theobald">
              View a live example <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="sales-safe-note">No setup fee · Cancel anytime · Secure Stripe billing</p>
        </div>

        <div className="sales-hero-preview" aria-label="Example personalized CBP site">
          <div className="sales-preview-label"><span className="pulse-dot" /> Actual replicated site</div>
          <figure className="sales-preview sales-preview-main">
            <div className="sales-browser-bar"><i /><i /><i /><span>your-name.cbp.proneurs.org</span></div>
            <div className="sales-preview-image">
              <Image
                src="/replicated-site-hero.jpg"
                alt="Example personalized ClickBaitPays sponsor site"
                fill
                priority
                sizes="(max-width: 760px) 82vw, 35vw"
              />
            </div>
          </figure>
          <figure className="sales-preview sales-preview-detail">
            <div className="sales-browser-bar"><i /><i /><i /><span>Member tour</span></div>
            <div className="sales-preview-image">
              <Image
                src="/replicated-site-features.jpg"
                alt="Member dashboard walkthrough on a replicated site"
                fill
                sizes="(max-width: 760px) 52vw, 21vw"
              />
            </div>
          </figure>
        </div>

        <aside className="sales-feature-rail" aria-label="Core replicated site features">
          <div className="sales-feature-list">
            {heroFeatures.map((feature) => (
              <article key={feature.title}>
                <span>{feature.icon}</span>
                <div><strong>{feature.title}</strong><small>{feature.body}</small></div>
              </article>
            ))}
          </div>
          <div className="sales-price-card">
            <div><strong>$9</strong><span>/month</span></div>
            <small>or $79 annually · save $29</small>
          </div>
        </aside>
      </section>

      <section className="sales-proof-bar" aria-label="Service highlights">
        <span><b>✓</b> Personalized for you</span>
        <span><b>✓</b> Mobile-ready</span>
        <span><b>✓</b> Maintained by ProNeurs</span>
        <span><b>✓</b> Your referral link stays yours</span>
      </section>

      <section className="sales-included" aria-labelledby="included-title">
        <div className="sales-included-preview">
          <div className="sales-included-browser-bar"><i /><i /><i /><span>your-name.cbp.proneurs.org</span></div>
          <Image
            src="/replicated-site-features.jpg"
            alt="Example replicated site member tour and dashboard content"
            fill
            sizes="(max-width: 840px) 92vw, 49vw"
          />
          <div className="sales-included-caption">
            <strong>Built around your identity</strong>
            <span>Your name, referral link, and contact details stay front and center.</span>
          </div>
        </div>
        <div className="sales-included-copy">
          <p className="eyebrow">More than a referral link</p>
          <h2 id="included-title">A better way to explain CBP—without becoming a web designer.</h2>
          <p>
            Give prospects the context they need to understand the program and
            explore its potential. Add your information once; ProNeurs handles
            the design, core content, hosting, and maintenance.
          </p>
          <ul>
            {included.map((item) => <li key={item}><span>✓</span>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="sales-pricing" id="pricing" aria-labelledby="pricing-title">
        <div className="sales-pricing-copy">
          <p className="eyebrow">Simple, member-friendly pricing</p>
          <h2 id="pricing-title">Put your name on something worth sharing.</h2>
          <p>Choose monthly flexibility or save with the annual plan. No setup fee.</p>
          <div className="sales-pricing-assurances">
            <span>✓ Cancel anytime</span>
            <span>✓ Update your information later</span>
            <span>✓ No CBP password or wallet details needed</span>
          </div>
        </div>
        <div className="sales-pricing-card">
          <p>Personal CBP Site</p>
          <div><strong>$9</strong><span>/month</span></div>
          <small>or $79/year · save $29</small>
          <SignupDialog {...signupProps} dialogId="pricing-signup" triggerLabel="Create my personal page" />
          <p className="sales-pricing-fine">Secure checkout through Stripe</p>
        </div>
      </section>

      <section className="sales-faq" aria-labelledby="faq-title">
        <div><p className="eyebrow">Good to know</p><h2 id="faq-title">Clear answers before you subscribe.</h2></div>
        <div className="sales-faq-list">
          <details><summary>Is this operated by ClickBaitPays?<span>+</span></summary><p>No. ProNeurs provides an independent website and sharing service.</p></details>
          <details><summary>Can I update my information?<span>+</span></summary><p>Yes. Secure account access lets you update your contact details and official referral link.</p></details>
          <details><summary>Does the site guarantee referrals or earnings?<span>+</span></summary><p>No. The site gives you a professional sharing resource. Traffic, referrals, participation, and earnings are never guaranteed.</p></details>
        </div>
      </section>

      <footer className="marketing-footer sales-footer">
        <span>ProNeurs Personal CBP Sites</span>
        <p>Independent website service—not operated by ClickBaitPays. Participation involves financial and cryptocurrency risk. Earnings are not guaranteed.</p>
        <div><Link href="/manage">Manage my page</Link> · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/acceptable-use">Acceptable use</Link></div>
      </footer>
    </main>
  );
}

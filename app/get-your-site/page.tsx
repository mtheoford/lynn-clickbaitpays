import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Get Your Personal CBP Site | ProNeurs",
  description: "Turn your ClickBaitPays referral link into a polished, personal page with your name, contact information, videos, and resources.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your CBP link—made personal",
    description: "One polished page with your name, referral link, and contact information. Ready to share for $9/month.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites-v2.png", width: 1731, height: 909 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your CBP link—made personal",
    description: "A polished personal sharing page for ClickBaitPays members.",
    images: ["/og-personal-cbp-sites-v2.png"],
  },
};

export default async function GetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const exampleSiteUrl = siteUrl("your-name");
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split("your-name");
  const addressLabel = exampleSiteUrl.replace(/^https?:\/\//, "");
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link href="/" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs</strong><small>Personal CBP Sites</small></div>
        </Link>
        <nav className="marketing-account-links" aria-label="Personal site account">
          <Link href="/manage">Manage my page</Link>
          <a href="#build">Build my page</a>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="eyebrow">Built for ClickBaitPays members</p>
          <h1>Your referral link—made <em>personal.</em></h1>
          <p>
            Give prospects more than a bare link. Share one polished page with the videos,
            answers, and resources they need—with your name and referral link built in.
          </p>
          <div className="marketing-price">
            <strong>$9</strong><span>/month</span><small>or $79 annually · cancel anytime</small>
          </div>
          <a className="join-button" href="#build">Get my personal page <i aria-hidden="true">↓</i></a>
        </div>
        <div className="marketing-site-preview" aria-label="Example personal site address">
          <div className="preview-browser-bar"><i /><i /><i /><span>{addressLabel}</span></div>
          <div className="preview-content">
            <small>A clear first stop for your prospects</small>
            <h2>Meet CBP through<br /><em>Your Name.</em></h2>
            <p>Your referral destination, helpful content, and contact details—together in one place.</p>
            <span className="preview-cta">Join ClickBaitPays ↗</span>
          </div>
        </div>
      </section>

      <section className="marketing-proof-strip">
        <span>Your referral link</span><i>+</i><span>Your contact details</span><i>+</i><span>Helpful CBP content</span><i>=</i><span>One page ready to share</span>
      </section>

      <section className="marketing-value" id="included">
        <div className="value-heading">
          <p className="eyebrow">A better way to share</p>
          <h2>You bring the link.<br />We make it share-worthy.</h2>
        </div>
        <div className="value-grid">
          <article>
            <b>01</b>
            <div><h3>More context</h3><p>Videos, FAQs, and resources help prospects understand what they’re viewing.</p></div>
          </article>
          <article>
            <b>02</b>
            <div><h3>Your identity</h3><p>Your name, contact details, and official referral link stay front and center.</p></div>
          </article>
          <article>
            <b>03</b>
            <div><h3>Less upkeep</h3><p>Mobile-ready design, core content, and disclosures are maintained for you.</p></div>
          </article>
        </div>
        <div className="value-footer">
          <span>Personalize</span><i>→</i><span>Choose a plan</span><i>→</i><strong>Share your page</strong>
        </div>
      </section>

      <section className="marketing-builder" id="build">
        <div className="builder-copy">
          <p className="eyebrow">Your page starts here</p>
          <h2>Put your name on something worth sharing.</h2>
          <p>Add your contact details and official CBP referral link. Choose a plan, complete secure checkout, and we’ll create your personal sharing page.</p>
          <div className="builder-price-card">
            <div><strong>$9</strong><span>/month</span></div>
            <small>or save $29 with the $79 annual plan</small>
          </div>
          {params.checkout === "canceled" ? <p className="checkout-note">Checkout was canceled. Your page has not been activated.</p> : null}
          <div className="builder-assurances">
            <span><b>✓</b> Your referral link stays yours</span>
            <span><b>✓</b> No setup fee · cancel anytime</span>
            <span><b>✓</b> No CBP password or wallet details needed</span>
          </div>
        </div>
        <SignupForm
          source={params.source}
          addressPrefix={addressPrefix}
          addressSuffix={addressSuffix}
        />
      </section>

      <section className="marketing-faq">
        <div><p className="eyebrow">Good to know</p><h2>Just the important details.</h2></div>
        <div>
          <details><summary>Is this operated by ClickBaitPays?<i>+</i></summary><p>No. ProNeurs provides an independent website and sharing service. A subscription does not create or fund a ClickBaitPays account.</p></details>
          <details><summary>Can I update my information later?<i>+</i></summary><p>Yes. You will receive secure passwordless access to update your contact details and official referral link.</p></details>
          <details><summary>What happens if I cancel?<i>+</i></summary><p>Your site remains active through the paid billing period and is then unpublished under the service retention policy.</p></details>
        </div>
      </section>

      <footer className="marketing-footer">
        <span>ProNeurs Personal CBP Sites</span>
        <p>Independent website service—not operated by ClickBaitPays. A personal site does not guarantee traffic, referrals, participation, or earnings.</p>
        <div><Link href="/manage">Manage my page</Link> · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/acceptable-use">Acceptable use</Link></div>
      </footer>
    </main>
  );
}

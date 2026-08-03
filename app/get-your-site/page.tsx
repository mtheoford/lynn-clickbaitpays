import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Get Your Personal CBP Site | ProNeurs",
  description: "Launch a professional, personalized ClickBaitPays sponsor page with your referral link and contact information.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your Personal CBP Site",
    description: "Professional. Personalized. Ready to share.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Personal CBP Site",
    description: "Professional. Personalized. Ready to share.",
    images: ["/og-personal-cbp-sites.png"],
  },
};

const features = [
  "Your own cbp-name.proneurs.org address",
  "Your referral link on every ClickBaitPays button",
  "Personal contact section and sponsor introduction",
  "Mobile-ready design, videos, FAQs, and resources",
  "Centrally maintained content and disclosures",
  "Sharing tools and basic page analytics",
];

export default async function GetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link href="/" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs</strong><small>Personal CBP Sites</small></div>
        </Link>
        <a href="#build">Build my page</a>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="eyebrow">Your professional sharing page</p>
          <h1>Share ClickBaitPays with a page that feels like <em>yours.</em></h1>
          <p>
            Add your referral link and contact details once. We create and maintain a polished,
            mobile-ready sponsor page you can confidently share anywhere.
          </p>
          <div className="marketing-price">
            <strong>$9</strong><span>/month</span><small>or $79 annually · cancel anytime</small>
          </div>
          <a className="join-button" href="#build">Create my page <i aria-hidden="true">↓</i></a>
        </div>
        <div className="marketing-site-preview" aria-label="Example personal site address">
          <div className="preview-browser-bar"><i /><i /><i /><span>cbp-your-name.proneurs.org</span></div>
          <div className="preview-content">
            <small>Your independent sponsor guide</small>
            <h2>Start with<br /><em>Your Name.</em></h2>
            <p>A focused page with the key videos, resources, answers, and your contact details.</p>
            <span className="preview-cta">Join ClickBaitPays ↗</span>
          </div>
        </div>
      </section>

      <section className="marketing-proof-strip">
        <span>One link to share</span><i>•</i><span>Personalized in minutes</span><i>•</i><span>Updated for you</span><i>•</i><span>Cancel anytime</span>
      </section>

      <section className="marketing-features" id="included">
        <div>
          <p className="eyebrow">Everything you need to start sharing</p>
          <h2>Professional without becoming a web designer.</h2>
          <p>Your page uses the proven sponsor-site structure while keeping your identity, contact details, and referral destination front and center.</p>
        </div>
        <ul>
          {features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}
        </ul>
      </section>

      <section className="marketing-steps">
        <p className="eyebrow">Three straightforward steps</p>
        <div>
          <article><b>01</b><h3>Personalize</h3><p>Enter your contact information, page name, and official referral link.</p></article>
          <article><b>02</b><h3>Subscribe</h3><p>Choose monthly or annual billing and complete secure Stripe Checkout.</p></article>
          <article><b>03</b><h3>Share</h3><p>Receive your personal URL and start sending prospects to one clear destination.</p></article>
        </div>
      </section>

      <section className="marketing-builder" id="build">
        <div className="builder-copy">
          <p className="eyebrow">See your address take shape</p>
          <h2>Build your personal CBP site.</h2>
          <p>Checkout activates after Stripe completes its account review. Until then, the form safely previews the finished onboarding experience without saving information.</p>
          {params.checkout === "canceled" ? <p className="checkout-note">Checkout was canceled. Your page has not been activated.</p> : null}
          <div className="builder-assurances">
            <span><b>✓</b> Your referral link stays yours</span>
            <span><b>✓</b> No setup fee</span>
            <span><b>✓</b> No wallet credentials collected</span>
          </div>
        </div>
        <SignupForm source={params.source} />
      </section>

      <section className="marketing-faq">
        <div><p className="eyebrow">Before you subscribe</p><h2>Clear expectations.</h2></div>
        <div>
          <details><summary>Is this operated by ClickBaitPays?<i>+</i></summary><p>No. ProNeurs provides an independent website and sharing service. A subscription does not create or fund a ClickBaitPays account.</p></details>
          <details><summary>Can I update my information later?<i>+</i></summary><p>Yes. You will receive secure passwordless access to update your contact details and official referral link.</p></details>
          <details><summary>What happens if I cancel?<i>+</i></summary><p>Your site remains active through the paid billing period and is then unpublished under the service retention policy.</p></details>
          <details><summary>Does the site guarantee referrals or earnings?<i>+</i></summary><p>No. The service provides a professional information page. Traffic, referrals, acceptance, participation, and earnings are never guaranteed.</p></details>
        </div>
      </section>

      <footer className="marketing-footer">
        <span>ProNeurs Personal CBP Sites</span>
        <p>Independent website service—not operated by ClickBaitPays. Participation involves financial and cryptocurrency risk. Earnings are not guaranteed.</p>
      </footer>
    </main>
  );
}

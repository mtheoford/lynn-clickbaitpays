import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";

export const metadata: Metadata = {
  title: "Your Personal CBP Site",
  description:
    "Your own polished ClickBaitPays sharing page with your referral link, contact information, videos, calculator, FAQs, and resources.",
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

const features = [
  {
    title: "Your referral link",
    body: "Built into every ClickBaitPays action.",
  },
  {
    title: "Interactive calculator",
    body: "Helps visitors explore campaign and referral scenarios.",
  },
  {
    title: "Videos & member tour",
    body: "A clear introduction and practical dashboard walkthrough.",
  },
  {
    title: "Your sponsor profile",
    body: "Your name, contact details, and personal introduction.",
  },
  {
    title: "FAQs & resources",
    body: "Helpful answers and official program links in one place.",
  },
  {
    title: "Maintained for you",
    body: "Mobile-ready design, core content, and sharing tools.",
  },
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
    <main className="marketing-page marketing-one-page">
      <header className="marketing-header one-page-header">
        <Link href="/" className="marketing-brand">
          <span>PN</span>
          <div>
            <strong>ProNeurs</strong>
            <small>Personal CBP Sites</small>
          </div>
        </Link>
        <nav className="marketing-account-links" aria-label="Personal site account">
          <Link href="/manage">Manage my page</Link>
          <a href="#build">Build my page</a>
        </nav>
      </header>

      <section className="one-page-stage" aria-labelledby="one-page-title">
        <div className="one-page-sales">
          <p className="eyebrow">Made for ClickBaitPays members</p>
          <h1 id="one-page-title">
            Your own CBP page. <em>Ready to share.</em>
          </h1>
          <p className="one-page-lede">
            Give every prospect one polished place to watch, learn, calculate,
            and connect—with your referral link built in.
          </p>

          <div className="one-page-offer">
            <div className="one-page-price">
              <strong>$9</strong>
              <span>/month</span>
              <small>or $79/year</small>
            </div>
            <SignupDialog
              source={params.source}
              addressPrefix={addressPrefix}
              addressSuffix={addressSuffix}
              checkoutCanceled={params.checkout === "canceled"}
            />
          </div>
          <p className="one-page-safe">No setup fee · Cancel anytime · Secure Stripe billing</p>
        </div>

        <div className="one-page-showcase" aria-label="Screenshots from a live replicated site">
          <div className="showcase-label">
            <span className="pulse-dot" />
            Actual replicated site
          </div>
          <figure className="showcase-screen showcase-screen-primary">
            <div className="showcase-browser-bar">
              <i /><i /><i /><span>your-name.cbp.proneurs.org</span>
            </div>
            <div className="showcase-image">
              <Image
                src="/replicated-site-hero.jpg"
                alt="Example personalized ClickBaitPays sponsor site hero"
                fill
                priority
                sizes="(max-width: 700px) 84vw, 34vw"
              />
            </div>
          </figure>
          <figure className="showcase-screen showcase-screen-secondary">
            <div className="showcase-image">
              <Image
                src="/replicated-site-features.jpg"
                alt="Example member dashboard walkthrough on a replicated site"
                fill
                sizes="(max-width: 700px) 42vw, 18vw"
              />
            </div>
          </figure>
          <div className="showcase-badge">
            <strong>Your name</strong>
            <span>Your link · Your contact info</span>
          </div>
        </div>

        <aside className="one-page-features" aria-labelledby="feature-title">
          <div className="feature-heading">
            <p className="eyebrow">Everything in one place</p>
            <h2 id="feature-title">A complete page—not just another link.</h2>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature.title}>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>{feature.title}</strong>
                  <small>{feature.body}</small>
                </div>
              </li>
            ))}
          </ul>
          <div className="one-page-steps" aria-label="How it works">
            <span>Personalize</span><i>→</i><span>Subscribe</span><i>→</i><strong>Share</strong>
          </div>
        </aside>
      </section>

      <footer className="one-page-footer">
        <p>
          Independent website service—not operated by ClickBaitPays. A personal
          site does not guarantee traffic, referrals, participation, or earnings.
        </p>
        <nav aria-label="Legal">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/acceptable-use">Acceptable use</Link>
        </nav>
      </footer>
    </main>
  );
}

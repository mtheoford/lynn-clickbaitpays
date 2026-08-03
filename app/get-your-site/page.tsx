import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";

export const metadata: Metadata = {
  title: "Your Personal CBP Site",
  description:
    "Give every CBP prospect one polished, personalized place to learn, watch, and take the next step with you.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your CBP story, beautifully presented.",
    description:
      "Your own polished CBP site—personalized, maintained, and ready to share.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites-v4.png", width: 1659, height: 948 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your CBP story, beautifully presented.",
    description: "One polished link for every CBP conversation.",
    images: ["/og-personal-cbp-sites-v4.png"],
  },
};

const benefits = [
  {
    number: "01",
    title: "Built around you",
    copy: "Your name, contact details, and official referral link—presented professionally.",
  },
  {
    number: "02",
    title: "Does the explaining",
    copy: "Videos, member tour, FAQs, and resources give prospects one clear place to learn.",
  },
  {
    number: "03",
    title: "Ready for every share",
    copy: "Send one memorable link in a text, email, post, or real-life conversation.",
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
  const signupProps = {
    source: params.source,
    addressPrefix,
    addressSuffix,
    checkoutCanceled: params.checkout === "canceled",
  };

  return (
    <main className="cbp-offer" id="top">
      <div className="cbp-offer-glow cbp-offer-glow-one" />
      <div className="cbp-offer-glow cbp-offer-glow-two" />

      <header className="cbp-offer-header">
        <Link href="#top" className="cbp-offer-brand" aria-label="ProNeurs Personal CBP Sites home">
          <span aria-hidden="true">PN</span>
          <div>
            <strong>ProNeurs</strong>
            <small>Personal CBP Sites</small>
          </div>
        </Link>
        <nav aria-label="Page navigation">
          <Link href="/s/lynn-theobald">See a live site <span aria-hidden="true">↗</span></Link>
          <Link href="/manage">Customer login</Link>
        </nav>
      </header>

      <section className="cbp-offer-hero" aria-labelledby="cbp-offer-title">
        <div className="cbp-offer-copy">
          <p className="cbp-offer-kicker"><span /> Made for ClickBaitPays members</p>
          <h1 id="cbp-offer-title">
            Give your prospects one great place to <em>start.</em>
          </h1>
          <p className="cbp-offer-lead">
            Your own polished CBP site—personalized to you, packed with the right information, and ready to share.
          </p>

          <div className="cbp-offer-actions">
            <SignupDialog
              {...signupProps}
              dialogId="hero-signup"
              triggerLabel="Build my CBP site"
            />
            <Link className="cbp-offer-demo-link" href="/s/lynn-theobald">
              Explore the live example <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="cbp-offer-price-line" aria-label="Pricing">
            <strong>$9<span>/month</span></strong>
            <i />
            <span>or $79/year</span>
            <i />
            <span>Secure Stripe checkout</span>
          </div>
        </div>

        <div className="cbp-offer-product" aria-label="Preview of a personalized CBP site">
          <div className="cbp-product-note cbp-product-note-brand">
            <span>01</span>
            <strong>Your brand</strong>
          </div>
          <div className="cbp-product-note cbp-product-note-link">
            <span>02</span>
            <strong>Your referral link</strong>
          </div>

          <figure className="cbp-product-browser">
            <div className="cbp-product-browser-bar">
              <span className="cbp-product-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="cbp-product-address">lynn-theobald.cbp.proneurs.org</span>
              <span className="cbp-product-live"><i /> Live example</span>
            </div>
            <div className="cbp-product-screen">
              <Image
                src="/replicated-site-hero.jpg"
                alt="Personalized CBP website showing the sponsor name, educational messaging, and referral call to action"
                fill
                priority
                sizes="(max-width: 760px) 92vw, 57vw"
              />
            </div>
            <figcaption>
              <div><span>Personalized sponsor site</span><strong>Professional from the very first click.</strong></div>
              <Link href="/s/lynn-theobald" aria-label="Open Lynn Theobald's live example site">Open live site <span aria-hidden="true">↗</span></Link>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="cbp-offer-benefits" aria-labelledby="cbp-benefits-title">
        <div className="cbp-benefits-heading">
          <p>One link. The complete introduction.</p>
          <h2 id="cbp-benefits-title">Let the site do the explaining.</h2>
        </div>
        <div className="cbp-benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit.number}>
              <span>{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cbp-offer-close" aria-labelledby="cbp-close-title">
        <div>
          <p>Your next CBP conversation deserves a better follow-up.</p>
          <h2 id="cbp-close-title">Make your introduction memorable.</h2>
        </div>
        <div className="cbp-close-action">
          <span><strong>$9</strong>/month</span>
          <SignupDialog
            {...signupProps}
            dialogId="closing-signup"
            triggerLabel="Get my personal site"
          />
          <small>Annual plan available for $79/year.</small>
        </div>
      </section>

      <footer className="cbp-offer-footer">
        <p>Independent website service for ClickBaitPays members. Not affiliated with or endorsed by ClickBaitPays.</p>
        <nav aria-label="Legal links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund-policy">Refund policy</Link>
        </nav>
      </footer>
    </main>
  );
}

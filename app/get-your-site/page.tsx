import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { defaultSponsorSite, siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";
import { SignupPageViewTracker, TrackedDemoLink } from "./SignupPageAnalytics";

export const metadata: Metadata = {
  title: "Get Your ClickBaitPays Replicated Site",
  description:
    "Grow your ClickBaitPays opportunity with a personalized replicated site featuring your referral link, videos, resources, and marketing materials.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your ClickBaitPays replicated site—ready to grow with you.",
    description:
      "A custom, ready-to-share site with your referral link and high-impact ClickBaitPays marketing materials.",
    type: "website",
    images: [{ url: "/og-personal-cbp-sites-v4.png", width: 1659, height: 948 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get your ClickBaitPays replicated site.",
    description: "Your custom CBP growth hub—personalized and ready to share.",
    images: ["/og-personal-cbp-sites-v4.png"],
  },
};

const benefits = [
  {
    number: "01",
    title: "Customized to you",
    copy: "Your name, contact details, and official referral link—presented professionally.",
  },
  {
    number: "02",
    title: "Marketing, ready to share",
    copy: "Give prospects one polished place for high-impact videos, resources, and opportunity information.",
  },
  {
    number: "03",
    title: "Built-in campaign calculator",
    copy: "Let visitors model 1, 2, or 3 campaigns, referral scenarios, and potential paths to full campaign capacity.",
  },
  {
    number: "04",
    title: "Built to help you grow",
    copy: "Share one memorable link in every text, email, post, or real-life CBP conversation.",
  },
];

export default async function GetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const exampleSiteUrl = siteUrl(defaultSponsorSite.slug);
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split(defaultSponsorSite.slug);
  const frenchOfferHref = params.source
    ? `/fr/get-your-site?source=${encodeURIComponent(params.source)}`
    : "/fr/get-your-site";
  const signupProps = {
    source: params.source,
    addressPrefix,
    addressSuffix,
    checkoutCanceled: params.checkout === "canceled",
  };

  return (
    <main className="cbp-offer" id="top">
      <SignupPageViewTracker source={params.source} />
      <div className="cbp-offer-glow cbp-offer-glow-one" />
      <div className="cbp-offer-glow cbp-offer-glow-two" />

      <header className="cbp-offer-header">
        <Link href="#top" className="cbp-offer-brand" aria-label="ProNeurs trademark Personal CBP Sites home">
          <span aria-hidden="true">PN</span>
          <div>
            <strong>ProNeurs™</strong>
            <small>ClickBaitPays Replicated Sites</small>
          </div>
        </Link>
        <nav aria-label="Page navigation">
          <TrackedDemoLink href={exampleSiteUrl} placement="header" source={params.source} target="_blank" rel="noopener noreferrer">See a live site <span aria-hidden="true">↗</span></TrackedDemoLink>
          <Link href="/manage">Customer login</Link>
          <Link href={frenchOfferHref} hrefLang="fr" lang="fr">FR</Link>
        </nav>
      </header>

      <section className="cbp-offer-hero" aria-labelledby="cbp-offer-title">
        <div className="cbp-offer-copy">
          <h1 id="cbp-offer-title">
            <span className="cbp-offer-title-line">Supercharge your</span>
            <span className="cbp-offer-title-brand">ClickBaitPays</span>
            <span className="cbp-offer-title-line">growth with a</span>
            <span className="cbp-offer-title-line"><em>replicated site</em></span>
          </h1>
          <p className="cbp-offer-lead">
            Your own custom growth hub—personalized with your referral link, high-impact videos, resources, and an interactive calculator visitors can use to model campaign potential.
          </p>

          <div className="cbp-offer-actions">
            <SignupDialog
              {...signupProps}
              dialogId="hero-signup"
              triggerLabel="Get My Replicated CBP Site"
              analyticsPlacement="hero"
            />
            <TrackedDemoLink
              className="cbp-offer-demo-link"
              href={exampleSiteUrl}
              placement="hero"
              source={params.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>See a replicated site</span>
              <span className="cbp-offer-demo-icon" aria-hidden="true">↗</span>
            </TrackedDemoLink>
          </div>

          <div className="cbp-offer-pricing" aria-label="Subscription pricing">
            <div className="cbp-price-option">
              <span>Monthly</span>
              <strong>$9<small>/month</small></strong>
              <p>Billed monthly</p>
            </div>
            <div className="cbp-price-option cbp-price-option-annual">
              <b>Best value · 27% off</b>
              <span>Annual</span>
              <strong>$79<small>/year</small></strong>
              <p>Save $29 every year</p>
            </div>
          </div>
          <p className="cbp-secure-checkout">Secure checkout through Stripe</p>
        </div>

        <div className="cbp-offer-product" aria-label="Preview of a personalized ClickBaitPays replicated site">
          <figure className="cbp-product-browser">
            <div className="cbp-product-browser-bar">
              <span className="cbp-product-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="cbp-product-address">{exampleSiteUrl.replace(/^https?:\/\//, "")}</span>
              <span className="cbp-product-live"><i /> Live example</span>
            </div>
            <div className="cbp-product-screen">
              <Image
                src="/clickbaitpays-replicated-site-preview.jpg"
                alt="Personalized ClickBaitPays sponsor site with the ClickBaitPays welcome video and referral call to action"
                fill
                priority
                sizes="(max-width: 760px) calc(100vw - 30px), (max-width: 1020px) 62vw, 60vw"
              />
            </div>
            <figcaption>
              <div><span>Personalized replicated site</span><strong>Professional from the very first click.</strong></div>
              <TrackedDemoLink href={exampleSiteUrl} placement="product_preview" source={params.source} target="_blank" rel="noopener noreferrer" ariaLabel="Open the replicated-site example">Open live site <span aria-hidden="true">↗</span></TrackedDemoLink>
            </figcaption>
          </figure>
          <p className="cbp-product-member-note"><span /> Made for ClickBaitPays members</p>
        </div>
      </section>

      <section className="cbp-offer-benefits" aria-labelledby="cbp-benefits-title">
        <div className="cbp-benefits-heading">
          <p>Your custom CBP growth hub.</p>
          <h2 id="cbp-benefits-title">Power every conversation with one replicated site.</h2>
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
          <p>Your CBP opportunity deserves a stronger follow-up.</p>
          <h2 id="cbp-close-title">Put your replicated site to work.</h2>
        </div>
        <div className="cbp-close-action">
          <div className="cbp-close-pricing" aria-label="Subscription pricing">
            <div className="cbp-close-price-option">
              <span>Monthly</span>
              <strong>$9<small>/month</small></strong>
              <p>Billed monthly</p>
            </div>
            <div className="cbp-close-price-option cbp-close-price-annual">
              <b>Best value · 27% off</b>
              <span>Annual</span>
              <strong>$79<small>/year</small></strong>
              <p>Save $29 every year</p>
            </div>
          </div>
          <SignupDialog
            {...signupProps}
            dialogId="closing-signup"
            triggerLabel="Get My Replicated CBP Site"
            analyticsPlacement="closing"
          />
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

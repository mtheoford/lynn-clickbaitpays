import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ReferralSimulator from "./ReferralSimulator";
import { SiteViewTracker, TrackedLink } from "./SiteAnalytics";
import cbpMark from "../public/cbp-mark.png";
import {
  formatPhoneForDisplay,
  growthSignupUrl,
  phoneHref,
  requestSurface,
  resolveSponsorSite,
} from "@/lib/site-config";

export const dynamic = "force-dynamic";

const resources = [
  {
    title: "Getting Started",
    eyebrow: "Step-by-step guide",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/618d0fa01_CBPGettingStartedGuide.pdf",
  },
  {
    title: "Official FAQ",
    eyebrow: "Current rules & fees",
    href: "https://clickbaitpays.me/questions.php",
  },
];

const faqs = [
  {
    question: "Is joining free?",
    answer:
      "The program’s public materials distinguish account registration from paid campaign activity. Review the official FAQ and dashboard for current costs before making any payment.",
  },
  {
    question: "Do I need referrals?",
    answer:
      "ClickBaitPays currently describes referrals as optional. Confirm the current program rules in official materials before participating.",
  },
  {
    question: "When can earnings be withdrawn?",
    answer:
      "Withdrawal timing, minimums, fees, eligibility, and processing rules can change. Use the official FAQ and member dashboard as the current source of truth.",
  },
];

function JoinButton({
  href,
  siteSlug,
  label = "Join ClickBaitPays",
}: {
  href: string;
  siteSlug: string;
  label?: string;
}) {
  return (
    <TrackedLink
      className="join-button"
      href={href}
      siteSlug={siteSlug}
      eventType="referral_click"
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <span>{label}</span>
      <i aria-hidden="true">↗</i>
    </TrackedLink>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Image src={cbpMark} alt="" sizes="42px" priority />
    </span>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSponsorSite();
  return {
    title: `Join ClickBaitPays with ${site.displayName}`,
    description: `Explore ClickBaitPays and get started with independent sponsor ${site.displayName}.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: `Join ClickBaitPays with ${site.displayName}`,
      description: `A clear, independent sponsor guide from ${site.displayName}.`,
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024 }],
    },
  };
}

export async function SponsorSitePage({ slug }: { slug?: string }) {
  const site = await resolveSponsorSite(slug);

  if (site.status !== "active" && site.status !== "past_due") {
    return (
      <main className="site-unavailable">
        <div>
          <BrandMark />
          <p className="eyebrow">Personal CBP Site</p>
          <h1>This page is not currently available.</h1>
          <p>The owner may be updating the page. Please check the address and try again later.</p>
          <a className="join-button" href={growthSignupUrl(site.slug)}>
            Get Your Personal CBP Site <i aria-hidden="true">↗</i>
          </a>
        </div>
      </main>
    );
  }

  return (
    <main id="top">
      <SiteViewTracker siteSlug={site.slug} />
      <header className="site-header">
        <a className="brand" href="#top" aria-label={`CBP with ${site.displayName} home`}>
          <BrandMark />
          <span>
            <strong>CBP with {site.displayName}</strong>
            <small>Independent sponsor guide</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how">Income strategy</a>
          <a href="#learn">Member tour</a>
          <JoinButton href={site.referralUrl} siteSlug={site.slug} />
        </nav>
      </header>

      <section className="hero">
        <div className="hero-aura hero-aura-one" />
        <div className="hero-aura hero-aura-two" />

        <div className="hero-copy">
          <h1>
            See how it works.
            <br />
            Understand the opportunity.
            <br />
            <em>Decide with confidence.</em>
          </h1>
          <div className="hero-actions">
            <JoinButton href={site.referralUrl} siteSlug={site.slug} />
            <a className="text-link" href="#how">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="hero-disclosure">
            Independent affiliate site. If you join through a sponsor link, the sponsor may receive compensation. Participation involves financial and cryptocurrency risk, and earnings are not guaranteed. <a href="/affiliate-disclosure">Read the affiliate disclosure.</a>
          </p>
        </div>

        <div className="welcome-feature">
          <div className="video-callout">
            <span className="pulse-dot" />
            Start here · Welcome to ClickBaitPays
          </div>
          <div className="hero-video">
            <iframe
              src="https://player.vimeo.com/video/1210888620?h=46a4e2c6c8&title=0&byline=0&portrait=0"
              title="Welcome to ClickBaitPays"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-caption">
            <div>
              <strong>Watch the overview</strong>
              <span>The fastest way to understand the opportunity</span>
            </div>
            <span className="watch-cue" aria-hidden="true">▶</span>
          </div>
        </div>
      </section>

      <section className="momentum-strip" aria-label="What you will find">
        <div className="momentum-track">
          <span><b>✓</b> See how the platform works</span>
          <span><b>✓</b> Explore campaign strategies</span>
          <span><b>✓</b> Calculate your own scenarios</span>
          <span aria-hidden="true"><b>✓</b> See how the platform works</span>
          <span aria-hidden="true"><b>✓</b> Explore campaign strategies</span>
          <span aria-hidden="true"><b>✓</b> Calculate your own scenarios</span>
        </div>
      </section>

      <div className="journey-flow">
        <section className="section how-section" id="how">
          <div className="strategy-feature">
            <div className="strategy-heading-wide">
              <p className="eyebrow">01 · Explore the strategy</p>
              <h2>See how campaigns and referrals can work together.</h2>
            </div>

            <div className="strategy-stage">
              <div className="strategy-video-wrap">
                <div className="strategy-video-label">
                  <span className="pulse-dot" />
                  Featured · Income strategies
                </div>
                <div className="strategy-video">
                  <iframe
                    src="https://player.vimeo.com/video/1210888623?h=310a937e30&title=0&byline=0&portrait=0"
                    title="ClickBaitPays income strategies"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="strategy-video-footer">
                  <span>Campaigns</span>
                  <i aria-hidden="true">•</i>
                  <span>Staggering</span>
                  <i aria-hidden="true">•</i>
                  <span>Direct referrals</span>
                  <strong>Watch now <b aria-hidden="true">▶</b></strong>
                </div>
              </div>
              <div className="strategy-support">
                <p>
                  This focused walkthrough explains the three-campaign approach,
                  staggered timing, direct-referral commissions, and the choices
                  members make when campaign value becomes available.
                </p>
                <div className="strategy-support-actions">
                  <JoinButton href={site.referralUrl} siteSlug={site.slug} />
                  <ReferralSimulator />
                </div>
              </div>
            </div>
          </div>
        </section>

        <a className="section-transition" href="#learn">
          <span>Next</span>
          <strong>See the member dashboard</strong>
          <i aria-hidden="true">↓</i>
        </a>

        <section className="section learn-section" id="learn">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">02 · Tour the dashboard</p>
              <h2>Know the dashboard.</h2>
            </div>
          </div>

          <div className="secondary-videos single-video">
            <article>
              <div className="small-video">
                <iframe
                  src="https://player.vimeo.com/video/1210888621?h=adb75853a1&title=0&byline=0&portrait=0"
                  title="ClickBaitPays back-office walkthrough"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="small-video-copy">
                <span>Member tour</span>
                <h3>Back-office walkthrough</h3>
                <p>See campaigns, clicks, balances, referrals, deposits, and withdrawals.</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="section decision-section">
        <div className="decision-grid">
          <div className="resource-panel">
            <p className="eyebrow">Fast answers</p>
            <h2>Resources worth opening</h2>
            <div className="resource-list">
              {resources.map((resource) => (
                <a href={resource.href} target="_blank" rel="noopener noreferrer" key={resource.title}>
                  <span>
                    <small>{resource.eyebrow}</small>
                    <strong>{resource.title}</strong>
                  </span>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </div>
          </div>

          <div className="faq-panel">
            <p className="eyebrow">Before you join</p>
            <h2>Good questions.<br />Straight answers.</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}<i aria-hidden="true">+</i></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sponsor-section">
        <div className="sponsor-copy">
          <div className="avatar">{site.initials}</div>
          <div>
            <p className="eyebrow">Your independent sponsor</p>
            <h2>Start with {site.displayName}.</h2>
            <p>{site.bio}</p>
            <div className="contact-links">
              {site.showEmail ? (
                <a href={`mailto:${site.publicEmail}`}>
                  <i className="contact-icon" aria-hidden="true">✉</i>
                  {site.publicEmail}
                </a>
              ) : null}
              {site.showPhone ? (
                <a href={phoneHref(site.publicPhone)}>
                  <i className="contact-icon" aria-hidden="true">☎</i>
                  {formatPhoneForDisplay(site.publicPhone)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="sponsor-action">
          <JoinButton href={site.referralUrl} siteSlug={site.slug} />
        </div>
      </section>

      <section className="replicated-site-cta" aria-label="Get your own sponsor site">
        <div>
          <p className="eyebrow">A professional page of your own</p>
          <h2>Want a page like this?</h2>
          <p>Get your own personalized CBP sharing site in minutes.</p>
        </div>
        <TrackedLink className="replicated-site-button" href={growthSignupUrl(site.slug)} siteSlug={site.slug} eventType="growth_click">
          Get Your Personal CBP Site <span aria-hidden="true">↗</span>
        </TrackedLink>
      </section>

      <footer>
        <div className="footer-brand">
          <BrandMark />
          <span><strong>CBP with {site.displayName}</strong><small>Independent sponsor guide</small></span>
        </div>
        <p>
          Independent affiliate site—not operated by ClickBaitPays. Participation
          involves cryptocurrency and financial risk. Earnings are not guaranteed.
          Review official terms before participating.
        </p>
        <div className="footer-links">
          <a href="/terms">ProNeurs™ terms</a>
          <a href="/privacy">ProNeurs™ privacy</a>
          <a href="https://clickbaitpays.me/terms.php" target="_blank" rel="noopener noreferrer">ClickBaitPays terms</a>
          <a href="/affiliate-disclosure">Affiliate disclosure</a>
          {site.showEmail ? <a href={`mailto:${site.publicEmail}`}>Contact {site.displayName}</a> : null}
          <TrackedLink href={growthSignupUrl(site.slug)} siteSlug={site.slug} eventType="growth_click">Get Your Personal CBP Site</TrackedLink>
        </div>
      </footer>

      <TrackedLink
        className="mobile-join"
        href={site.referralUrl}
        siteSlug={site.slug}
        eventType="referral_click"
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        Join ClickBaitPays <span aria-hidden="true">↗</span>
      </TrackedLink>
    </main>
  );
}

export default async function Home() {
  const surface = await requestSurface();
  if (surface === "marketing") redirect("/get-your-site");
  if (surface === "admin") redirect("/admin");
  return <SponsorSitePage />;
}

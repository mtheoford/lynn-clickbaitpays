import type { CSSProperties } from "react";
import type { Metadata } from "next";
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

const videoCards = [
  {
    title: "CBP introduction",
    image: "https://i.vimeocdn.com/video/2180934020-571137cdb14ff374c76cf4d3f2dba75212431898bba3a02a05b1187c3495ba86-d_295x166?region=us",
  },
  {
    title: "Income strategies",
    image: "https://i.vimeocdn.com/video/2180932614-2c1ab32ecf01a052ad89314e0ec1267e7232251b4bd6963394c7d15095f4587f-d_295x166?region=us",
  },
  {
    title: "Back-office tour",
    image: "https://i.vimeocdn.com/video/2181701812-191f55968a0ca9aea81275a9dece5b1b49400411dcfa04ac740d26c98d67eb38-d_295x166?region=us",
  },
];

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
          <div className="compact-device compact-device-back" aria-hidden="true">
            <div className="compact-window-bar"><i /><i /><i /><span /></div>
            <div className="compact-back-layout">
              <div className="compact-sidebar"><b /><b /><b /><b /></div>
              <div className="compact-back-content">
                <div className="compact-wave" />
                <div className="compact-back-cards"><i /><i /><i /></div>
                <div className="compact-back-lines"><b /><b /><b /></div>
              </div>
            </div>
          </div>

          <div className="compact-device compact-device-front">
            <div className="compact-window-bar"><i /><i /><i /><span /></div>
            <div className="compact-front-content">
              <div className="compact-front-wave" />
              <div className="compact-video-grid">
                {videoCards.map((video, index) => (
                  <article key={video.title} aria-label={video.title}>
                    <div
                      className="compact-video-thumb"
                      style={{ "--video-image": `url(${video.image})` } as CSSProperties}
                    >
                      <span aria-hidden="true">▶</span>
                    </div>
                    <div className="compact-video-meta"><i /><span><b /><b /></span></div>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </article>
                ))}
              </div>
            </div>
          </div>
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

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { localizedPath, type SiteLocale } from "@/lib/i18n";
import { defaultSponsorSite, siteUrl } from "@/lib/site-config";
import SignupDialog from "./SignupDialog";
import { SignupPageViewTracker, TrackedDemoLink } from "./SignupPageAnalytics";
import { salesCopy } from "./sales-copy";

export function salesMetadata(locale: SiteLocale): Metadata {
  const t = salesCopy[locale];
  return {
    title: t.title, description: t.description, robots: { index: true, follow: true },
    alternates: { canonical: localizedPath(locale, "/get-your-site"), languages: { en: "/get-your-site", fr: "/fr/get-your-site", de: "/de/get-your-site", "x-default": "/get-your-site" } },
    openGraph: { title: t.ogTitle, description: t.ogDescription, type: "website", locale: t.ogLocale, images: [{ url: t.ogImage, width: t.ogWidth, height: t.ogHeight }] },
    twitter: { card: "summary_large_image", title: t.twitterTitle, description: t.twitterDescription, images: [t.ogImage] },
  };
}

export type SalesSearchParams = Promise<{ source?: string; checkout?: string }>;

export default async function SalesPage({ searchParams, locale = "en" }: { searchParams: SalesSearchParams; locale?: SiteLocale }) {
  const params = await searchParams;
  const t = salesCopy[locale];
  const exampleUrl = new URL(siteUrl(defaultSponsorSite.slug));
  if (locale !== "en") exampleUrl.pathname = localizedPath(locale, exampleUrl.pathname.startsWith("/s/") ? exampleUrl.pathname : "/");
  const exampleSiteUrl = exampleUrl.toString();
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split(defaultSponsorSite.slug);
  const signupProps = { source: params.source, addressPrefix, addressSuffix, checkoutCanceled: params.checkout === "canceled", locale };
  const suffix = locale === "en" ? "" : `-${locale}`;

  return (
    <main className="cbp-offer" id="top" lang={locale}>
      <SignupPageViewTracker source={params.source} />
      <div className="cbp-offer-glow cbp-offer-glow-one" /><div className="cbp-offer-glow cbp-offer-glow-two" />
      <header className="cbp-offer-header">
        <Link href="#top" className="cbp-offer-brand" aria-label={t.brandLabel}><span aria-hidden="true">PN</span><div><strong>ProNeurs™</strong><small>{t.brand}</small></div></Link>
        <nav aria-label={t.navigation}>
          <TrackedDemoLink href={exampleSiteUrl} placement="header" source={params.source} target="_blank" rel="noopener noreferrer">{t.liveSite} <span aria-hidden="true">↗</span></TrackedDemoLink>
          <Link href={localizedPath(locale, "/manage")}>{t.login}</Link>
        </nav>
      </header>
      <section className="cbp-offer-hero" aria-labelledby="cbp-offer-title">
        <div className="cbp-offer-copy">
          <h1 id="cbp-offer-title"><span className="cbp-offer-title-line">{t.headlineStart}</span><span className="cbp-offer-title-brand">ClickBaitPays</span><span className="cbp-offer-title-line">{t.headlineMiddle}</span><span className="cbp-offer-title-line"><em>{t.headlineEnd}</em></span></h1>
          <p className="cbp-offer-lead">{t.lead}</p>
          <div className="cbp-offer-actions">
            <SignupDialog {...signupProps} dialogId={`hero-signup${suffix}`} triggerLabel={t.signup} analyticsPlacement="hero" />
            <TrackedDemoLink className="cbp-offer-demo-link" href={exampleSiteUrl} placement="hero" source={params.source} target="_blank" rel="noopener noreferrer"><span>{t.demo}</span><span className="cbp-offer-demo-icon" aria-hidden="true">↗</span></TrackedDemoLink>
          </div>
          <div className="cbp-offer-pricing" aria-label={t.pricing}>
            <div className="cbp-price-option"><span>{t.monthly}</span><strong>{t.monthlyPrice}<small>{t.perMonth}</small></strong><p>{t.billedMonthly}</p></div>
            <div className="cbp-price-option cbp-price-option-annual"><b>{t.bestValue}</b><span>{t.annual}</span><strong>{t.annualPrice}<small>{t.perYear}</small></strong><p>{t.savings}</p></div>
          </div>
          <p className="cbp-secure-checkout">{t.secure}</p>
        </div>
        <div className="cbp-offer-product" aria-label={t.previewLabel}>
          <figure className="cbp-product-browser">
            <div className="cbp-product-browser-bar"><span className="cbp-product-dots" aria-hidden="true"><i /><i /><i /></span><span className="cbp-product-address">{exampleSiteUrl.replace(/^https?:\/\//, "")}</span><span className="cbp-product-live"><i /> {t.liveExample}</span></div>
            <div className="cbp-product-screen"><Image src={t.previewImage} alt={t.previewAlt} fill priority sizes="(max-width: 760px) calc(100vw - 30px), (max-width: 1020px) 62vw, 60vw" /></div>
            <figcaption><div><span>{t.previewCaption}</span><strong>{t.previewTagline}</strong></div><TrackedDemoLink href={exampleSiteUrl} placement="product_preview" source={params.source} target="_blank" rel="noopener noreferrer" ariaLabel={t.openExample}>{t.openSite} <span aria-hidden="true">↗</span></TrackedDemoLink></figcaption>
          </figure>
          <p className="cbp-product-member-note"><span /> {t.memberNote}</p>
        </div>
      </section>
      <section className="cbp-offer-benefits" aria-labelledby="cbp-benefits-title">
        <div className="cbp-benefits-heading"><p>{t.benefitsEyebrow}</p><h2 id="cbp-benefits-title">{t.benefitsTitle}</h2></div>
        <div className="cbp-benefit-grid">{t.benefits.map((benefit, index) => <article key={index}><span>{String(index + 1).padStart(2, "0")}</span><h3>{benefit.title}</h3><p>{benefit.copy}</p></article>)}</div>
      </section>
      <section className="cbp-offer-close" aria-labelledby="cbp-close-title">
        <div><p>{t.closingEyebrow}</p><h2 id="cbp-close-title">{t.closingTitle}</h2></div>
        <div className="cbp-close-action">
          <div className="cbp-close-pricing" aria-label={t.pricing}>
            <div className="cbp-close-price-option"><span>{t.monthly}</span><strong>{t.monthlyPrice}<small>{t.perMonth}</small></strong><p>{t.billedMonthly}</p></div>
            <div className="cbp-close-price-option cbp-close-price-annual"><b>{t.bestValue}</b><span>{t.annual}</span><strong>{t.annualPrice}<small>{t.perYear}</small></strong><p>{t.savings}</p></div>
          </div>
          <SignupDialog {...signupProps} dialogId={`closing-signup${suffix}`} triggerLabel={t.signup} analyticsPlacement="closing" />
        </div>
      </section>
      <footer className="cbp-offer-footer"><p>{t.footer}</p><nav aria-label={t.legalLinks}><Link href={localizedPath(locale, "/terms")}>{t.terms}</Link><Link href={localizedPath(locale, "/privacy")}>{t.privacy}</Link><Link href={localizedPath(locale, "/refund-policy")}>{t.refunds}</Link></nav></footer>
    </main>
  );
}

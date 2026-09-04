import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ReferralSimulator from "./ReferralSimulator";
import { SiteViewTracker, TrackedLink } from "./SiteAnalytics";
import TestimonialGallery from "./TestimonialGallery";
import cbpMark from "../public/cbp-mark.png";
import {
  formatPhoneForDisplay,
  growthSignupUrl,
  localizeSponsorBio,
  phoneHref,
  requestSurface,
  resolveSponsorSite,
} from "@/lib/site-config";
import {
  DEFAULT_SITE_LOCALE,
  localizedGrowthSignupUrl,
  localizedPath,
  sponsorSitePath,
  type SiteLocale,
} from "@/lib/i18n";

export const dynamic = "force-dynamic";

const siteCopy = {
  en: {
    join: "Join ClickBaitPays",
    languageSelector: "Choose language",
    english: "EN",
    french: "FR",
    metadata: {
      demoTitle: "Your ClickBaitPays Replicated Site Preview",
      demoDescription:
        "Preview how your personalized ClickBaitPays replicated site can look and work.",
      title: (name: string) => `Join ClickBaitPays with ${name}`,
      description: (name: string) =>
        `Explore ClickBaitPays and get started with independent sponsor ${name}.`,
      image: "/og.png",
    },
    unavailable: {
      eyebrow: "Personal CBP Site",
      title: "This page is not currently available.",
      body: "The owner may be updating the page. Please check the address and try again later.",
      cta: "Get Your Personal CBP Site",
    },
    brand: {
      home: (name: string) => `CBP with ${name} home`,
      name: (name: string) => `CBP with ${name}`,
      demoSubtitle: "Replicated site preview",
      sponsorSubtitle: "Independent sponsor guide",
    },
    nav: {
      label: "Main navigation",
      strategy: "Income strategy",
      tour: "Member tour",
      stories: "Member stories",
      calculator: "Campaign calculator",
    },
    hero: {
      line1: "See how it works.",
      line2: "Understand the opportunity.",
      line3: "Decide with confidence.",
      secondaryCta: "See how it works",
      demoDisclosure:
        "Demo site. Join buttons open the neutral ClickBaitPays website; subscriber pages use the subscriber’s official referral link. ",
      sponsorDisclosure:
        "Independent affiliate site. If you join through a sponsor link, the sponsor may receive compensation. ",
      riskDisclosure:
        "Participation involves financial and cryptocurrency risk, and earnings are not guaranteed. ",
      disclosureLink: "Read the affiliate disclosure.",
    },
    welcomeVideo: {
      callout: "Start here · Welcome to ClickBaitPays",
      title: "Welcome to ClickBaitPays",
      heading: "Watch the overview",
      summary: "The fastest way to understand the opportunity",
    },
    momentum: {
      label: "What you will find",
      items: [
        "See how the platform works",
        "Explore campaign strategies",
        "Calculate your own scenarios",
      ],
    },
    strategy: {
      eyebrow: "01 · Explore the strategy",
      heading: "See how campaigns and referrals can work together.",
      videoLabel: "Featured · Income strategies",
      videoTitle: "ClickBaitPays income strategies",
      topics: ["Campaigns", "Staggering", "Direct referrals"],
      watch: "Watch now",
      summary:
        "This focused walkthrough explains the three-campaign approach, staggered timing, direct-referral commissions, and the choices members make when campaign value becomes available.",
    },
    transition: {
      next: "Next",
      label: "See the member dashboard",
    },
    tour: {
      eyebrow: "02 · Tour the dashboard",
      heading: "Know the dashboard.",
      videoTitle: "ClickBaitPays back-office walkthrough",
      label: "Member tour",
      title: "Back-office walkthrough",
      summary:
        "See campaigns, clicks, balances, referrals, deposits, and withdrawals.",
    },
    testimonialsHeading: "What members are saying.",
    resourcesHeading: "Helpful resources",
    resourcesEyebrow: "Official reading",
    resourcesTitle: "Worth opening.",
    resources: [
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
    ],
    faqEyebrow: "Common questions",
    faqTitle: "Straight answers.",
    faqs: [
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
    ],
    sponsor: {
      demoEyebrow: "Your profile goes here",
      eyebrow: "Your independent sponsor",
      heading: (name: string) => `Start with ${name}.`,
      demoBio:
        "Your introduction will appear here, giving visitors a clear and welcoming way to learn about ClickBaitPays with you.",
      growthPrompt: "Want a page like this?",
      growthCta: "Get Your Personal CBP Site",
    },
    footer: {
      disclosure:
        "Independent affiliate site—not operated by ClickBaitPays. Participation involves cryptocurrency and financial risk. Earnings are not guaranteed. Review official terms before participating.",
      proneursTerms: "ProNeurs™ terms",
      proneursPrivacy: "ProNeurs™ privacy",
      cbpTerms: "ClickBaitPays terms",
      affiliateDisclosure: "Affiliate disclosure",
      contact: (name: string) => `Contact ${name}`,
    },
  },
  fr: {
    join: "Rejoindre ClickBaitPays",
    languageSelector: "Choisir la langue",
    english: "EN",
    french: "FR",
    metadata: {
      demoTitle: "Aperçu de votre site ClickBaitPays personnalisé",
      demoDescription:
        "Découvrez à quoi peut ressembler votre site ClickBaitPays personnalisé et comment il fonctionne.",
      title: (name: string) => `Rejoignez ClickBaitPays avec ${name}`,
      description: (name: string) =>
        `Découvrez ClickBaitPays et lancez-vous avec votre sponsor indépendant ${name}.`,
      image: "/og-fr.png",
    },
    unavailable: {
      eyebrow: "Site CBP personnel",
      title: "Cette page n’est pas disponible pour le moment.",
      body: "Son propriétaire est peut-être en train de la mettre à jour. Vérifiez l’adresse, puis réessayez plus tard.",
      cta: "Obtenir votre site CBP personnel",
    },
    brand: {
      home: (name: string) => `Accueil de CBP avec ${name}`,
      name: (name: string) => `CBP avec ${name}`,
      demoSubtitle: "Aperçu du site personnalisé",
      sponsorSubtitle: "Guide de votre sponsor indépendant",
    },
    nav: {
      label: "Navigation principale",
      strategy: "Stratégie de revenus",
      tour: "Espace membre",
      stories: "Témoignages",
      calculator: "Calculateur de campagnes",
    },
    hero: {
      line1: "Découvrez son fonctionnement.",
      line2: "Comprenez l’opportunité.",
      line3: "Décidez en toute confiance.",
      secondaryCta: "Voir comment cela fonctionne",
      demoDisclosure:
        "Site de démonstration. Les boutons d’inscription ouvrent le site ClickBaitPays sans parrain; les pages des abonnés utilisent leur lien de parrainage officiel. ",
      sponsorDisclosure:
        "Site d’affiliation indépendant. Si vous vous inscrivez à partir d’un lien de parrainage, le sponsor peut recevoir une rémunération. ",
      riskDisclosure:
        "La participation comporte des risques financiers et liés aux cryptomonnaies. Aucun gain n’est garanti. ",
      disclosureLink: "Consulter l’information sur l’affiliation.",
    },
    welcomeVideo: {
      callout: "Commencez ici · Bienvenue sur ClickBaitPays",
      title: "Bienvenue sur ClickBaitPays (vidéo pouvant être en anglais)",
      heading: "Voir la présentation",
      summary:
        "Un aperçu rapide de l’opportunité. L’audio peut être en anglais; les sous-titres français sont demandés lorsqu’ils sont disponibles.",
    },
    momentum: {
      label: "Ce que vous allez découvrir",
      items: [
        "Comprendre le fonctionnement de la plateforme",
        "Explorer des stratégies de campagne",
        "Calculer vos propres scénarios",
      ],
    },
    strategy: {
      eyebrow: "01 · Explorer la stratégie",
      heading: "Découvrez comment les campagnes et les parrainages peuvent agir ensemble.",
      videoLabel: "À la une · Stratégies de revenus",
      videoTitle: "Stratégies de revenus ClickBaitPays (vidéo pouvant être en anglais)",
      topics: ["Campagnes", "Échelonnement", "Parrainages directs"],
      watch: "Voir la vidéo",
      summary:
        "Cette présentation explique l’approche à trois campagnes, leur démarrage échelonné, les commissions de parrainage direct et les choix possibles lorsque la valeur d’une campagne devient disponible. L’audio peut être en anglais; les sous-titres français sont demandés lorsqu’ils sont disponibles.",
    },
    transition: {
      next: "Étape suivante",
      label: "Découvrir l’espace membre",
    },
    tour: {
      eyebrow: "02 · Visiter le tableau de bord",
      heading: "Maîtrisez le tableau de bord.",
      videoTitle: "Visite de l’espace membre ClickBaitPays (vidéo pouvant être en anglais)",
      label: "Visite de l’espace membre",
      title: "Découverte du tableau de bord",
      summary:
        "Repérez vos campagnes, clics, soldes, parrainages, dépôts et retraits. L’audio peut être en anglais; les sous-titres français sont demandés lorsqu’ils sont disponibles.",
    },
    testimonialsHeading: "Ce qu’en disent les membres.",
    resourcesHeading: "Ressources utiles",
    resourcesEyebrow: "Documentation",
    resourcesTitle: "À consulter.",
    resources: [
      {
        title: "Bien démarrer",
        eyebrow: "Guide pas à pas en français",
        href: "/docs/guide-demarrage-clickbaitpays-fr.pdf",
      },
      {
        title: "FAQ officielle",
        eyebrow: "Traduction française · règles et frais",
        href: "/fr/faq",
      },
    ],
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Des réponses claires.",
    faqs: [
      {
        question: "L’inscription est-elle gratuite ?",
        answer:
          "Les documents publics du programme font la distinction entre la création d’un compte et l’activité de campagne payante. Consultez la FAQ officielle et le tableau de bord pour connaître les coûts en vigueur avant tout paiement.",
      },
      {
        question: "Dois-je parrainer d’autres personnes ?",
        answer:
          "ClickBaitPays indique actuellement que le parrainage est facultatif. Vérifiez les règles en vigueur dans les documents officiels avant de participer.",
      },
      {
        question: "Quand puis-je retirer mes gains ?",
        answer:
          "Les délais, minimums, frais, conditions d’admissibilité et modalités de traitement des retraits peuvent changer. La FAQ officielle et le tableau de bord membre restent les sources à consulter pour les informations à jour.",
      },
    ],
    sponsor: {
      demoEyebrow: "Votre profil apparaîtra ici",
      eyebrow: "Votre sponsor indépendant",
      heading: (name: string) => `Commencez avec ${name}.`,
      demoBio:
        "Votre présentation apparaîtra ici afin d’offrir aux visiteurs un accueil clair et convivial pour découvrir ClickBaitPays avec vous.",
      growthPrompt: "Vous souhaitez une page comme celle-ci ?",
      growthCta: "Obtenir votre site CBP personnel",
    },
    footer: {
      disclosure:
        "Site d’affiliation indépendant, non exploité par ClickBaitPays. La participation comporte des risques financiers et liés aux cryptomonnaies. Aucun gain n’est garanti. Consultez les conditions officielles avant de participer.",
      proneursTerms: "Conditions de ProNeurs™",
      proneursPrivacy: "Confidentialité de ProNeurs™",
      cbpTerms: "Conditions de ClickBaitPays (anglais)",
      affiliateDisclosure: "Information sur l’affiliation",
      contact: (name: string) => `Contacter ${name}`,
    },
  },
} satisfies Record<SiteLocale, object>;

function videoUrl(videoId: string, locale: SiteLocale): string {
  if (locale === "en") return `https://www.youtube.com/embed/${videoId}`;
  return `https://www.youtube.com/embed/${videoId}?cc_load_policy=1&cc_lang_pref=fr&hl=fr`;
}

function JoinButton({
  href,
  siteSlug,
  label,
}: {
  href: string;
  siteSlug: string;
  label: string;
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

export async function generateSponsorMetadata({
  locale = DEFAULT_SITE_LOCALE,
  slug,
}: {
  locale?: SiteLocale;
  slug?: string;
} = {}): Promise<Metadata> {
  const site = await resolveSponsorSite(slug);
  const copy = siteCopy[locale];
  const title = site.isDemo
    ? copy.metadata.demoTitle
    : copy.metadata.title(site.displayName);
  const description = site.isDemo
    ? copy.metadata.demoDescription
    : copy.metadata.description(site.displayName);
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      languages: {
        "en-US": sponsorSitePath("en", slug ? site.slug : undefined),
        "fr-FR": sponsorSitePath("fr", slug ? site.slug : undefined),
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: [locale === "fr" ? "en_US" : "fr_FR"],
      images: [{ url: copy.metadata.image, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [copy.metadata.image],
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return generateSponsorMetadata();
}

export async function SponsorSitePage({
  slug,
  locale = DEFAULT_SITE_LOCALE,
}: {
  slug?: string;
  locale?: SiteLocale;
}) {
  const site = await resolveSponsorSite(slug);
  const copy = siteCopy[locale];
  const englishHref = sponsorSitePath("en", slug ? site.slug : undefined);
  const frenchHref = sponsorSitePath("fr", slug ? site.slug : undefined);
  const growthUrl = localizedGrowthSignupUrl(growthSignupUrl(site.slug), locale);

  if (site.status !== "active" && site.status !== "past_due") {
    return (
      <main className="site-unavailable" lang={locale}>
        <div>
          <BrandMark />
          <p className="eyebrow">{copy.unavailable.eyebrow}</p>
          <h1>{copy.unavailable.title}</h1>
          <p>{copy.unavailable.body}</p>
          <a className="join-button" href={growthUrl}>
            {copy.unavailable.cta} <i aria-hidden="true">↗</i>
          </a>
        </div>
      </main>
    );
  }

  return (
    <main id="top" lang={locale}>
      <SiteViewTracker siteSlug={site.slug} />
      <header className="site-header">
        <a className="brand" href="#top" aria-label={copy.brand.home(site.displayName)}>
          <BrandMark />
          <span>
            <strong>{copy.brand.name(site.displayName)}</strong>
            <small>{site.isDemo ? copy.brand.demoSubtitle : copy.brand.sponsorSubtitle}</small>
          </span>
        </a>
        <nav aria-label={copy.nav.label}>
          <a href="#how">{copy.nav.strategy}</a>
          <a href="#learn">{copy.nav.tour}</a>
          <a href="#experiences">{copy.nav.stories}</a>
          <a className="nav-calculator-link" href="#calculator">
            {copy.nav.calculator}
          </a>
          <span className="language-switcher" aria-label={copy.languageSelector} role="group">
            <a
              href={englishHref}
              hrefLang="en"
              lang="en"
              aria-current={locale === "en" ? "page" : undefined}
              aria-label="View this page in English"
            >
              {copy.english}
            </a>
            <span aria-hidden="true">/</span>
            <a
              href={frenchHref}
              hrefLang="fr"
              lang="fr"
              aria-current={locale === "fr" ? "page" : undefined}
              aria-label="Afficher cette page en français"
            >
              {copy.french}
            </a>
          </span>
          <JoinButton href={site.referralUrl} siteSlug={site.slug} label={copy.join} />
        </nav>
      </header>

      <section className="hero">
        <div className="hero-aura hero-aura-one" />
        <div className="hero-aura hero-aura-two" />

        <div className="hero-copy">
          <h1>
            {copy.hero.line1}
            <br />
            {copy.hero.line2}
            <br />
            <em>{copy.hero.line3}</em>
          </h1>
          <div className="hero-actions">
            <JoinButton href={site.referralUrl} siteSlug={site.slug} label={copy.join} />
            <a className="text-link" href="#how">
              {copy.hero.secondaryCta} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="hero-disclosure">
            {site.isDemo
              ? copy.hero.demoDisclosure
              : copy.hero.sponsorDisclosure}
            {copy.hero.riskDisclosure}
            <a href={localizedPath(locale, "/affiliate-disclosure")}>
              {copy.hero.disclosureLink}
            </a>
          </p>
        </div>

        <div className="welcome-feature">
          <div className="video-callout">
            <span className="pulse-dot" />
            {copy.welcomeVideo.callout}
          </div>
          <div className="hero-video">
            <iframe
              src={videoUrl("PhTIPCzqMjw", locale)}
              title={copy.welcomeVideo.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-caption">
            <div>
              <strong>{copy.welcomeVideo.heading}</strong>
              <span>{copy.welcomeVideo.summary}</span>
            </div>
            <span className="watch-cue" aria-hidden="true">▶</span>
          </div>
        </div>
      </section>

      <section className="momentum-strip" aria-label={copy.momentum.label}>
        <div className="momentum-track">
          {[...copy.momentum.items, ...copy.momentum.items].map((item, index) => (
            <span
              key={`${item}-${index}`}
              aria-hidden={index >= copy.momentum.items.length || undefined}
            >
              <b>✓</b> {item}
            </span>
          ))}
        </div>
      </section>

      <div className="journey-flow">
        <section className="section how-section" id="how">
          <div className="strategy-feature">
            <div className="strategy-heading-wide">
              <p className="eyebrow">{copy.strategy.eyebrow}</p>
              <h2>{copy.strategy.heading}</h2>
            </div>

            <div className="strategy-stage">
              <div className="strategy-video-wrap">
                <div className="strategy-video-label">
                  <span className="pulse-dot" />
                  {copy.strategy.videoLabel}
                </div>
                <div className="strategy-video">
                  <iframe
                    src={videoUrl("YFbW5RSLOQM", locale)}
                    title={copy.strategy.videoTitle}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="strategy-video-footer">
                  <span>{copy.strategy.topics[0]}</span>
                  <i aria-hidden="true">•</i>
                  <span>{copy.strategy.topics[1]}</span>
                  <i aria-hidden="true">•</i>
                  <span>{copy.strategy.topics[2]}</span>
                  <strong>{copy.strategy.watch} <b aria-hidden="true">▶</b></strong>
                </div>
              </div>
              <div className="strategy-support">
                <p>{copy.strategy.summary}</p>
                <div className="strategy-support-actions">
                  <JoinButton href={site.referralUrl} siteSlug={site.slug} label={copy.join} />
                  <ReferralSimulator locale={locale} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <a className="section-transition" href="#learn">
          <span>{copy.transition.next}</span>
          <strong>{copy.transition.label}</strong>
          <i aria-hidden="true">↓</i>
        </a>

        <section className="section learn-section" id="learn">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">{copy.tour.eyebrow}</p>
              <h2>{copy.tour.heading}</h2>
            </div>
          </div>

          <div className="secondary-videos single-video">
            <article>
              <div className="small-video">
                <iframe
                  src={videoUrl("JQEnm6I37dI", locale)}
                  title={copy.tour.videoTitle}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="small-video-copy">
                <span>{copy.tour.label}</span>
                <h3>{copy.tour.title}</h3>
                <p>{copy.tour.summary}</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="section testimonial-section" id="experiences">
        <div className="testimonial-heading">
          <h2>{copy.testimonialsHeading}</h2>
        </div>
        <TestimonialGallery locale={locale} />
      </section>

      <section className="section decision-section">
        <div className="decision-hub">
          <div className="decision-heading">
            <h2>{copy.resourcesHeading}</h2>
          </div>

          <div className="decision-grid">
            <div className="resource-panel">
              <p className="eyebrow">{copy.resourcesEyebrow}</p>
              <h3>{copy.resourcesTitle}</h3>
              <div className="resource-list">
                {copy.resources.map((resource) => (
                  <a
                    href={resource.href}
                    target={resource.href === "/fr/faq" ? undefined : "_blank"}
                    rel={resource.href === "/fr/faq" ? undefined : "noopener noreferrer"}
                    key={resource.title}
                  >
                    <span>
                      <small>{resource.eyebrow}</small>
                      <strong>{resource.title}</strong>
                    </span>
                    <i aria-hidden="true">↗</i>
                  </a>
                ))}
              </div>
            </div>

            <div className="faq-panel" id="questions">
              <p className="eyebrow">{copy.faqEyebrow}</p>
              <h3>{copy.faqTitle}</h3>
              <div className="faq-list">
                {copy.faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}<i aria-hidden="true">+</i></summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sponsor-section">
        <div className="sponsor-copy">
          <div className="avatar">{site.initials}</div>
          <div>
            <p className="eyebrow">
              {site.isDemo ? copy.sponsor.demoEyebrow : copy.sponsor.eyebrow}
            </p>
            <h2>{copy.sponsor.heading(site.displayName)}</h2>
            <p>{localizeSponsorBio(site.bio, site.displayName, locale)}</p>
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
                  {formatPhoneForDisplay(site.publicPhone, locale)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="closing-actions">
          <JoinButton href={site.referralUrl} siteSlug={site.slug} label={copy.join} />
          <TrackedLink className="replicated-site-button" href={growthUrl} siteSlug={site.slug} eventType="growth_click">
            <span>
              <small>{copy.sponsor.growthPrompt}</small>
              <strong>{copy.sponsor.growthCta}</strong>
            </span>
            <i aria-hidden="true">↗</i>
          </TrackedLink>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <BrandMark />
          <span>
            <strong>{copy.brand.name(site.displayName)}</strong>
            <small>{site.isDemo ? copy.brand.demoSubtitle : copy.brand.sponsorSubtitle}</small>
          </span>
        </div>
        <p>{copy.footer.disclosure}</p>
        <div className="footer-links">
          <a href={localizedPath(locale, "/terms")}>{copy.footer.proneursTerms}</a>
          <a href={localizedPath(locale, "/privacy")}>{copy.footer.proneursPrivacy}</a>
          <a href="https://clickbaitpays.me/terms.php" hrefLang="en" target="_blank" rel="noopener noreferrer">
            {copy.footer.cbpTerms}
          </a>
          <a href={localizedPath(locale, "/affiliate-disclosure")}>
            {copy.footer.affiliateDisclosure}
          </a>
          {site.showEmail ? (
            <a href={`mailto:${site.publicEmail}`}>{copy.footer.contact(site.displayName)}</a>
          ) : null}
          <TrackedLink href={growthUrl} siteSlug={site.slug} eventType="growth_click">
            {copy.sponsor.growthCta}
          </TrackedLink>
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
        {copy.join} <span aria-hidden="true">↗</span>
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

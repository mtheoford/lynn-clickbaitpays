import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { defaultSponsorSite, siteUrl } from "@/lib/site-config";
import SignupDialog from "@/app/get-your-site/SignupDialog";
import {
  SignupPageViewTracker,
  TrackedDemoLink,
} from "@/app/get-your-site/SignupPageAnalytics";

export const metadata: Metadata = {
  title: "Créez votre site ClickBaitPays personnalisé",
  description:
    "Développez votre activité ClickBaitPays avec un site personnalisé comprenant votre lien de parrainage, des vidéos, des ressources et un calculateur interactif.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/fr/get-your-site",
    languages: { en: "/get-your-site", fr: "/fr/get-your-site" },
  },
  openGraph: {
    title: "Votre site ClickBaitPays personnalisé, prêt à être partagé.",
    description:
      "Un site professionnel avec votre lien de parrainage et des ressources ClickBaitPays utiles.",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/og-fr.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Créez votre site ClickBaitPays personnalisé.",
    description: "Votre espace CBP personnalisé, prêt à partager.",
    images: ["/og-fr.png"],
  },
};

const benefits = [
  {
    number: "01",
    title: "Personnalisé pour vous",
    copy: "Votre nom, vos coordonnées et votre lien de parrainage officiel, présentés de manière professionnelle.",
  },
  {
    number: "02",
    title: "Prêt à partager",
    copy: "Offrez à vos contacts un seul espace soigné pour les vidéos, les ressources et les informations utiles.",
  },
  {
    number: "03",
    title: "Calculateur de campagnes intégré",
    copy: "Vos visiteurs peuvent modéliser une, deux ou trois campagnes, des scénarios de parrainage et différents parcours.",
  },
  {
    number: "04",
    title: "Conçu pour vous aider à progresser",
    copy: "Partagez un lien mémorable dans vos messages, e-mails, publications et conversations ClickBaitPays.",
  },
];

function frenchSponsorUrl(value: string): string {
  const url = new URL(value);
  url.pathname = url.pathname.startsWith("/s/") ? `/fr${url.pathname}` : "/fr";
  return url.toString();
}

export default async function FrenchGetYourSitePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const exampleSiteUrl = frenchSponsorUrl(siteUrl(defaultSponsorSite.slug));
  const [addressPrefix, addressSuffix = ""] = exampleSiteUrl.split(defaultSponsorSite.slug);
  const englishOfferHref = params.source
    ? `/get-your-site?source=${encodeURIComponent(params.source)}`
    : "/get-your-site";
  const signupProps = {
    source: params.source,
    addressPrefix,
    addressSuffix,
    checkoutCanceled: params.checkout === "canceled",
    locale: "fr" as const,
  };

  return (
    <main className="cbp-offer" id="top" lang="fr">
      <SignupPageViewTracker source={params.source} />
      <div className="cbp-offer-glow cbp-offer-glow-one" />
      <div className="cbp-offer-glow cbp-offer-glow-two" />

      <header className="cbp-offer-header">
        <Link href="#top" className="cbp-offer-brand" aria-label="Accueil des sites CBP personnalisés ProNeurs">
          <span aria-hidden="true">PN</span>
          <div>
            <strong>ProNeurs™</strong>
            <small>Sites ClickBaitPays personnalisés</small>
          </div>
        </Link>
        <nav aria-label="Navigation de la page">
          <TrackedDemoLink href={exampleSiteUrl} placement="header" source={params.source} target="_blank" rel="noopener noreferrer">
            Voir un site en direct <span aria-hidden="true">↗</span>
          </TrackedDemoLink>
          <Link href="/fr/manage">Connexion client</Link>
          <Link href={englishOfferHref} hrefLang="en" lang="en">EN</Link>
        </nav>
      </header>

      <section className="cbp-offer-hero" aria-labelledby="cbp-offer-title">
        <div className="cbp-offer-copy">
          <h1 id="cbp-offer-title">
            <span className="cbp-offer-title-line">Donnez de l’élan à votre</span>
            <span className="cbp-offer-title-brand">ClickBaitPays</span>
            <span className="cbp-offer-title-line">grâce à un</span>
            <span className="cbp-offer-title-line"><em>site personnalisé</em></span>
          </h1>
          <p className="cbp-offer-lead">
            Votre espace professionnel, personnalisé avec votre lien de parrainage, des vidéos,
            des ressources et un calculateur interactif que vos visiteurs peuvent utiliser pour
            explorer le potentiel des campagnes.
          </p>

          <div className="cbp-offer-actions">
            <SignupDialog
              {...signupProps}
              dialogId="hero-signup-fr"
              triggerLabel="Créer mon site CBP personnalisé"
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
              <span>Voir un site personnalisé</span>
              <span className="cbp-offer-demo-icon" aria-hidden="true">↗</span>
            </TrackedDemoLink>
          </div>

          <div className="cbp-offer-pricing" aria-label="Tarifs d’abonnement en dollars américains">
            <div className="cbp-price-option">
              <span>Mensuel</span>
              <strong>9 $ US<small>/mois</small></strong>
              <p>Facturé chaque mois</p>
            </div>
            <div className="cbp-price-option cbp-price-option-annual">
              <b>Meilleur tarif · 27 % d’économie</b>
              <span>Annuel</span>
              <strong>79 $ US<small>/an</small></strong>
              <p>Économisez 29 $ US par an</p>
            </div>
          </div>
          <p className="cbp-secure-checkout">Paiement sécurisé par Stripe</p>
        </div>

        <div className="cbp-offer-product" aria-label="Aperçu d’un site ClickBaitPays personnalisé">
          <figure className="cbp-product-browser">
            <div className="cbp-product-browser-bar">
              <span className="cbp-product-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="cbp-product-address">{exampleSiteUrl.replace(/^https?:\/\//, "")}</span>
              <span className="cbp-product-live"><i /> Exemple en direct</span>
            </div>
            <div className="cbp-product-screen">
              <Image
                src="/clickbaitpays-replicated-site-preview-fr.jpg"
                alt="Aperçu visuel de la mise en page du site de parrainage ClickBaitPays"
                fill
                priority
                sizes="(max-width: 760px) calc(100vw - 30px), (max-width: 1020px) 62vw, 60vw"
              />
            </div>
            <figcaption>
              <div><span>Site personnalisé</span><strong>Professionnel dès le premier clic.</strong></div>
              <TrackedDemoLink href={exampleSiteUrl} placement="product_preview" source={params.source} target="_blank" rel="noopener noreferrer" ariaLabel="Ouvrir l’exemple de site personnalisé">
                Ouvrir le site <span aria-hidden="true">↗</span>
              </TrackedDemoLink>
            </figcaption>
          </figure>
          <p className="cbp-product-member-note"><span /> Conçu pour les membres ClickBaitPays</p>
        </div>
      </section>

      <section className="cbp-offer-benefits" aria-labelledby="cbp-benefits-title">
        <div className="cbp-benefits-heading">
          <p>Votre espace CBP personnalisé.</p>
          <h2 id="cbp-benefits-title">Un seul site pour donner de la force à chaque conversation.</h2>
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
          <p>Votre opportunité CBP mérite un suivi plus convaincant.</p>
          <h2 id="cbp-close-title">Mettez votre site personnalisé au travail.</h2>
        </div>
        <div className="cbp-close-action">
          <div className="cbp-close-pricing" aria-label="Tarifs d’abonnement en dollars américains">
            <div className="cbp-close-price-option">
              <span>Mensuel</span><strong>9 $ US<small>/mois</small></strong><p>Facturé chaque mois</p>
            </div>
            <div className="cbp-close-price-option cbp-close-price-annual">
              <b>Meilleur tarif · 27 % d’économie</b><span>Annuel</span><strong>79 $ US<small>/an</small></strong><p>Économisez 29 $ US par an</p>
            </div>
          </div>
          <SignupDialog
            {...signupProps}
            dialogId="closing-signup-fr"
            triggerLabel="Créer mon site CBP personnalisé"
            analyticsPlacement="closing"
          />
        </div>
      </section>

      <footer className="cbp-offer-footer">
        <p>Service de site web indépendant pour les membres ClickBaitPays. Ni affilié ni approuvé par ClickBaitPays.</p>
        <nav aria-label="Liens juridiques">
          <Link href="/fr/terms">Conditions</Link>
          <Link href="/fr/privacy">Confidentialité</Link>
          <Link href="/fr/refund-policy">Remboursements</Link>
        </nav>
      </footer>
    </main>
  );
}

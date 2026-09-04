import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { analyticsEvents, sites, subscriptions, users } from "@/db/schema";
import { customerSignOutPath, getSignedInCustomer } from "@/lib/customer-auth";
import type { SiteLocale } from "@/lib/i18n";
import { customerManagePath } from "@/lib/magic-link-flow";
import { localizeSponsorBio, siteUrl } from "@/lib/site-config";
import BillingPortalButton from "./BillingPortalButton";
import ManageSiteForm from "./ManageSiteForm";
import ShareTools from "./ShareTools";

const siteStatusFr: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  past_due: "Paiement en retard",
  suspended: "Suspendu",
  canceled: "Résilié",
  deleted: "Supprimé",
};

const planFr: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  complimentary: "Offert",
};

const subscriptionStatusFr: Record<string, string> = {
  active: "Actif",
  trialing: "Période d’essai",
  incomplete: "Paiement incomplet",
  incomplete_expired: "Paiement expiré",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  unpaid: "Impayé",
  paused: "En pause",
};

function translatedValue(
  value: string | null,
  translations: Record<string, string>,
  fallback: string,
): string {
  if (!value) return fallback;
  return translations[value] ?? value.replaceAll("_", " ");
}

function localizedPublicUrl(slug: string, locale: SiteLocale): string {
  const url = new URL(siteUrl(slug));
  if (locale === "fr") url.pathname = `/fr/s/${encodeURIComponent(slug)}`;
  return url.toString();
}

export default async function CustomerManagePage({
  locale = "en",
}: {
  locale?: SiteLocale;
}) {
  const isFrench = locale === "fr";
  const signedIn = await getSignedInCustomer();
  if (!signedIn) redirect(customerManagePath(locale, "sign-in"));
  const { identity, customer } = signedIn;
  const db = await getDb();
  const [account] = await db
    .select({
      userId: users.id,
      loginEmail: users.email,
      stripeCustomerId: users.stripeCustomerId,
      siteId: sites.id,
      slug: sites.slug,
      displayName: sites.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      fullName: users.name,
      companyName: sites.companyName,
      displayNameType: sites.displayNameType,
      publicEmail: sites.publicEmail,
      publicPhone: sites.publicPhone,
      showEmail: sites.showEmail,
      showPhone: sites.showPhone,
      bio: sites.bio,
      referralUrl: sites.referralUrl,
      status: sites.status,
      plan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
    })
    .from(users)
    .innerJoin(sites, eq(sites.userId, users.id))
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .where(eq(users.id, customer.id))
    .limit(1);

  if (!account) {
    return (
      <main className="admin-access-page" lang={isFrench ? "fr" : undefined}>
        <div>
          <p className="eyebrow">{isFrench ? "Sites CBP personnels" : "Personal CBP Sites"}</p>
          <h1>{isFrench
            ? "Nous n’avons trouvé aucun site associé à cette adresse e-mail."
            : "We couldn’t find a site for this email."}</h1>
          <p>{isFrench
            ? "Connectez-vous avec l’adresse e-mail utilisée lors de l’achat ou contactez l’assistance ProNeurs™ pour relier votre compte."
            : "Sign in with the same email address used during purchase, or contact ProNeurs™ support for help connecting your account."}</p>
          <Link href={customerManagePath(locale, "sign-in")}>
            {isFrench ? "Revenir à la connexion" : "Return to sign in"}
          </Link>
        </div>
      </main>
    );
  }

  const metricRows = await db
    .select({ eventType: analyticsEvents.eventType, total: count() })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.siteId, account.siteId))
    .groupBy(analyticsEvents.eventType);
  const metric = (eventType: string) => metricRows.find((row) => row.eventType === eventType)?.total ?? 0;
  const publicUrl = localizedPublicUrl(account.slug, locale);

  return (
    <main className="manage-page" lang={isFrench ? "fr" : undefined}>
      <header className="manage-header">
        <div>
          <span>PN</span>
          <div>
            <strong>{isFrench ? "Sites CBP personnels" : "Personal CBP Sites"}</strong>
            <small>{isFrench ? "Espace client" : "Customer account"}</small>
          </div>
        </div>
        <div>
          <Link href={isFrench ? "/manage" : "/fr/manage"} hrefLang={isFrench ? "en" : "fr"}>
            {isFrench ? "English" : "Français"}
          </Link>
          <span>{identity.email}</span>
          <form action={customerSignOutPath(locale)} method="post">
            <button type="submit">{isFrench ? "Se déconnecter" : "Sign out"}</button>
          </form>
        </div>
      </header>

      <section className="manage-welcome">
        <div>
          <p className="eyebrow">{isFrench ? "Votre espace de partage" : "Your sharing headquarters"}</p>
          <h1>{isFrench ? "Bienvenue" : "Welcome"}, {account.displayName}.</h1>
          <p>{isFrench
            ? "Gardez vos informations de sponsor à jour, partagez votre page et découvrez comment les visiteurs interagissent avec elle."
            : "Keep your sponsor information current, share your page, and see how visitors are engaging."}</p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer">
          {isFrench ? "Voir la page publique" : "View public page"} ↗
        </a>
      </section>

      <section className="manage-site-card">
        <div>
          <small>{isFrench ? "Votre adresse publique" : "Your public address"}</small>
          <strong>{publicUrl}</strong>
          <span className={`status-pill status-${account.status}`}>
            {isFrench ? siteStatusFr[account.status] : account.status.replace("_", " ")}
          </span>
        </div>
        <ShareTools url={publicUrl} displayName={account.displayName} locale={locale} />
      </section>

      <section className="manage-metric-grid" aria-label={isFrench ? "Activité du site" : "Site activity"}>
        <article>
          <span>{isFrench ? "Vues de la page" : "Page views"}</span>
          <strong>{metric("page_view")}</strong>
          <small>{isFrench ? "Visites enregistrées" : "Recorded visits"}</small>
        </article>
        <article>
          <span>{isFrench ? "Clics de parrainage" : "Referral clicks"}</span>
          <strong>{metric("referral_click")}</strong>
          <small>{isFrench ? "Clics vers ClickBaitPays" : "Clicks to ClickBaitPays"}</small>
        </article>
        <article>
          <span>{isFrench ? "Intérêt pour un site" : "Site-interest clicks"}</span>
          <strong>{metric("growth_click")}</strong>
          <small>{isFrench ? "Visiteurs ayant demandé leur propre site" : "Visitors requesting their own site"}</small>
        </article>
      </section>

      <section className="manage-content-grid">
        <ManageSiteForm
          locale={locale}
          initial={{
            firstName: account.firstName ?? account.fullName,
            lastName: account.lastName ?? "",
            companyName: account.companyName ?? "",
            displayNameType: account.displayNameType,
            publicEmail: account.publicEmail,
            publicPhone: account.publicPhone,
            showEmail: account.showEmail,
            showPhone: account.showPhone,
            bio: localizeSponsorBio(account.bio, account.displayName, locale),
            referralUrl: account.referralUrl,
          }}
        />

        <aside className="manage-account-panel">
          <div>
            <span>{isFrench ? "Abonnement" : "Subscription"}</span>
            <strong>{isFrench
              ? translatedValue(account.plan, planFr, "Inactif")
              : account.plan ?? "Not active"}</strong>
            <small>{isFrench
              ? translatedValue(account.subscriptionStatus, subscriptionStatusFr, "Aucun abonnement Stripe n’est associé.")
              : account.subscriptionStatus ?? "No Stripe subscription is connected."}</small>
          </div>
          <BillingPortalButton
            enabled={Boolean(account.stripeCustomerId && account.plan)}
            locale={locale}
          />
          <p>{isFrench
            ? "Les modifications de facturation sont effectuées de manière sécurisée sur Stripe. ProNeurs™ n’affiche ni ne conserve jamais les données de votre carte bancaire."
            : "Billing changes are completed securely on Stripe. ProNeurs™ never displays or stores your payment-card details."}</p>
        </aside>
      </section>
    </main>
  );
}

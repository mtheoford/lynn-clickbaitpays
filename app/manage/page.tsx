import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { analyticsEvents, sites, subscriptions, users } from "@/db/schema";
import { customerSignOutPath, getSignedInCustomer } from "@/lib/customer-auth";
import { siteUrl } from "@/lib/site-config";
import ManageSiteForm from "./ManageSiteForm";
import ShareTools from "./ShareTools";
import BillingPortalButton from "./BillingPortalButton";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const signedIn = await getSignedInCustomer();
  if (!signedIn) redirect("/manage/sign-in");
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
      <main className="admin-access-page">
        <div>
          <p className="eyebrow">Personal CBP Sites</p>
          <h1>We couldn’t find a site for this email.</h1>
          <p>Sign in with the same email address used during purchase, or contact ProNeurs™ support for help connecting your account.</p>
          <Link href="/manage/sign-in">Return to sign in</Link>
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
  const publicUrl = siteUrl(account.slug);

  return (
    <main className="manage-page">
      <header className="manage-header">
        <div><span>PN</span><div><strong>Personal CBP Sites</strong><small>Customer account</small></div></div>
        <div>
          <span>{identity.email}</span>
          <form action={customerSignOutPath()} method="post"><button type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="manage-welcome">
        <div><p className="eyebrow">Your sharing headquarters</p><h1>Welcome, {account.displayName}.</h1><p>Keep your sponsor information current, share your page, and see how visitors are engaging.</p></div>
        <a href={publicUrl} target="_blank" rel="noreferrer">View public page ↗</a>
      </section>

      <section className="manage-site-card">
        <div><small>Your public address</small><strong>{publicUrl}</strong><span className={`status-pill status-${account.status}`}>{account.status.replace("_", " ")}</span></div>
        <ShareTools url={publicUrl} displayName={account.displayName} />
      </section>

      <section className="manage-metric-grid" aria-label="Site activity">
        <article><span>Page views</span><strong>{metric("page_view")}</strong><small>Recorded visits</small></article>
        <article><span>Referral clicks</span><strong>{metric("referral_click")}</strong><small>Clicks to ClickBaitPays</small></article>
        <article><span>Site-interest clicks</span><strong>{metric("growth_click")}</strong><small>Visitors requesting their own site</small></article>
      </section>

      <section className="manage-content-grid">
        <ManageSiteForm initial={{
          firstName: account.firstName ?? account.fullName,
          lastName: account.lastName ?? "",
          companyName: account.companyName ?? "",
          displayNameType: account.displayNameType,
          publicEmail: account.publicEmail,
          publicPhone: account.publicPhone,
          showEmail: account.showEmail,
          showPhone: account.showPhone,
          bio: account.bio,
          referralUrl: account.referralUrl,
        }} />

        <aside className="manage-account-panel">
          <div><span>Subscription</span><strong>{account.plan ?? "Not active"}</strong><small>{account.subscriptionStatus ?? "No Stripe subscription is connected."}</small></div>
          <BillingPortalButton enabled={Boolean(account.stripeCustomerId && account.plan)} />
          <p>Billing changes are completed securely on Stripe. ProNeurs™ never displays or stores your payment-card details.</p>
        </aside>
      </section>
    </main>
  );
}

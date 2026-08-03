import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { analyticsEvents, sites, subscriptions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/site-config";
import SiteStatusActions from "../../SiteStatusActions";
import AdminSiteEditor from "./AdminSiteEditor";

export const dynamic = "force-dynamic";

export default async function AdminSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin("/admin");
  if (!admin) notFound();
  const { id } = await params;
  const db = await getDb();
  const [account] = await db
    .select({
      siteId: sites.id,
      userId: users.id,
      slug: sites.slug,
      displayName: sites.displayName,
      loginEmail: users.email,
      publicEmail: sites.publicEmail,
      publicPhone: sites.publicPhone,
      showEmail: sites.showEmail,
      showPhone: sites.showPhone,
      bio: sites.bio,
      referralUrl: sites.referralUrl,
      siteStatus: sites.status,
      stripeCustomerId: users.stripeCustomerId,
      plan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      createdAt: sites.createdAt,
      updatedAt: sites.updatedAt,
    })
    .from(sites)
    .innerJoin(users, eq(users.id, sites.userId))
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .where(eq(sites.id, id))
    .limit(1);
  if (!account) notFound();

  const metrics = await db
    .select({ eventType: analyticsEvents.eventType, total: count() })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.siteId, account.siteId))
    .groupBy(analyticsEvents.eventType);
  const metric = (type: string) => metrics.find((item) => item.eventType === type)?.total ?? 0;

  return (
    <main className="admin-page admin-detail-page">
      <header className="admin-header">
        <div><span>PN</span><div><strong>Personal CBP Sites</strong><small>Customer account</small></div></div>
        <Link href="/admin">← Back to all accounts</Link>
      </header>

      <section className="admin-detail-title">
        <div><p className="eyebrow">Customer account</p><h1>{account.displayName}</h1><p>{siteUrl(account.slug).replace(/^https?:\/\//, "")} · Created {account.createdAt.toLocaleDateString()}</p></div>
        <div><a href={siteUrl(account.slug)} target="_blank" rel="noreferrer">View public page ↗</a><SiteStatusActions siteId={account.siteId} status={account.siteStatus} /></div>
      </section>

      <section className="manage-metric-grid admin-detail-metrics">
        <article><span>Page views</span><strong>{metric("page_view")}</strong><small>Recorded visits</small></article>
        <article><span>Referral clicks</span><strong>{metric("referral_click")}</strong><small>ClickBaitPays clicks</small></article>
        <article><span>Growth clicks</span><strong>{metric("growth_click")}</strong><small>Site-interest clicks</small></article>
      </section>

      <section className="admin-detail-content">
        <AdminSiteEditor siteId={account.siteId} initial={{
          displayName: account.displayName,
          loginEmail: account.loginEmail,
          publicEmail: account.publicEmail,
          publicPhone: account.publicPhone,
          bio: account.bio,
          referralUrl: account.referralUrl,
          showEmail: account.showEmail,
          showPhone: account.showPhone,
        }} />
        <aside className="manage-account-panel">
          <div><span>Billing record</span><strong>{account.plan ?? "Not active"}</strong><small>{account.subscriptionStatus ?? "No subscription connected"}</small></div>
          <dl className="admin-account-facts">
            <div><dt>Login email</dt><dd>{account.loginEmail}</dd></div>
            <div><dt>Stripe customer</dt><dd>{account.stripeCustomerId ?? "—"}</dd></div>
            <div><dt>Stripe subscription</dt><dd>{account.stripeSubscriptionId ?? "—"}</dd></div>
            <div><dt>Last updated</dt><dd>{account.updatedAt.toLocaleString()}</dd></div>
          </dl>
        </aside>
      </section>
    </main>
  );
}

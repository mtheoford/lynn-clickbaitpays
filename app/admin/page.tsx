import { and, desc, eq, like, or } from "drizzle-orm";
import Link from "next/link";
import { chatGPTSignInPath, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { sites, subscriptions, users } from "@/db/schema";
import { adminSignOutPath, requireAdmin } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/site-config";
import {
  parseSignupAnalyticsRange,
  type SignupAnalyticsRange,
} from "@/lib/signup-page-analytics";
import SiteStatusActions from "./SiteStatusActions";
import SignupAnalyticsPanel from "./SignupAnalyticsPanel";
import "./signup-trends.css";

export const dynamic = "force-dynamic";

type AdminRow = {
  siteId: string;
  slug: string;
  displayName: string;
  email: string;
  phone: string;
  status: string;
  plan: string | null;
  subscriptionStatus: string | null;
  createdAt: Date;
};

function adminPageHref(range: SignupAnalyticsRange, query: string): string {
  const params = new URLSearchParams({ range });
  if (query) params.set("q", query);
  return `/admin?${params.toString()}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; range?: string }>;
}) {
  let admin = null;
  try {
    admin = await requireAdmin("/admin");
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "administrator authentication context failed",
        error: error instanceof Error ? error.message : "Unknown authentication failure",
      }),
    );
  }
  if (!admin) {
    const signInPath = chatGPTSignInPath("/admin");
    const signOutPath = chatGPTSignOutPath("/admin");
    return (
      <main className="admin-access-page">
        <div>
          <p className="eyebrow">ProNeurs™ administration</p>
          <h1>This account is not authorized.</h1>
          <p>Add the signed-in email to the protected administrator allowlist before using this page.</p>
          <Link href={signInPath}>Sign in with an administrator account</Link>
          {/* Authentication logout endpoints must use a full navigation; Next.js prefetch would sign the user out. */}
          {signInPath !== signOutPath ? <a href={signOutPath}>Sign out and use another account</a> : null}
        </div>
      </main>
    );
  }

  let signOutPath = chatGPTSignOutPath("/admin");
  try {
    signOutPath = await adminSignOutPath("/admin");
  } catch {
    // The direct ChatGPT sign-out path remains available on the hosted pilot.
  }

  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const analyticsRange = parseSignupAnalyticsRange(params.range);
  let rows: AdminRow[] = [];
  let databaseMessage = "";
  try {
    const db = await getDb();
    rows = await db
      .select({
        siteId: sites.id,
        slug: sites.slug,
        displayName: sites.displayName,
        email: users.email,
        phone: users.phone,
        status: sites.status,
        plan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .innerJoin(users, eq(users.id, sites.userId))
      .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
      .where(
        query
          ? and(
              eq(sites.isDemo, false),
              or(
                like(sites.displayName, `%${query}%`),
                like(sites.slug, `%${query}%`),
                like(users.email, `%${query}%`),
                like(users.phone, `%${query}%`),
                like(users.stripeCustomerId, `%${query}%`),
              ),
            )
          : eq(sites.isDemo, false),
      )
      .orderBy(desc(sites.createdAt));
  } catch {
    databaseMessage = "The account database will appear here after the first hosted migration is applied.";
  }

  const counts = rows.reduce(
    (totals, row) => {
      totals.total += 1;
      if (row.status in totals) totals[row.status as keyof typeof totals] += 1;
      return totals;
    },
    { total: 0, active: 0, pending: 0, past_due: 0, suspended: 0, canceled: 0, deleted: 0 },
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><span>PN</span><div><strong>Personal CBP Sites</strong><small>Administration</small></div></div>
        <div>
          <span>Signed in as {admin.email}</span>
          {/* Cloudflare Access treats a GET to this endpoint as a logout, including a Next.js prefetch. */}
          <a href={signOutPath}>Sign out</a>
        </div>
      </header>

      <section className="admin-title-row">
        <div><p className="eyebrow">Account operations</p><h1>New signups and subscriber sites</h1><p>See the newest accounts first, check their signup and billing status, and manage publication.</p></div>
        <div className="admin-title-links"><a href="#admin-funnel-title">Optional reports ↓</a><Link href="/get-your-site">Open signup page ↗</Link></div>
      </section>

      <section className="admin-stat-grid" aria-label="Site account totals">
        <article><span>All sites</span><strong>{counts.total}</strong></article>
        <article><span>Active</span><strong>{counts.active}</strong></article>
        <article><span>Pending</span><strong>{counts.pending}</strong></article>
        <article><span>Past due</span><strong>{counts.past_due}</strong></article>
        <article><span>Suspended</span><strong>{counts.suspended}</strong></article>
      </section>

      <section className="admin-table-panel">
        <div className="admin-panel-heading">
          <div><h2>Recent signups and customer accounts</h2><p>Newest accounts appear first. Pending accounts have not necessarily completed payment. Search by customer, email, phone, site address, or Stripe customer ID.</p></div>
          <form className="admin-search-form" action="/admin" method="get">
            <input type="hidden" name="range" value={analyticsRange} />
            <label><span className="sr-only">Search customer accounts</span><input name="q" defaultValue={query} placeholder="Search accounts" /></label>
            <button type="submit">Search</button>
            {query ? <Link href={adminPageHref(analyticsRange, "")}>Clear</Link> : null}
          </form>
          <span>{rows.length} records</span>
        </div>
        {databaseMessage ? <p className="admin-empty-state">{databaseMessage}</p> : null}
        {!databaseMessage && rows.length === 0 ? <p className="admin-empty-state">No subscriber sites have been created yet.</p> : null}
        {rows.length > 0 ? (
          <div className="admin-table-scroll">
            <table>
              <thead><tr><th>Customer</th><th>Site</th><th>Plan</th><th>Created</th><th>Status and actions</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.siteId}>
                    <td><Link className="admin-customer-link" href={`/admin/sites/${row.siteId}`}>{row.displayName} →</Link><span>{row.email}</span><span>{row.phone}</span></td>
                    <td><a href={siteUrl(row.slug)} target="_blank" rel="noreferrer">{siteUrl(row.slug).replace(/^https?:\/\//, "")} ↗</a></td>
                    <td><strong>{row.plan ?? "—"}</strong><span>{row.subscriptionStatus ?? "No subscription"}</span></td>
                    <td>{row.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td><SiteStatusActions siteId={row.siteId} status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <SignupAnalyticsPanel initialRange={analyticsRange} />
    </main>
  );
}

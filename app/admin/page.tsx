import { and, count, countDistinct, desc, eq, gte, like, lt, or } from "drizzle-orm";
import Link from "next/link";
import { chatGPTSignInPath, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { signupPageEvents, sites, subscriptions, users } from "@/db/schema";
import { adminSignOutPath, requireAdmin } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/site-config";
import {
  SIGNUP_ANALYTICS_RANGE_OPTIONS,
  SIGNUP_ANALYTICS_TIME_ZONE,
  parseSignupAnalyticsRange,
  signupAnalyticsWindow,
  type SignupAnalyticsRange,
} from "@/lib/signup-page-analytics";
import SiteStatusActions from "./SiteStatusActions";

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
          {signInPath !== signOutPath ? <Link href={signOutPath}>Sign out and use another account</Link> : null}
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
  const analyticsWindow = signupAnalyticsWindow(analyticsRange);
  const analyticsRangeLabel =
    SIGNUP_ANALYTICS_RANGE_OPTIONS.find((option) => option.value === analyticsRange)
      ?.label ?? "Last 7 Days";
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
          ? or(
              like(sites.displayName, `%${query}%`),
              like(sites.slug, `%${query}%`),
              like(users.email, `%${query}%`),
              like(users.phone, `%${query}%`),
              like(users.stripeCustomerId, `%${query}%`),
            )
          : undefined,
      )
      .orderBy(desc(sites.createdAt));
  } catch {
    databaseMessage = "The account database will appear here after the first hosted migration is applied.";
  }

  let signupMetrics = { visitors: 0, signupClicks: 0, demoClicks: 0 };
  let signupAnalyticsMessage = "";
  try {
    const db = await getDb();
    const dateFilter =
      analyticsWindow.start && analyticsWindow.end
        ? and(
            gte(signupPageEvents.createdAt, analyticsWindow.start),
            lt(signupPageEvents.createdAt, analyticsWindow.end),
          )
        : undefined;
    const metricRows = await db
      .select({
        eventType: signupPageEvents.eventType,
        total: count(),
        uniqueVisitors: countDistinct(signupPageEvents.visitorHash),
      })
      .from(signupPageEvents)
      .where(dateFilter)
      .groupBy(signupPageEvents.eventType);
    const metric = (eventType: "page_view" | "signup_click" | "demo_click") =>
      metricRows.find((row) => row.eventType === eventType);
    signupMetrics = {
      visitors: metric("page_view")?.uniqueVisitors ?? 0,
      signupClicks: metric("signup_click")?.total ?? 0,
      demoClicks: metric("demo_click")?.total ?? 0,
    };
  } catch {
    signupAnalyticsMessage =
      "Signup-page activity will appear after the analytics migration is applied.";
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
        <div><span>Signed in as {admin.email}</span><Link href={signOutPath}>Sign out</Link></div>
      </header>

      <section className="admin-title-row">
        <div><p className="eyebrow">Account operations</p><h1>Subscriber sites</h1><p>Manage publication and review the billing state without exposing payment details.</p></div>
        <Link href="/get-your-site">Open signup page ↗</Link>
      </section>

      <section className="admin-funnel-panel" aria-labelledby="admin-funnel-title">
        <div className="admin-funnel-heading">
          <div>
            <p className="eyebrow">Signup funnel</p>
            <h2 id="admin-funnel-title">Get Your Site page activity</h2>
            <p>{analyticsRangeLabel} · Calendar ranges use {SIGNUP_ANALYTICS_TIME_ZONE.replace("America/", "")} time.</p>
          </div>
          <nav className="admin-range-filters" aria-label="Signup analytics date range">
            {SIGNUP_ANALYTICS_RANGE_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={adminPageHref(option.value, query)}
                className={option.value === analyticsRange ? "active" : undefined}
                aria-current={option.value === analyticsRange ? "page" : undefined}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="admin-funnel-stat-grid">
          <article>
            <span>Site visitors</span>
            <strong>{signupMetrics.visitors}</strong>
            <small>Unique browsers</small>
          </article>
          <article>
            <span>Get my replicated site</span>
            <strong>{signupMetrics.signupClicks}</strong>
            <small>Signup-form opens</small>
          </article>
          <article>
            <span>See a replicated site</span>
            <strong>{signupMetrics.demoClicks}</strong>
            <small>Live-demo clicks</small>
          </article>
        </div>
        {signupAnalyticsMessage ? <p className="admin-funnel-message">{signupAnalyticsMessage}</p> : null}
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
          <div><h2>Customer accounts</h2><p>Search by customer, email, phone, site address, or Stripe customer ID.</p></div>
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
    </main>
  );
}

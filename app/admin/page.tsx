import { and, desc, eq, like, or } from "drizzle-orm";
import Link from "next/link";
import { chatGPTSignInPath, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { sites, subscriptions, users } from "@/db/schema";
import { adminSignOutPath, requireAdmin } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/site-config";
import {
  SIGNUP_ANALYTICS_RANGE_OPTIONS,
  SIGNUP_ANALYTICS_TIME_ZONE,
  parseSignupAnalyticsRange,
  type SignupAnalyticsRange,
} from "@/lib/signup-page-analytics";
import { SIGNUP_METRICS, type SignupAnalyticsReport } from "@/lib/signup-analytics-report";
import { loadSignupAnalyticsReport } from "@/lib/signup-analytics-query";
import SiteStatusActions from "./SiteStatusActions";
import SignupTrends from "./SignupTrends";
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

  let signupReport: SignupAnalyticsReport | null = null;
  let signupAnalyticsMessage = "";
  try {
    signupReport = await loadSignupAnalyticsReport(analyticsRange);
  } catch {
    signupAnalyticsMessage =
      "Signup analytics could not be loaded. Refresh to try again; unavailable data is not shown as zero.";
  }

  const displayDate = (timestamp: number) => new Intl.DateTimeFormat("en-US", { timeZone: SIGNUP_ANALYTICS_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));

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
        <div><p className="eyebrow">Account operations</p><h1>Subscriber sites</h1><p>Manage publication and review the billing state without exposing payment details.</p></div>
        <Link href="/get-your-site">Open signup page ↗</Link>
      </section>

      <section className="admin-funnel-panel" aria-labelledby="admin-funnel-title">
        <div className="admin-funnel-heading">
          <div>
            <p className="eyebrow">Signup funnel</p>
            <h2 id="admin-funnel-title">Signup activity and sales</h2>
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
        <nav className="admin-chart-periods admin-range-filters" aria-label="Chart period">
          {([{ value: "last-7-days", label: "Week" }, { value: "last-30-days", label: "Month" }, { value: "all-time", label: "Lifetime" }] as const).map((option) => (
            <Link key={option.value} href={adminPageHref(option.value, query)} className={option.value === analyticsRange ? "active" : undefined} aria-current={option.value === analyticsRange ? "page" : undefined}>{option.label}</Link>
          ))}
          <span>Week = last 7 days · Month = last 30 days · Includes today so far</span>
        </nav>
        {signupReport ? <>
          <div className="admin-funnel-stat-grid">
            {SIGNUP_METRICS.filter((metric) => ["visitors", "formOpens", "demoClicks", "formSubmissions", "checkouts", "payments"].includes(metric.key)).map((metric) => (
              <article key={metric.key}><span>{metric.label}</span><strong>{signupReport.totals[metric.key]?.toLocaleString("en-US") ?? "—"}</strong><small>{metric.description}</small></article>
            ))}
          </div>
          <div className="admin-analytics-notes">
            <p>{signupReport.coverage.conversionStartedAt ? <>Detailed form, checkout and activation tracking began {displayDate(signupReport.coverage.conversionStartedAt)}. Earlier unrecorded steps appear as gaps.</> : "Detailed tracking has not started yet."} Paid signups include retained Stripe history and exclude renewals.</p>
            <p>Visitors are unique browsers. Forms started and issue counts use browsing sessions. Browsers can return on multiple days; period totals are deduplicated independently and may differ from the sum of chart points. Events in a date range are not necessarily the same customer cohort.</p>
          </div>
          <SignupTrends points={signupReport.points} interval={signupReport.interval} />
          <div className="admin-analytics-breakdowns">
            <section aria-labelledby="signup-issues-title">
              <h3 id="signup-issues-title">Signup issues</h3>
              <p>Recorded error categories only; entered form values are never included.</p>
              {signupReport.issues.length ? <div className="admin-table-scroll"><table><thead><tr><th>Issue</th><th>Field</th><th>Events</th></tr></thead><tbody>{signupReport.issues.map((issue) => <tr key={`${issue.eventType}-${issue.errorCode}-${issue.field}`}><td>{(issue.errorCode ?? issue.eventType).replaceAll("_", " ")}</td><td>{issue.field?.replace(/([A-Z])/g, " $1").toLowerCase() ?? "—"}</td><td>{issue.total}</td></tr>)}</tbody></table></div> : <p>No issues recorded in this period. Earlier untracked activity is unknown.</p>}
            </section>
            <section aria-labelledby="signup-sources-title">
              <h3 id="signup-sources-title">Traffic sources</h3>
              <p>Referral site or referring host; missing referrers appear as direct / unknown.</p>
              {signupReport.sources.length ? <div className="admin-table-scroll"><table><thead><tr><th>Source</th><th>Browsers</th><th>Forms started</th></tr></thead><tbody>{signupReport.sources.map((source) => <tr key={source.source}><td>{source.source}</td><td>{source.visitors}</td><td>{signupReport.totals.formStarts === null ? "—" : source.formStarts}</td></tr>)}</tbody></table></div> : <p>No source activity recorded in this period.</p>}
            </section>
            <section aria-labelledby="signup-devices-title">
              <h3 id="signup-devices-title">Devices and languages</h3>
              <p>Device and language details are available from the tracking upgrade onward.</p>
              {signupReport.devices.length ? <div className="admin-table-scroll"><table><thead><tr><th>Device</th><th>Language</th><th>Browsers</th><th>Submissions</th></tr></thead><tbody>{signupReport.devices.map((device) => <tr key={`${device.device}-${device.locale}`}><td>{device.device}</td><td>{device.locale === "en" ? "English" : device.locale === "fr" ? "French" : device.locale === "de" ? "German" : "Unknown"}</td><td>{device.visitors}</td><td>{signupReport.totals.formSubmissions === null ? "—" : device.formSubmissions}</td></tr>)}</tbody></table></div> : <p>No device activity recorded in this period.</p>}
            </section>
          </div>
        </> : null}
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

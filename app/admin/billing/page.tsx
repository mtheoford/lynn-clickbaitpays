import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getBillingHealth, lastBillingHealthAlert } from "@/lib/billing-health";
import { runtimeValue } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default async function BillingHealthPage() {
  if (!await requireAdmin("/admin/billing")) notFound();
  let health: Awaited<ReturnType<typeof getBillingHealth>> | null = null;
  let lastAlert: Date | null = null;
  let alertConfigured = false;
  try {
    [health, lastAlert, alertConfigured] = await Promise.all([
      getBillingHealth(), lastBillingHealthAlert(),
      runtimeValue("BILLING_ALERT_EMAIL").then(value => Boolean(value.trim())),
    ]);
  } catch {
    // An operations panel outage must not change customer billing or publication.
  }
  return <main className="admin-page">
    <header className="admin-header"><div><span>PN</span><strong>Billing health</strong></div><Link href="/admin">← Accounts</Link></header>
    <section className="admin-title-row"><div><p className="eyebrow">Operations</p><h1>Billing and welcome-email processing</h1>
      <p>Review work delayed more than 30 minutes, exhausted retries, and email delivery problems. Ordinary payment declines are handled separately by the existing billing recovery process.</p>
      <p>Owner alerts: {alertConfigured ? "configured" : "not configured"}{lastAlert ? ` · Last sent ${lastAlert.toLocaleString()}` : ""}.</p>
    </div></section>
    {!health ? <p className="admin-empty-state">Billing health is temporarily unavailable. Account access and publication controls remain on the accounts page.</p> : <>
      <section className="admin-stat-grid" aria-label="Billing work needing attention">
        <article><span>Billing notifications</span><strong>{health.counts.events}</strong></article>
        <article><span>Completed checkouts awaiting activation</span><strong>{health.counts.paidSites}</strong></article>
        <article><span>Welcome emails</span><strong>{health.counts.emails}</strong></article>
      </section>
      {Object.values(health.counts).every(value => value === 0) ? <p className="admin-empty-state">No overdue billing or welcome-email work needs attention.</p> : null}
      <section className="admin-table-panel"><div className="admin-panel-heading"><h2>Billing notifications</h2><p>Existing notifications are retried safely against current provider state. This does not charge customers.</p></div>
        <div className="admin-table-scroll"><table><thead><tr><th>Event</th><th>Type</th><th>Status</th><th>Attempts</th><th>Next retry</th></tr></thead><tbody>
          {health.events.map(event => <tr key={event.id}><td>{event.id}</td><td>{event.eventType}</td><td>{event.status}</td><td>{event.attempts}</td><td>{event.attempts >= 12 ? "Operator review required" : event.nextAttemptAt?.toLocaleString() ?? "Next recovery pass"}</td></tr>)}
        </tbody></table></div></section>
      <section className="admin-table-panel"><div className="admin-panel-heading"><h2>Completed checkouts awaiting activation</h2></div>
        <div className="admin-table-scroll"><table><thead><tr><th>Account</th><th>Site</th><th>Last payment check</th></tr></thead><tbody>
          {health.paidSites.map(site => <tr key={site.id}><td><Link href={`/admin/sites/${site.id}`}>{site.displayName}</Link></td><td>{site.slug}</td><td>{site.checkedAt?.toLocaleString() ?? "Awaiting check"}</td></tr>)}
        </tbody></table></div></section>
      <section className="admin-table-panel"><div className="admin-panel-heading"><h2>Welcome emails needing attention</h2><p>Provider acceptance and inbox delivery are different states. Open the account for its latest delivery details.</p></div>
        <div className="admin-table-scroll"><table><thead><tr><th>Account</th><th>Status</th><th>Attempts</th><th>Created</th></tr></thead><tbody>
          {health.emails.map(email => <tr key={email.id}><td><Link href={`/admin/sites/${email.siteId}`}>Open account</Link></td><td>{email.status}</td><td>{email.attempts}</td><td>{email.createdAt.toLocaleString()}</td></tr>)}
        </tbody></table></div></section>
      <p>Checked {health.checkedAt.toLocaleString()}. Each list shows up to 50 records; totals include all matching records.</p>
    </>}
  </main>;
}

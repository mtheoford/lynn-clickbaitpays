"use client";

import { useState, type FormEvent } from "react";
import { SIGNUP_ANALYTICS_RANGE_OPTIONS, SIGNUP_ANALYTICS_TIME_ZONE, type SignupAnalyticsRange } from "@/lib/signup-page-analytics";
import { SIGNUP_METRICS, type SignupAnalyticsReport } from "@/lib/signup-analytics-report";
import SignupTrends from "./SignupTrends";

export default function SignupAnalyticsPanel({ initialRange }: { initialRange: SignupAnalyticsRange }) {
  const [range, setRange] = useState(initialRange);
  const [signupReport, setReport] = useState<SignupAnalyticsReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const displayDate = (timestamp: number) => new Intl.DateTimeFormat("en-US", { timeZone: SIGNUP_ANALYTICS_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/signup-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ range }),
      });
      const result = await response.json() as { report?: SignupAnalyticsReport; generatedAt?: string; error?: string };
      if (!response.ok || !result.report || !result.generatedAt) throw new Error(result.error ?? "The report could not be generated. Try again.");
      setReport(result.report);
      setGeneratedAt(result.generatedAt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The report could not be generated. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-funnel-panel" aria-labelledby="admin-funnel-title">
      <div className="admin-funnel-heading">
        <div>
          <p className="eyebrow">Optional reports</p>
          <h2 id="admin-funnel-title">Signup activity and sales</h2>
          <p>Generate visitor, signup, payment and error reports whenever you need them.</p>
        </div>
        <form className="admin-report-controls" onSubmit={generate}>
          <label>Report period
            <select value={range} disabled={busy} onChange={(event) => {
              setRange(event.target.value as SignupAnalyticsRange);
              setReport(null);
              setGeneratedAt(null);
              setMessage("");
            }}>
              {SIGNUP_ANALYTICS_RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate report"}</button>
        </form>
      </div>
      <div className="admin-report-status" role="status" aria-live="polite">
        {message || (busy ? "Generating your report…" : generatedAt ? `Generated ${new Intl.DateTimeFormat("en-US", { timeZone: SIGNUP_ANALYTICS_TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(generatedAt))} Denver time. Generate again for updated data.` : "Reports run only when you select Generate report. Date ranges use Denver time.")}
        {message && signupReport ? " The previous report is still shown below." : null}
      </div>
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
    </section>
  );
}

import { SIGNUP_EVENTS_CTE } from "./signup-analytics-sql.ts";
import { getRuntimeEnv } from "@/lib/runtime";
import { signupAnalyticsWindow, type SignupAnalyticsRange } from "@/lib/signup-page-analytics";
import { applySignupCoverage, buildSignupTrendBuckets, buildSignupTrendPoints, signupMetricValues, type SignupAnalyticsReport, type SignupMetricAggregate } from "@/lib/signup-analytics-report";


export async function loadSignupAnalyticsReport(range: SignupAnalyticsRange, now = new Date()): Promise<SignupAnalyticsReport> {
  const { DB } = await getRuntimeEnv();
  if (!DB) throw new Error("Analytics database unavailable");
  const coverageRows = await DB.prepare(`${SIGNUP_EVENTS_CTE}
    SELECT (SELECT MIN(created_at) FROM signup_page_events WHERE event_type IN ('page_view','signup_click','demo_click')) AS trafficStartedAt,
      (SELECT started_at FROM signup_analytics_versions WHERE id = 'conversion_v2') AS conversionStartedAt,
      (SELECT MIN(created_at) FROM paid_signups) AS paymentsStartedAt`).first<{ trafficStartedAt: number | null; conversionStartedAt: number | null; paymentsStartedAt: number | null }>();
  if (!coverageRows) throw new Error("Analytics coverage unavailable");
  const coverage = { ...coverageRows, paymentsStartedAt: coverageRows.paymentsStartedAt ?? coverageRows.conversionStartedAt };
  const firstTimes = Object.values(coverage).filter((value): value is number => typeof value === "number");
  const { buckets, interval } = buildSignupTrendBuckets(range, firstTimes.length ? Math.min(...firstTimes) : null, now);
  const window = signupAnalyticsWindow(range, now);
  const start = window.start?.getTime() ?? 0;
  // Exclude future-dated rows even for a partial current calendar day.
  const end = Math.min(window.end?.getTime() ?? now.getTime() + 1, now.getTime() + 1);
  const bucketSql = buckets.map((bucket) => `SELECT '${bucket.key}' AS bucket, ${bucket.start} AS start_at, ${Math.min(bucket.end, end)} AS end_at`).join(" UNION ALL ");
  const aggregate = `COUNT(*) AS total, COUNT(DISTINCT visitor_hash) AS visitors, COUNT(DISTINCT COALESCE(journey_hash, visitor_hash, id)) AS journeys`;
  const queries = [
    DB.prepare(`${SIGNUP_EVENTS_CTE}, buckets AS (${bucketSql}) SELECT buckets.bucket, events.event_type AS eventType, ${aggregate}
      FROM buckets JOIN events ON events.created_at >= buckets.start_at AND events.created_at < buckets.end_at
      GROUP BY buckets.bucket, events.event_type`),
    DB.prepare(`${SIGNUP_EVENTS_CTE} SELECT '' AS bucket, event_type AS eventType, ${aggregate}
      FROM events WHERE created_at >= ? AND created_at < ? GROUP BY event_type`).bind(start, end),
    DB.prepare(`SELECT event_type AS eventType, error_code AS errorCode, field, COUNT(*) AS total
      FROM signup_page_events WHERE created_at >= ? AND created_at < ? AND event_type IN ('validation_error','checkout_error','checkout_failed','payment_failed')
      GROUP BY event_type, error_code, field ORDER BY total DESC LIMIT 10`).bind(start, end),
    DB.prepare(`SELECT COALESCE(source, referrer_host, 'Direct / unknown') AS source,
      COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_hash END) AS visitors,
      COUNT(DISTINCT CASE WHEN event_type = 'form_start' THEN COALESCE(journey_hash, visitor_hash) END) AS formStarts
      FROM signup_page_events WHERE created_at >= ? AND created_at < ? AND event_type IN ('page_view','form_start')
      GROUP BY COALESCE(source, referrer_host, 'Direct / unknown') ORDER BY visitors DESC LIMIT 8`).bind(start, end),
    DB.prepare(`SELECT COALESCE(device_type, 'unknown') AS device, COALESCE(locale, 'unknown') AS locale,
      COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_hash END) AS visitors,
      SUM(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) AS formSubmissions
      FROM signup_page_events WHERE created_at >= ? AND created_at < ? AND event_type IN ('page_view','form_submit')
      GROUP BY device_type, locale ORDER BY visitors DESC LIMIT 12`).bind(start, end),
  ];
  const results = await DB.batch(queries);
  if (results.some((result) => !result.success)) throw new Error("Analytics query failed");
  return {
    points: buildSignupTrendPoints(buckets, results[0].results as SignupMetricAggregate[], coverage), interval,
    totals: applySignupCoverage(signupMetricValues(results[1].results as SignupMetricAggregate[]), end, coverage), coverage,
    issues: results[2].results as SignupAnalyticsReport["issues"],
    sources: results[3].results as SignupAnalyticsReport["sources"],
    devices: results[4].results as SignupAnalyticsReport["devices"],
  };
}

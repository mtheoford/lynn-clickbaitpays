import assert from "node:assert/strict";
import test from "node:test";
import { Miniflare } from "miniflare";
import { buildSignupTrendBuckets, type SignupTrendBucket } from "../lib/signup-analytics-report.ts";
import { SIGNUP_EVENTS_CTE, signupTrendBucketSql } from "../lib/signup-analytics-sql.ts";
import type { SignupAnalyticsRange } from "../lib/signup-page-analytics.ts";

type Statement = { sql: string; params?: (string | number | null)[] };
type AggregateRow = { bucket: string; eventType: string; total: number; visitors: number; journeys: number };
type Result = { success: boolean; error?: string; results?: { success: boolean; results: AggregateRow[] }[] };

// Node's SQLite allows more compound SELECT terms than D1. Run the query in
// workerd's actual D1 binding so this production limit remains covered.
test("D1 chart queries support every range, deduplicate browsers and exclude future events", { timeout: 15_000 }, async () => {
  const runtime = new Miniflare({
    modules: true,
    compatibilityDate: "2026-08-03",
    d1Databases: { DB: "signup-analytics-regression" },
    script: `export default { async fetch(request, env) {
      try {
        const statements = await request.json();
        const results = await env.DB.batch(statements.map(({ sql, params }) => {
          const statement = env.DB.prepare(sql);
          return params?.length ? statement.bind(...params) : statement;
        }));
        return Response.json({ success: true, results });
      } catch (error) {
        return Response.json({ success: false, error: String(error) });
      }
    } };`,
  });
  const run = async (statements: Statement[]): Promise<Result> => {
    const response = await runtime.dispatchFetch("https://analytics.test/", {
      method: "POST", body: JSON.stringify(statements),
    });
    return await response.json() as Result;
  };
  const now = new Date("2026-09-10T20:00:00Z");
  const end = now.getTime() + 1;
  const history = Date.parse("2026-08-04T18:00:00Z");
  const query = (bucketCte: string) => `${SIGNUP_EVENTS_CTE}, ${bucketCte}
    SELECT buckets.bucket, events.event_type AS eventType, COUNT(*) AS total,
      COUNT(DISTINCT visitor_hash) AS visitors,
      COUNT(DISTINCT COALESCE(journey_hash, visitor_hash, id)) AS journeys
    FROM buckets JOIN events ON events.created_at >= buckets.start_at AND events.created_at < buckets.end_at
    GROUP BY buckets.bucket, events.event_type ORDER BY buckets.bucket, events.event_type`;
  const rowsFor = async (buckets: SignupTrendBucket[]) => {
    const result = await run([{ sql: query(signupTrendBucketSql(buckets, end)) }]);
    assert.equal(result.success, true, result.error);
    assert.equal(result.results?.[0].success, true);
    return result.results![0].results;
  };

  try {
    const setup = await run([
      { sql: "CREATE TABLE signup_page_events (id TEXT, event_type TEXT, visitor_hash TEXT, journey_hash TEXT, created_at INTEGER)" },
      { sql: "CREATE TABLE stripe_events (event_type TEXT, payload_json TEXT)" },
    ]);
    assert.equal(setup.success, true, setup.error);

    for (const range of ["yesterday", "last-7-days", "last-30-days"] as const) {
      const { buckets } = buildSignupTrendBuckets(range, history, now);
      const oldCompound = `buckets AS (${buckets.map((bucket) => `SELECT '${bucket.key}' AS bucket, ${bucket.start} AS start_at, ${bucket.end} AS end_at`).join(" UNION ALL ")})`;
      const before = await run([{ sql: query(oldCompound) }]);
      if (buckets.length === 1) assert.equal(before.success, true, before.error);
      else {
        assert.equal(before.success, false);
        assert.match(before.error ?? "", /too many terms in compound SELECT/);
      }
      assert.deepEqual(await rowsFor(buckets), []);
    }

    const events = [
      ["august", "page_view", "browser1", "visit1", "2026-08-04T18:00:00Z"],
      ["september", "page_view", "browser1", "visit2", "2026-09-04T18:00:00Z"],
      ["yesterday", "page_view", "browser1", "visit3", "2026-09-09T18:00:00Z"],
      ["repeat", "page_view", "browser1", "visit3", "2026-09-09T19:00:00Z"],
      ["open", "signup_click", "browser1", "visit3", "2026-09-09T20:00:00Z"],
      ["today", "page_view", "browser2", "visit4", "2026-09-10T18:00:00Z"],
      ["future", "page_view", "browser3", "visit5", "2026-09-10T22:00:00Z"],
    ];
    const inserted = await run([
      ...events.map(([id, eventType, browser, visit, date]) => ({
        sql: "INSERT INTO signup_page_events VALUES (?, ?, ?, ?, ?)",
        params: [id, eventType, browser, visit, Date.parse(date)],
      })),
      {
        sql: "INSERT INTO stripe_events VALUES (?, ?)",
        params: ["checkout.session.completed", JSON.stringify({
          created: Date.parse("2026-09-06T18:00:00Z") / 1000,
          data: { object: { mode: "subscription", payment_status: "paid", amount_total: 900, subscription: "fixture_subscription", metadata: { siteId: "fixture_site" } } },
        })],
      },
    ]);
    assert.equal(inserted.success, true, inserted.error);

    const cases: { range: SignupAnalyticsRange; buckets: number; views: number; payments: number }[] = [
      { range: "today", buckets: 1, views: 1, payments: 0 },
      { range: "yesterday", buckets: 1, views: 2, payments: 0 },
      { range: "this-week", buckets: 4, views: 3, payments: 0 },
      { range: "last-7-days", buckets: 7, views: 4, payments: 1 },
      { range: "last-14-days", buckets: 14, views: 4, payments: 1 },
      { range: "last-30-days", buckets: 30, views: 4, payments: 1 },
      { range: "all-time", buckets: 38, views: 5, payments: 1 },
    ];
    for (const item of cases) {
      const { buckets } = buildSignupTrendBuckets(item.range, history, now);
      assert.equal(buckets.length, item.buckets);
      const rows = await rowsFor(buckets);
      assert.equal(rows.filter((row) => row.eventType === "page_view").reduce((sum, row) => sum + row.total, 0), item.views, item.range);
      assert.equal(rows.filter((row) => row.eventType === "payment_completed").reduce((sum, row) => sum + row.total, 0), item.payments, item.range);
      const yesterday = rows.find((row) => row.bucket === "2026-09-09" && row.eventType === "page_view");
      if (yesterday) assert.deepEqual(yesterday, { bucket: "2026-09-09", eventType: "page_view", total: 2, visitors: 1, journeys: 1 });
    }

    const monthly = buildSignupTrendBuckets("all-time", Date.parse("2024-02-29T18:00:00Z"), now);
    assert.equal(monthly.interval, "month");
    const monthlyRows = await rowsFor(monthly.buckets);
    assert.deepEqual(monthlyRows.find((row) => row.bucket === "2026-09-01" && row.eventType === "page_view"), {
      bucket: "2026-09-01", eventType: "page_view", total: 4, visitors: 2, journeys: 3,
    });
  } finally {
    await runtime.dispose();
  }
});

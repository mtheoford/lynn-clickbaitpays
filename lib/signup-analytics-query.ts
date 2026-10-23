import { getRuntimeEnv } from "@/lib/runtime";
import type { SignupAnalyticsRange } from "./signup-page-analytics.ts";
import { loadSignupAnalyticsReportFromDb } from "./signup-analytics-d1.ts";

// Keep the CBP application entry point while allowing another trusted Worker
// to reuse the report with an explicit binding to the same source database.
export async function loadSignupAnalyticsReport(range: SignupAnalyticsRange, now = new Date()) {
  const { DB } = await getRuntimeEnv();
  if (!DB) throw new Error("Analytics database unavailable");
  return loadSignupAnalyticsReportFromDb(DB, range, now);
}

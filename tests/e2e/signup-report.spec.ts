import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { expect, test } from "@playwright/test";
import { SIGNUP_METRICS } from "../../lib/signup-analytics-report";

// Local isolated component with a mocked report endpoint. Never part of
// external smoke runs; it does not generate production analytics or fixtures.
let componentBundle = "";
test.beforeAll(async () => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
        import SignupAnalyticsPanel from './app/admin/SignupAnalyticsPanel';
        createRoot(document.getElementById('report-root')).render(React.createElement(SignupAnalyticsPanel, { initialRange: 'last-7-days' }));`,
      resolveDir: process.cwd(), loader: "tsx",
    },
    bundle: true, write: false, format: "iife", platform: "browser", logLevel: "silent", loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"' },
  });
  componentBundle = bundle.outputFiles[0].text;
});

test("reports run only on demand and preserve a prior snapshot after a failed regeneration", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/report-fixture", (route) => route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main class="admin-page"><h1>New signups and subscriber sites</h1><div id="report-root"></div></main></body></html>' }));
  await page.goto("/report-fixture");
  await page.addStyleTag({ content: readFileSync("app/globals.css", "utf8").replace('@import "tailwindcss";', "") });
  await page.addStyleTag({ content: readFileSync("app/admin/signup-trends.css", "utf8") });
  const totals = Object.fromEntries(SIGNUP_METRICS.map((metric) => [metric.key, metric.key === "payments" ? 2 : 0]));
  const payload = {
    report: { totals, points: [{ key: "2026-10-01", label: "Oct 1", values: totals }], interval: "day", coverage: { conversionStartedAt: 1790870400000, paymentsStartedAt: 1790870400000, trafficStartedAt: 1790870400000 }, issues: [], sources: [], devices: [] },
    generatedAt: "2026-10-01T19:00:00Z",
  };
  const requests: { range: string }[] = [];
  let fail = false;
  await page.route("**/api/admin/signup-report", async (route) => {
    expect(route.request().method()).toBe("POST");
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: fail ? 503 : 200, json: fail ? { error: "The report could not be generated. Try again." } : payload });
  });
  await page.addScriptTag({ content: componentBundle });
  const period = page.getByRole("combobox", { name: "Report period", exact: true });
  await expect(page.getByRole("status")).toContainText("Reports run only when");
  await expect(page.locator(".signup-trend-card")).toHaveCount(0);
  expect(requests).toEqual([]);
  await period.selectOption("all-time");
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Generate report", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Generated Oct 1, 2026");
  await expect(page.locator(".signup-trend-card")).toHaveCount(3);
  expect(requests).toEqual([{ range: "all-time" }]);
  fail = true;
  await page.getByRole("button", { name: "Generate report", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("The previous report is still shown below.");
  await expect(page.locator(".signup-trend-card")).toHaveCount(3);
  await period.selectOption("last-7-days");
  await expect(page.locator(".signup-trend-card")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Reports run only when");
  expect(requests).toHaveLength(2);
  fail = false;
  await page.getByRole("button", { name: "Generate report", exact: true }).click();
  await expect(page.locator(".signup-trend-card")).toHaveCount(3);
  expect(requests).toEqual([{ range: "all-time" }, { range: "all-time" }, { range: "last-7-days" }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test("the live local report route cannot be triggered by GET or an unauthenticated POST", async ({ request }) => {
  expect((await request.get("/api/admin/signup-report")).status()).toBe(405);
  expect((await request.post("/api/admin/signup-report", { headers: { origin: "http://127.0.0.1:3100" }, data: { range: "all-time" } })).status()).toBe(403);
});

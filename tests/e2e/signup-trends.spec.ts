import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";
import { SIGNUP_METRICS, type SignupTrendPoint } from "../../lib/signup-analytics-report";

// Render the real client component in an isolated document. No app route,
// administrator bypass, database connection or production fixture is introduced.
// These tests have no @smoke tag and are excluded from every external BASE_URL run.
let componentBundle = "";
const chartCss = readFileSync(resolve("app/admin/signup-trends.css"), "utf8");
// Tailwind is resolved by the app build, not the isolated about:blank document.
const siteCss = readFileSync(resolve("app/globals.css"), "utf8").replace('@import "tailwindcss";', "");

test.beforeAll(async () => {
  const bundle = await build({
    stdin: {
      contents: `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import SignupTrends from "./app/admin/SignupTrends";
        createRoot(document.getElementById("chart-root")).render(
          React.createElement(SignupTrends, window.signupTrendFixture)
        );
      `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
  componentBundle = bundle.outputFiles[0].text;
});

function point(key: string, label: string, overrides: Partial<SignupTrendPoint["values"]> = {}): SignupTrendPoint {
  return {
    key,
    label,
    values: { ...Object.fromEntries(SIGNUP_METRICS.map((metric) => [metric.key, null])), ...overrides } as SignupTrendPoint["values"],
  };
}

async function renderChart(page: Page, points: SignupTrendPoint[], interval: "day" | "month" = "day") {
  await page.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main class="admin-page"><section class="admin-funnel-panel"><div id="chart-root"></div></section></main></body></html>');
  await page.addStyleTag({ content: siteCss });
  await page.addStyleTag({ content: chartCss });
  await page.evaluate((fixture) => {
    (window as Window & { signupTrendFixture?: unknown }).signupTrendFixture = fixture;
  }, { points, interval });
  await page.addScriptTag({ content: componentBundle });
}

const dailyPoints = [
  point("2026-09-08", "Sep 8", { visitors: 140, formOpens: 16, demoClicks: 10 }),
  point("2026-09-09", "Sep 9", { visitors: 231, formOpens: 20, demoClicks: 11, payments: 2 }),
  point("2026-09-10", "Sep 10", { visitors: 87, formOpens: 8, demoClicks: 4 }),
];

function group(page: Page, heading: string) {
  return page.locator(".signup-trend-card").filter({ has: page.getByRole("heading", { name: heading, exact: true }) });
}

test("charts preserve missing observations and support series and keyboard date inspection", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await renderChart(page, dailyPoints);
  const checkout = group(page, "Signup and payment");
  await expect(checkout).toBeVisible();
  const paymentColor = SIGNUP_METRICS.find((metric) => metric.key === "payments")!.color;
  const paymentPath = checkout.locator(`path[stroke="${paymentColor}"]`);
  await expect(paymentPath).toHaveAttribute("d", /^M[^L]+$/);
  await expect(checkout.locator(`circle[fill="${paymentColor}"]`)).toHaveCount(1);
  await expect(checkout.locator(".signup-trend-values")).toContainText("Not tracked");

  const date = checkout.getByRole("slider", { name: "Signup and payment: inspect day" });
  await date.focus();
  await date.press("ArrowLeft");
  await expect(date).toHaveAttribute("aria-valuetext", "Sep 9");
  for (const chart of await page.locator(".signup-trend-card").all()) {
    await expect(chart.locator(".signup-trend-date-controls strong")).toHaveText("Sep 9");
  }
  await expect(checkout.locator(".signup-trend-values > div").filter({ hasText: "Paid signups" }).locator("dd")).toHaveText("2");

  const series = checkout.getByRole("button", { name: "Paid signups", exact: true });
  await expect(series).toHaveAttribute("aria-pressed", "true");
  await series.click();
  await expect(series).toHaveAttribute("aria-pressed", "false");
  await expect(paymentPath).toHaveCount(0);
  await series.click();
  await expect(paymentPath).toHaveAttribute("d", /^M[^L]+$/);

  await checkout.locator("summary").click();
  const table = checkout.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("row").filter({ hasText: "Sep 8" })).toContainText("Not tracked");
  await expect(table.getByRole("row").filter({ hasText: "Sep 9" })).toContainText("2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("monthly labels, touch date controls and tracked zero remain readable", async ({ page, isMobile }) => {
  await renderChart(page, [
    point("2026-08-01", "Aug 2026", { visitors: 1000, payments: 1, validationErrors: 0 }),
    point("2026-09-01", "Sep 2026", { visitors: 700, payments: 0, validationErrors: 0 }),
  ], "month");
  const traffic = group(page, "Visitors and interest");
  await expect(traffic.getByText("Monthly counts", { exact: true })).toBeVisible();
  const previous = traffic.getByRole("button", { name: "Visitors and interest: previous month" });
  if (isMobile) await previous.tap(); else await previous.click();
  await expect(traffic.getByRole("slider")).toHaveAttribute("aria-valuetext", "Aug 2026");
  await expect(group(page, "Signup and payment").locator(".signup-trend-date-controls strong")).toHaveText("Aug 2026");
  const issues = group(page, "Errors and unfinished checkouts");
  await expect(issues.locator(".signup-trend-values > div").filter({ hasText: "Form issues" }).locator("dd")).toHaveText("0");
  await expect(issues.locator("svg.signup-trend-svg")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("empty chart data has a clear state without invented observations", async ({ page }) => {
  await renderChart(page, []);
  await expect(page.getByText("No signup activity is available for this period yet.", { exact: true })).toBeVisible();
  await expect(page.locator(".signup-trend-card")).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveCount(0);
});

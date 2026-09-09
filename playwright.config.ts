import { defineConfig, devices } from "@playwright/test";

// Any external target is interaction-only. Checkout submissions are local mocks.
const externalBaseUrl = process.env.BASE_URL;
const localBaseUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  grep: externalBaseUrl ? /@smoke/ : undefined,
  outputDir: "outputs/playwright-results",
  reporter: [["list"], ["html", { outputFolder: "outputs/playwright-report", open: "never" }]],
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: externalBaseUrl ? undefined : {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: `${localBaseUrl}/get-your-site`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

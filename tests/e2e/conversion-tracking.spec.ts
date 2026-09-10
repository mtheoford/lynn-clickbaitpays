import { createServer } from "node:http";
import { expect, test, type Locator, type Page } from "@playwright/test";

type TrackedEvent = Record<string, unknown> & { eventType: string; field?: string; errorCode?: string };
const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const privateValues = ["PrivateGiven", "PrivateSurname", "private-signup@example.invalid", "8015550123", "private-referral"];

test.beforeEach(async ({ context }) => {
  test.skip(!!process.env.BASE_URL, "Conversion tracking tests only submit mocked local forms.");
  await context.route("**/api/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, available: true }),
  }));
});

async function collectEvents(page: Page) {
  const events: TrackedEvent[] = [];
  // WebKit omits Blob beacon bodies from Playwright's request protocol. Use
  // the application's fetch fallback for payload assertions; a separate
  // local receiver test below verifies actual native beacon delivery.
  await page.addInitScript(() => { navigator.sendBeacon = () => false; });
  await page.route("**/api/signup-page-analytics", async (route) => {
    events.push(route.request().postDataJSON() as TrackedEvent);
    await route.fulfill({ status: 204 });
  });
  return events;
}

async function openForm(page: Page, path = "/get-your-site") {
  await page.goto(`${path}?source=your-name`);
  await page.locator(".sales-button").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillForm(dialog: Locator) {
  await dialog.locator('[name="firstName"]').fill(privateValues[0]);
  await dialog.locator('[name="lastName"]').fill(privateValues[1]);
  await dialog.locator('[name="email"]').fill(privateValues[2]);
  await dialog.locator('[name="phone"]').fill(privateValues[3]);
  await dialog.locator('[name="referralUsername"]').fill(privateValues[4]);
  await dialog.locator('[name="acceptedTerms"]').check();
}

async function mockCheckoutDestination(page: Page) {
  await page.route("**/conversion-tracking-complete", (route) => route.fulfill({
    contentType: "text/html",
    body: "<h1>Mock checkout reached</h1>",
  }));
}

function expectPrivateValuesAbsent(events: TrackedEvent[]) {
  const payload = JSON.stringify(events);
  for (const value of privateValues) expect(payload).not.toContain(value);
  for (const event of events) {
    expect(Object.keys(event).every((key) => [
      "eventType", "placement", "source", "visitorToken", "journeyToken", "locale",
      "deviceType", "referrer", "errorCode", "field",
    ].includes(key))).toBe(true);
  }
}

test("native JSON Blob beacon reaches a same-origin receiver across navigation", async ({ page }) => {
  // This test only opens its own local receiver. Disable interception entirely:
  // WebKit's paused beacon can otherwise be canceled by the next navigation.
  await page.context().unroute("**/api/**");
  const bodies: string[] = [];
  const receiver = createServer((request, response) => {
    if (request.method !== "POST") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<!doctype html><title>Local beacon receiver</title>");
      return;
    }
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => { body += chunk; });
    request.on("end", () => {
      bodies.push(body);
      response.writeHead(204);
      response.end();
    });
  });
  await new Promise<void>((resolve) => receiver.listen(0, "127.0.0.1", resolve));
  try {
    const address = receiver.address();
    if (!address || typeof address === "string") throw new Error("Local beacon receiver did not start.");
    await page.goto(`http://127.0.0.1:${address.port}/`);
    const queued = await page.evaluate(() => {
      const queued = navigator.sendBeacon("/beacon", new Blob([
        JSON.stringify({ eventType: "checkout_redirect", placement: "checkout" }),
      ], { type: "application/json" }));
      window.location.assign(new URL("/after-beacon", window.location.href).href);
      return queued;
    });
    expect(queued).toBe(true);
    await expect(page).toHaveURL(/\/after-beacon$/);
    await expect.poll(() => bodies.length).toBe(1);
    expect(JSON.parse(bodies[0])).toEqual({ eventType: "checkout_redirect", placement: "checkout" });
  } finally {
    receiver.closeAllConnections();
    await new Promise<void>((resolve, reject) => receiver.close((error) => error ? reject(error) : resolve()));
  }
});

test("native invalid fields are visible without counting a valid submission; first edit persists across dialogs", async ({ page }) => {
  const events = await collectEvents(page);
  let checkoutRequests = 0;
  await page.route("**/api/checkout", async (route) => {
    checkoutRequests += 1;
    await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
  });
  const dialog = await openForm(page);
  await expect.poll(() => events.filter((event) => event.eventType === "signup_click").length).toBe(1);
  expect(events.filter((event) => event.eventType === "form_start")).toHaveLength(0);
  await dialog.locator('button[type="submit"]').click();
  await expect.poll(() => events.filter((event) => event.eventType === "validation_error").length).toBe(6);
  expect(events.find((event) => event.field === "acceptedTerms")).toMatchObject({ errorCode: "terms_required" });
  expect(events.filter((event) => event.eventType === "form_submit")).toHaveLength(0);
  await dialog.locator('button[type="submit"]').click();
  await expect.poll(() => events.filter((event) => event.eventType === "validation_error").length).toBe(12);

  await fillForm(dialog);
  await dialog.locator('[name="companyName"]').fill("PrivateCompany");
  await dialog.locator('button[type="submit"]').click();
  await expect.poll(() => events.filter((event) => event.field === "displayNameType").length).toBe(1);
  expect(checkoutRequests).toBe(0);
  await expect.poll(() => events.filter((event) => event.eventType === "form_start").length).toBe(1);

  await dialog.locator("header button").click();
  await page.locator(".sales-button").last().click();
  await page.getByRole("dialog").locator('[name="firstName"]').fill(privateValues[0]);
  await page.reload();
  await page.locator(".sales-button").first().click();
  await page.getByRole("dialog").locator('[name="firstName"]').fill(privateValues[0]);
  await expect.poll(() => events.filter((event) => event.eventType === "signup_click").length).toBe(3);
  expect(events.filter((event) => event.eventType === "form_start")).toHaveLength(1);
  expect(new Set(events.map((event) => event.visitorToken)).size).toBe(1);
  expect(new Set(events.map((event) => event.journeyToken)).size).toBe(1);
  expectPrivateValuesAbsent(events);
  expect(JSON.stringify(events)).not.toContain("PrivateCompany");
});

test("localized valid submission joins its anonymous journey and records redirect intent", async ({ page }) => {
  const events = await collectEvents(page);
  let checkoutPayload: Record<string, unknown> | undefined;
  await page.route("**/api/checkout", async (route) => {
    checkoutPayload = route.request().postDataJSON();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ checkoutUrl: "/conversion-tracking-complete" }),
    });
  });
  await mockCheckoutDestination(page);
  await page.goto("/fr/get-your-site?source=your-name", { referer: "https://example.invalid/private?email=private-signup@example.invalid" });
  await page.locator(".cbp-price-option").filter({ hasText: "Annuel" }).click();
  const dialog = page.getByRole("dialog");
  await fillForm(dialog);
  await dialog.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/conversion-tracking-complete$/);
  await expect.poll(() => events.filter((event) => event.eventType === "checkout_redirect").length).toBe(1);
  expect(events.filter((event) => event.eventType === "form_submit")).toHaveLength(1);
  expect(events.filter((event) => event.eventType === "form_start")).toHaveLength(1);
  expect(events.filter((event) => event.eventType === "checkout_error")).toHaveLength(0);
  const firstEvent = events[0];
  expect(firstEvent.visitorToken).toMatch(tokenPattern);
  expect(firstEvent.journeyToken).toMatch(tokenPattern);
  const deviceType = (page.viewportSize()?.width ?? 1280) < 768 ? "mobile" : "desktop";
  expect(checkoutPayload).toMatchObject({
    locale: "fr", plan: "annual", acceptedTerms: true,
    analytics: { visitorToken: firstEvent.visitorToken, journeyToken: firstEvent.journeyToken, locale: "fr", deviceType },
  });
  for (const event of events) {
    expect(event).toMatchObject({ visitorToken: firstEvent.visitorToken, journeyToken: firstEvent.journeyToken, locale: "fr", deviceType });
    expect(event.referrer).toBe("https://example.invalid");
  }
  expectPrivateValuesAbsent(events);
});

test("checkout network and response failures remain retryable and report only safe categories", async ({ page }) => {
  const events = await collectEvents(page);
  let attempts = 0;
  await page.route("**/api/checkout", async (route) => {
    attempts += 1;
    if (attempts === 1) return route.abort("failed");
    if (attempts === 4) return route.fulfill({ status: 502, contentType: "text/html", body: "<h1>Invalid response</h1>" });
    await route.fulfill({
      status: attempts === 2 ? 503 : 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: `Private failure for ${privateValues[2]}`,
        code: attempts === 2 ? privateValues[2] : "email_has_site",
        field: attempts === 2 ? privateValues[2] : "email",
      }),
    });
  });
  const dialog = await openForm(page);
  await fillForm(dialog);
  const expectedCodes = ["network_error", "checkout_unavailable", "email_has_site", "invalid_response"];
  for (const [index, code] of expectedCodes.entries()) {
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.locator('button[type="submit"]')).toBeEnabled();
    await expect.poll(() => events.filter((event) => event.eventType === "checkout_error").length).toBe(index + 1);
    expect(events.filter((event) => event.eventType === "checkout_error")[index].errorCode).toBe(code);
  }
  expect(events.filter((event) => event.eventType === "form_submit")).toHaveLength(4);
  expect(events.filter((event) => event.eventType === "checkout_redirect")).toHaveLength(0);
  expect(events.filter((event) => event.eventType === "form_start")).toHaveLength(1);
  expectPrivateValuesAbsent(events);
});

test("unavailable addresses explain the disabled submit without inventing a submission", async ({ page }) => {
  const events = await collectEvents(page);
  await page.route("**/api/site-address/availability", (route) => {
    const unavailable = route.request().postDataJSON().slug === "privategiven-privatesurname";
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ available: !unavailable, message: unavailable ? "That site address is already taken." : "Available." }),
    });
  });
  const dialog = await openForm(page);
  await dialog.locator('[name="firstName"]').fill(privateValues[0]);
  await dialog.locator('[name="lastName"]').fill(privateValues[1]);
  await expect(dialog.locator(".signup-availability.is-unavailable")).toBeVisible();
  await expect(dialog.locator('button[type="submit"]')).toBeDisabled();
  await expect.poll(() => events.filter((event) => event.errorCode === "site_unavailable").length).toBe(1);
  expect(events.find((event) => event.errorCode === "site_unavailable")).toMatchObject({ eventType: "validation_error", field: "siteAddress" });
  await dialog.locator('[name="email"]').fill(privateValues[2]);
  await expect(dialog.locator(".signup-availability.is-unavailable")).toBeVisible();
  expect(events.filter((event) => event.errorCode === "site_unavailable")).toHaveLength(1);
  expect(events.filter((event) => event.eventType === "form_submit")).toHaveLength(0);
  expectPrivateValuesAbsent(events);
});

for (const mode of ["blocked-transport", "blocked-crypto"] as const) {
  test(`${mode}: analytics failures never prevent checkout or cause unhandled browser errors`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.addInitScript((failureMode) => {
      Object.defineProperty(Storage.prototype, "getItem", { configurable: true, value() { throw new Error("Storage disabled"); } });
      Object.defineProperty(Storage.prototype, "setItem", { configurable: true, value() { throw new Error("Storage disabled"); } });
      Object.defineProperty(Crypto.prototype, "randomUUID", { configurable: true, value() { throw new Error("UUID disabled"); } });
      if (failureMode === "blocked-crypto") {
        Object.defineProperty(Crypto.prototype, "getRandomValues", { configurable: true, value() { throw new Error("Crypto disabled"); } });
      }
      Object.defineProperty(navigator, "sendBeacon", { configurable: true, value() { throw new Error("Beacon disabled"); } });
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        return url.includes("/api/signup-page-analytics")
          ? Promise.reject(new Error("Analytics fetch disabled"))
          : originalFetch(input, init);
      };
    }, mode);
    let checkoutPayload: Record<string, unknown> | undefined;
    await page.route("**/api/checkout", async (route) => {
      checkoutPayload = route.request().postDataJSON();
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ checkoutUrl: "/conversion-tracking-complete" }) });
    });
    await mockCheckoutDestination(page);
    const dialog = await openForm(page);
    await fillForm(dialog);
    await dialog.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/conversion-tracking-complete$/);
    if (mode === "blocked-crypto") expect(checkoutPayload?.analytics).toBeUndefined();
    else expect(checkoutPayload?.analytics).toMatchObject({ visitorToken: expect.stringMatching(tokenPattern), journeyToken: expect.stringMatching(tokenPattern) });
    expect(browserErrors).toEqual([]);
  });
}

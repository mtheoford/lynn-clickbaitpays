import { expect, test, type Locator, type Page } from "@playwright/test";

const locales = [
  { code: "en", path: "/get-your-site", monthly: "Monthly", annual: "Annual" },
  { code: "fr", path: "/fr/get-your-site", monthly: "Mensuel", annual: "Annuel" },
  { code: "de", path: "/de/get-your-site", monthly: "Monatlich", annual: "Jährlich" },
] as const;
const placements = [
  { name: "hero", selector: ".cbp-price-option" },
  { name: "closing", selector: ".cbp-close-price-option" },
] as const;
const plans = ["monthly", "annual"] as const;
type Locale = typeof locales[number];
type Plan = typeof plans[number];

async function activate(locator: Locator, isMobile: boolean) {
  if (isMobile) {
    await locator.tap();
  } else {
    await locator.click();
  }
}

async function expectPlan(dialog: Locator, locale: Locale, plan: Plan) {
  for (const candidate of plans) {
    await expect(dialog.locator(".signup-plan-picker").getByRole("button", {
      name: new RegExp(locale[candidate]),
    })).toHaveAttribute("aria-pressed", String(candidate === plan));
  }
}

async function openCard(page: Page, selector: string, locale: Locale, plan: Plan, isMobile: boolean) {
  const card = page.locator(selector).filter({ hasText: locale[plan] });
  // A card that only looks clickable must fail even before interaction.
  await expect(card).toHaveRole("button");
  await expect(card).toBeEnabled();
  await activate(card, isMobile);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectPlan(dialog, locale, plan);
  return dialog;
}

test.beforeEach(async ({ context }) => {
  // Block app writes, including analytics, on both local and live targets.
  // Local checkout tests install a more specific mock after this default.
  await context.route("**/api/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, available: true }),
  }));
});

for (const locale of locales) {
  test(`${locale.code}: all purchase cards open the selected plan @smoke`, async ({ page, isMobile }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(locale.path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator(".cbp-offer")).toHaveAttribute("lang", locale.code);

    for (const placement of placements) {
      for (const plan of plans) {
        const dialog = await openCard(page, placement.selector, locale, plan, isMobile);
        const otherPlan = plan === "monthly" ? "annual" : "monthly";
        await activate(dialog.locator(".signup-plan-picker").getByRole("button", {
          name: new RegExp(locale[otherPlan]),
        }), isMobile);
        await expectPlan(dialog, locale, otherPlan);
        await activate(dialog.locator("header button"), isMobile);
        await expect(page.getByRole("dialog")).toHaveCount(0);
        // Reopening must restore this card's plan after switching inside the form.
        const reopened = await openCard(page, placement.selector, locale, plan, isMobile);
        await activate(reopened.locator("header button"), isMobile);
      }
    }
    // The shared dialog change must preserve both existing signup CTAs.
    const signupButtons = page.locator(".sales-button");
    await expect(signupButtons).toHaveCount(2);
    for (const signupButton of await signupButtons.all()) {
      await activate(signupButton, isMobile);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expectPlan(dialog, locale, "monthly");
      await activate(dialog.locator("header button"), isMobile);
    }
    expect(pageErrors).toEqual([]);
  });

  for (const placement of placements) {
    for (const plan of plans) {
      test(`${locale.code}: ${placement.name} ${plan} submits its plan to checkout`, async ({ page, isMobile }) => {
        test.skip(!!process.env.BASE_URL, "Live targets never submit signup forms.");
        let checkoutPayload: Record<string, unknown> | undefined;
        await page.route("**/api/checkout", async (route) => {
          checkoutPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ checkoutUrl: "/checkout-test-complete" }),
          });
        });
        await page.route("**/checkout-test-complete", (route) => route.fulfill({
          contentType: "text/html",
          body: "<h1>Mock checkout reached</h1>",
        }));
        await page.goto(`${locale.path}?source=your-name`);
        const dialog = await openCard(page, placement.selector, locale, plan, isMobile);
        await dialog.locator('[name="firstName"]').fill("Purchase");
        await dialog.locator('[name="lastName"]').fill("Regression");
        await dialog.locator('[name="email"]').fill("purchase-regression@example.invalid");
        await dialog.locator('[name="phone"]').fill("8015550123");
        await dialog.locator('[name="referralUsername"]').fill("regression-test");
        await dialog.locator('[name="acceptedTerms"]').check();
        await activate(dialog.locator('button[type="submit"]'), isMobile);
        await expect(page).toHaveURL(/\/checkout-test-complete$/);
        await expect(page.getByRole("heading", { name: "Mock checkout reached" })).toBeVisible();
        expect(checkoutPayload).toMatchObject({
          plan,
          locale: locale.code,
          source: "your-name",
          acceptedTerms: true,
          email: "purchase-regression@example.invalid",
          slug: "purchase-regression",
          referralUrl: "https://clickbaitpays.me/?ref=regression-test",
        });
      });
    }
  }
}

test("marketing root redirects to signup and both original CTAs work @smoke", async ({ page, isMobile }) => {
  if (!process.env.BASE_URL) {
    // Root routing is host-aware. Model the marketing host at the local server.
    await page.setExtraHTTPHeaders({
      "x-forwarded-host": new URL(process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org").hostname,
    });
  }
  await page.goto("/");
  await expect(page).toHaveURL(/\/get-your-site$/);
  await expect(page.locator(".cbp-offer")).toHaveAttribute("lang", "en");
  const signupButtons = page.locator(".sales-button");
  await expect(signupButtons).toHaveCount(2);
  for (const button of await signupButtons.all()) {
    await activate(button, isMobile);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectPlan(dialog, locales[0], "monthly");
    await activate(dialog.locator("header button"), isMobile);
  }
});

test("purchase cards support keyboard activation @smoke", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard navigation is covered on desktop.");
  await page.goto("/get-your-site");
  for (const [index, placement] of placements.entries()) {
    const card = page.locator(placement.selector).filter({ hasText: "Annual" });
    await card.focus();
    await expect(card).toBeFocused();
    await card.press(index === 0 ? "Enter" : "Space");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectPlan(dialog, locales[0], "annual");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

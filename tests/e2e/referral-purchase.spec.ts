import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));
});

for (const locale of ["en", "fr", "de"] as const) {
  test(`${locale} calculator uses the campaign purchase commission and separates withdrawal fees @smoke`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`${locale === "en" ? "" : `/${locale}`}/s/your-name`);
    await page.locator(".calculator-launch-button").click();
    const dialog = page.locator(".calculator-modal");
    await expect(dialog).toBeVisible();
    await dialog.locator(".simple-setup-grid > .planner-field select").selectOption("7");
    await dialog.locator(".referral-count-field input").fill("5");
    await dialog.locator(".simple-referral-settings select").selectOption("7");
    await dialog.locator(".simple-referral-settings .planner-choice button").filter({ hasText: /^3$/ }).click();
    await dialog.locator('.strategy-card[data-starting-campaigns="3"]').click();

    // Five people × three 2,400-USDT campaigns × 10% = 3,600 credited
    // at purchase. With the existing modeled withdrawal fee, net is 3,240.
    // The old click-based model would incorrectly show 4,860 net.
    const referral = dialog.locator(".outcome-card__referral-result > div").first();
    await expect(referral.locator("strong")).toHaveText(/\+3[,\.\s\u202f\u00a0]240[\.,]00 USDT/);
    await expect(referral.locator("span")).toContainText(/withdrawal fee|frais de retrait|Auszahlungsgebühr/);
    await expect(dialog.locator(".campaign-availability > p")).toContainText("19");
    await expect(dialog.locator(".campaign-availability > p")).not.toContainText(/awaiting confirmation|reste à confirmer|bestätigt werden/);
    await expect(dialog.locator(".outcome-card.is-withdraw .outcome-card__note").first()).toContainText(/buys|achète|Kampagnenkauf/);
  });
}

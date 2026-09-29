import { expect, test } from "@playwright/test";

for (const locale of ["en", "fr", "de"] as const) {
  test(`${locale} hero headline stays inside its column at responsive widths @smoke`, async ({ page, context }) => {
    await context.route("**/api/**", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }),
    }));
    await page.goto(`${locale === "en" ? "" : `/${locale}`}/s/your-name`);
    await page.evaluate(() => document.fonts.ready);
    // Cover the reported desktop width and both sides of the stacking breakpoints.
    for (const width of [1255, 1181, 1180, 981, 980, 768, 680, 390, 320, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.locator(".hero-copy").evaluate(copy => {
        const bounds = copy.getBoundingClientRect();
        const heading = copy.querySelector("h1")!;
        const card = document.querySelector(".welcome-feature")!.getBoundingClientRect();
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const lines = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0) lines.push({
              left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
            });
          }
        }
        return {
          copy: { left: bounds.left, right: bounds.right },
          card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom },
          lines,
        };
      });
      expect(layout.lines.length).toBeGreaterThan(0);
      for (const line of layout.lines) {
        const label = `${locale} at ${width}px`;
        expect(line.left, label).toBeGreaterThanOrEqual(layout.copy.left - 1);
        expect(line.right, label).toBeLessThanOrEqual(layout.copy.right + 1);
        expect(line.right, label).toBeLessThanOrEqual(width);
        const overlapsVideo = line.left < layout.card.right && line.right > layout.card.left
          && line.top < layout.card.bottom && line.bottom > layout.card.top;
        expect(overlapsVideo, label).toBe(false);
      }
    }
  });
}

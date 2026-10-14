import { expect, test } from "@playwright/test";
import {
  clippedText,
  pageScrollsSideways,
  routes,
  runAxe,
  textSpacingCss,
  useTheme,
} from "./helpers";
import type { Theme } from "./helpers";

const themes: Theme[] = ["light", "dark", "comfort"];

for (const route of routes) {
  test.describe(route, () => {
    for (const theme of themes) {
      test(`axe in the ${theme} theme: ${route}`, async ({ page }) => {
        await useTheme(page, theme);
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("data-kerb-theme", theme);
        await expect(page.locator("h1")).toBeVisible();
        expect(await runAxe(page)).toEqual([]);
      });
    }

    // WCAG 1.4.10: 1280px at 400% is 320 CSS pixels wide
    test(`400% zoom: ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 256 });
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(await pageScrollsSideways(page)).toBe(false);
      expect(await clippedText(page)).toEqual([]);
    });

    test(`text spacing: ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.addStyleTag({ content: textSpacingCss });
      await expect(page.locator("h1")).toBeVisible();
      expect(await pageScrollsSideways(page)).toBe(false);
      expect(await clippedText(page)).toEqual([]);
    });

    // Read by scripts/passport-stats.ts for the passport's "Comfort theme" field
    test(`comfort theme at 200% zoom: ${route}`, async ({ page }) => {
      await useTheme(page, "comfort");
      await page.setViewportSize({ width: 640, height: 512 });
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-kerb-theme", "comfort");
      expect(await pageScrollsSideways(page)).toBe(false);
      expect(await clippedText(page)).toEqual([]);
    });
  });
}

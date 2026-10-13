import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Opens one story on its own, without the Storybook UI around it. */
export async function openStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
}

/** The Kerb ring: a yellow outer ring drawn as a box-shadow. */
export async function expectFocusRing(locator: Locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toHaveCSS("box-shadow", /rgb\(255, 194, 26\)/);
}

export function liveRegion(page: Page, urgency: "polite" | "assertive") {
  return page.locator(`[aria-live="${urgency}"]`);
}

/**
 * Moves focus to the next control, or the previous one with `back`.
 * Safari only stops at text fields with a plain Tab: buttons are reached with
 * Option+Tab (unless "Press Tab to highlight each item" is switched on), so
 * that is the key WebKit gets.
 */
export async function tab(page: Page, { back = false } = {}) {
  const webkit = page.context().browser()?.browserType().name() === "webkit";
  await page.keyboard.press(
    `${back ? "Shift+" : ""}${webkit ? "Alt+" : ""}Tab`,
  );
}

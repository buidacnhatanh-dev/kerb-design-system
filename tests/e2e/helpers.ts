import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Opens one story on its own, without the Storybook UI around it, optionally in a theme. */
export async function openStory(
  page: Page,
  id: string,
  { theme }: { theme?: "light" | "dark" | "comfort" } = {},
) {
  const globals = theme ? `&globals=theme:${theme}` : "";
  await page.goto(`/iframe.html?id=${id}&viewMode=story${globals}`);
  if (theme) {
    await expect(page.locator("html")).toHaveAttribute(
      "data-kerb-theme",
      theme,
    );
  }
  // Attached rather than visible: some stories render nothing of their own (toasts)
  await expect(page.locator("#storybook-root > *").first()).toBeAttached();
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

/** Saves a preference the way KerbProvider stores it for Storybook, before the page loads. */
export async function savePreferences(
  page: Page,
  prefs: Record<string, string | number | boolean>,
) {
  const saved = JSON.stringify({ v: 1, prefs });
  await page.addInitScript({
    content: `localStorage.setItem("kerb-storybook", ${JSON.stringify(saved)})`,
  });
}

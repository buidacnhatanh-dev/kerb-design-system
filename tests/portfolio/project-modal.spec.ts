import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { runAxe } from "../docs/helpers";
import { expectFocusRing, tab } from "../e2e/helpers";

const stats = JSON.parse(
  readFileSync(
    new URL("../../apps/docs/content/stats.json", import.meta.url),
    "utf8",
  ),
) as { axeViolations: number; keyboardTests: number; gzipKb: number };

test.describe("Portfolio project modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  const card = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: /^Kerb design system/ });

  test("opens from the project card with focus on Close", async ({ page }) => {
    await expect(card(page)).toHaveAttribute("aria-haspopup", "dialog");
    await card(page).focus();
    await page.keyboard.press("Enter");

    const modal = page.getByRole("dialog", { name: "Kerb" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Design system · 2026")).toBeVisible();
    await expectFocusRing(modal.getByRole("button", { name: "Close" }));
    await expect(
      modal.getByRole("link", { name: "Read the case study" }),
    ).toBeVisible();
    expect(await runAxe(page)).toEqual([]);
  });

  test("tabs switch with the arrow keys, and the chips change with them", async ({
    page,
  }) => {
    await card(page).focus();
    await page.keyboard.press("Enter");
    const modal = page.getByRole("dialog", { name: "Kerb" });
    const tabs = modal.getByRole("tablist", { name: "About this project" });

    // From Close into the tab list, on the selected tab
    await tab(page);
    await expectFocusRing(tabs.getByRole("tab", { name: "Overview" }));
    await expect(modal.getByRole("tabpanel")).toContainText(
      "Thirteen accessibility first",
    );
    await expect(modal.getByRole("list", { name: "Tools" })).toContainText(
      "Design tokens",
    );

    await page.keyboard.press("ArrowRight");
    await expect(tabs.getByRole("tab", { name: "Process" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(modal.getByRole("tabpanel")).toContainText(
      "Token system first",
    );
    await expect(modal.getByRole("list", { name: "Tools" })).toContainText(
      "VoiceOver",
    );

    await page.keyboard.press("ArrowRight");
    const outcome = modal.getByRole("tabpanel");
    await expect(outcome).toContainText(
      `${stats.axeViolations} axe violations, ${stats.keyboardTests} keyboard tests in CI, ${stats.gzipKb} kB gzipped.`,
    );
    await expect(modal.getByRole("list", { name: "Tools" })).toContainText(
      "npm",
    );

    // Wraps back to the first tab
    await page.keyboard.press("ArrowRight");
    await expect(tabs.getByRole("tab", { name: "Overview" })).toBeFocused();
  });

  test("Esc closes it and focus returns to the project card", async ({
    page,
  }) => {
    await card(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Kerb" })).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(card(page)).toBeFocused();
  });

  test("Close returns focus to the project card too", async ({ page }) => {
    await card(page).click();
    const modal = page.getByRole("dialog", { name: "Kerb" });
    await modal.getByRole("button", { name: "Close" }).click();

    await expect(modal).toBeHidden();
    await expect(card(page)).toBeFocused();
  });
});

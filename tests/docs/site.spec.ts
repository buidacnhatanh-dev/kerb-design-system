import { expect, test } from "@playwright/test";

test.describe("Docs site keyboard", () => {
  test("the skip link is the first stop and goes to the main content", async ({ page }) => {
    await page.goto("/components/button");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("the current page is marked in the nav", async ({ page }) => {
    await page.goto("/components/dialog");
    const nav = page.getByRole("navigation", { name: "Docs" });
    await expect(nav.getByRole("link", { name: "Dialog" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Button" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("/ opens search; arrows choose a result, Enter opens it, the count is announced", async ({
    page,
  }) => {
    await page.goto("/");
    // Keys before hydration go nowhere
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Search docs" });
    const field = dialog.getByRole("combobox", { name: "Page or heading" });
    await expect(field).toBeFocused();

    await field.fill("date picker");
    await expect(dialog.getByText(/^\d+ results?\.$/)).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toHaveText(/^\d+ results?\.$/);
    const options = dialog.getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await expect(options.first()).toContainText("Date picker");

    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(field).toHaveAttribute("aria-activedescendant", (await options.nth(1).getAttribute("id"))!);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/components\/date-picker$/);
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Date picker" })).toBeVisible();
  });

  test("search says when nothing matches", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Search docs" }).click();
    await page.getByRole("combobox", { name: "Page or heading" }).fill("zzzz");
    await expect(page.getByText("No results.")).toBeVisible();
    // A search field's own Esc clears it first; the next Esc closes the dialog
    await page.keyboard.press("Escape");
    await expect(page.getByRole("combobox", { name: "Page or heading" })).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Search docs" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Search docs" })).toBeFocused();
  });

  test("Try it with: each toggle is pressed and changes only the example", async ({ page }) => {
    await page.goto("/components/button");
    await page.waitForLoadState("networkidle");
    const toolbar = page.getByRole("group", { name: "Try it with:" });
    const frame = page.locator(".example-frame");

    for (const [name, attribute, value] of [
      ["Keyboard only", "data-kerb-focus-on-click", ""],
      ["Comfort", "data-kerb-theme", "comfort"],
      ["Reduce motion", "data-kerb-motion", "reduced"],
      ["200% zoom", "data-zoom", ""],
    ] as const) {
      const toggle = toolbar.getByRole("button", { name });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(frame).toHaveAttribute(attribute, value);
    }
    // The page itself keeps its own theme
    await expect(page.locator("html")).not.toHaveAttribute("data-kerb-theme", "comfort");
  });

  test("Copy puts the code on the clipboard and says so", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/install");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Copy" }).first().click();
    await expect(page.locator('[aria-live="polite"]')).toHaveText("Code copied");
    expect(await page.evaluate("navigator.clipboard.readText()")).toBe(
      "npm install @kerb/react",
    );
  });

  test("Preferences open as a side panel on a large screen; Esc closes it and returns focus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/components/button");
    await page.waitForLoadState("networkidle");
    const toggle = page.getByRole("button", { name: "Preferences", exact: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const panel = page.getByRole("complementary", { name: "Preferences" });
    await expect(panel.getByRole("button", { name: "Close preferences" })).toBeFocused();

    await panel.getByRole("radio", { name: "Dyslexia friendly" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-kerb-theme", "comfort");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("on a phone, Preferences is a sheet and the nav is in the menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Preferences", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Your preferences" });
    await expect(sheet.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("button", { name: "Close" })).toBeFocused();
    await menu.getByRole("link", { name: "Dialog" }).click();
    await expect(page).toHaveURL(/\/components\/dialog$/);
    await expect(menu).toBeHidden();
  });
});

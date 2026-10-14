import { expect, test } from "@playwright/test";
import { expectProxyRing, openStory, tab } from "./helpers";

test.describe("RadioGroup keyboard", () => {
  test("Tab enters on the selected option, with the ring on its circle", async ({
    page,
  }) => {
    await openStory(page, "components-radiogroup--controlled");
    const express = page.getByRole("radio", { name: "Express" });

    await tab(page);

    await expect(express).toBeFocused();
    await expect(express.locator("+ *")).toHaveCSS(
      "box-shadow",
      /rgb\(255, 194, 26\)/,
    );
  });

  test("Tab enters on the first option when none is selected", async ({
    page,
  }) => {
    await openStory(page, "components-radiogroup--nothing-selected");

    await tab(page);

    await expect(page.getByRole("radio", { name: "Standard" })).toBeFocused();
    await expect(
      page.getByRole("radio", { name: "Standard" }),
    ).not.toBeChecked();
  });

  test("arrow keys move and select", async ({ page }) => {
    await openStory(page, "components-radiogroup--controlled");
    await expect(page.getByText("Selected: express")).toBeVisible();

    await tab(page);
    await page.keyboard.press("ArrowDown");
    // The ring follows the arrow keys, in WebKit too
    await expectProxyRing(page.getByRole("radio", { name: "Pick up" }));
    await expect(page.getByRole("radio", { name: "Pick up" })).toBeChecked();
    await expect(page.getByText("Selected: pickup")).toBeVisible();

    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("radio", { name: "Express" })).toBeChecked();

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("radio", { name: "Standard" })).toBeChecked();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Express" })).toBeChecked();
    await expect(page.getByText("Selected: express")).toBeVisible();
  });

  test("Tab leaves the group in one step, and Shift+Tab comes back to the selected option", async ({
    page,
  }) => {
    await openStory(page, "components-radiogroup--in-a-form");

    await tab(page);
    await expect(page.getByRole("radio", { name: "Standard" })).toBeFocused();

    await tab(page);
    await expect(page.getByRole("button", { name: "Continue" })).toBeFocused();

    await tab(page, { back: true });
    await expect(page.getByRole("radio", { name: "Standard" })).toBeFocused();
  });

  test("a disabled option is skipped by the arrow keys", async ({ page }) => {
    await openStory(page, "components-radiogroup--disabled-option");

    await tab(page);
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: "Express" })).toBeChecked();

    // Pick up is disabled and can never be selected. Where the browser goes
    // instead is its own business: Chromium and Firefox wrap to Standard, WebKit stays put
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: "Pick up" })).toBeDisabled();
    await expect(
      page.getByRole("radio", { name: "Pick up" }),
    ).not.toBeChecked();
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  });
});

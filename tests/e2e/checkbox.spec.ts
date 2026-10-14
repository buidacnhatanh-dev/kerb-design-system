import { expect, test } from "@playwright/test";
import { openStory, tab } from "./helpers";

test.describe("Checkbox keyboard", () => {
  test("Tab reaches the checkbox and the ring is drawn on the box", async ({
    page,
  }) => {
    await openStory(page, "components-checkbox--unchecked");
    const checkbox = page.getByRole("checkbox", {
      name: "Email me booking updates",
    });

    await tab(page);

    await expect(checkbox).toBeFocused();
    await expect(checkbox.locator("+ *")).toHaveCSS(
      "box-shadow",
      /rgb\(255, 194, 26\)/,
    );
  });

  test("Space toggles", async ({ page }) => {
    await openStory(page, "components-checkbox--unchecked");
    const checkbox = page.getByRole("checkbox");

    await tab(page);
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();

    await page.keyboard.press("Space");
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toBeFocused();
  });

  test("a click anywhere on the row toggles, and the row is at least 44px high", async ({
    page,
  }) => {
    await openStory(page, "components-checkbox--unchecked");
    const checkbox = page.getByRole("checkbox");
    const row = page.locator("label", { hasText: "Email me booking updates" });

    const box = await row.boundingBox();
    if (!box) throw new Error("The row is not rendered");
    expect(box.height).toBeGreaterThanOrEqual(44);

    // The top edge of the row, well above the 22px box
    await page.mouse.click(box.x + box.width - 4, box.y + 2);
    await expect(checkbox).toBeChecked();
  });

  test("mixed is exposed, and Space moves through a select all", async ({
    page,
  }) => {
    await openStory(page, "components-checkbox--select-all");
    const all = page.getByRole("checkbox", { name: "All toppings" });

    await expect(all).toBeChecked({ indeterminate: true });

    await tab(page);
    await expect(all).toBeFocused();
    await page.keyboard.press("Space");
    await expect(all).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: "Mushrooms" }),
    ).toBeChecked();

    await page.keyboard.press("Space");
    await expect(all).not.toBeChecked();

    // Checking one item makes "all" mixed again
    await tab(page);
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("checkbox", { name: "Mushrooms" }),
    ).toBeChecked();
    await expect(all).toBeChecked({ indeterminate: true });
  });

  test("a disabled checkbox is skipped by Tab", async ({ page }) => {
    await openStory(page, "components-checkbox--disabled");
    const checkbox = page.getByRole("checkbox");

    await tab(page);

    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeFocused();
  });

  test("an error is read with the checkbox and stays until it is fixed", async ({
    page,
  }) => {
    await openStory(page, "components-checkbox--error-with-hint");
    const checkbox = page.getByRole("checkbox", {
      name: "I accept the terms and conditions",
    });

    await tab(page);
    await expect(checkbox).toBeFocused();
    await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    await expect(checkbox).toHaveAccessibleDescription(
      "You can read them before you order Accept the terms to continue",
    );

    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
  });
});

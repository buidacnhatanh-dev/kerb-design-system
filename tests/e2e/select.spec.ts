import { expect, test } from "@playwright/test";
import { expectFocusRing, openStory, savePreferences, tab } from "./helpers";

test.describe("Select keyboard", () => {
  test("Tab reaches the select and shows the focus ring", async ({ page }) => {
    await openStory(page, "components-select--default");
    const select = page.getByRole("combobox", { name: "Country" });

    await tab(page);

    await expectFocusRing(select);
    await expect(select).toHaveValue("de");
  });

  test("typing a letter changes the value without opening anything", async ({
    page,
  }) => {
    await openStory(page, "components-select--default");
    const select = page.getByRole("combobox", { name: "Country" });

    await tab(page);
    await page.keyboard.press("f");
    await expect(select).toHaveValue("fr");

    // Letters typed close together are read as one search ("fp"), so let that run out
    await page.waitForTimeout(1500);
    await page.keyboard.press("p");
    await expect(select).toHaveValue("pl");
    await expect(select).toBeFocused();
  });

  test("the error is read with the field", async ({ page }) => {
    await openStory(page, "components-select--error");
    const select = page.getByRole("combobox", { name: "Country" });

    await tab(page);

    await expect(select).toBeFocused();
    await expect(select).toHaveAttribute("aria-invalid", "true");
    await expect(select).toHaveAccessibleDescription("Choose a country");
  });

  test("a disabled select is skipped by Tab", async ({ page }) => {
    await openStory(page, "components-select--disabled");
    const select = page.getByRole("combobox", { name: "Country" });

    await tab(page);

    await expect(select).toBeDisabled();
    await expect(select).not.toBeFocused();
  });

  test("keeps a 44px hit area at compact density", async ({ page }) => {
    await savePreferences(page, { density: "compact" });
    await openStory(page, "components-select--default");
    const select = page.getByRole("combobox", { name: "Country" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-kerb-density",
      "compact",
    );

    const box = await select.boundingBox();
    if (!box) throw new Error("The select is not rendered");
    expect(box.height).toBe(40);

    // 1px above and 1px below the visible select still reach it: 2 + 40 + 2 = 44
    await page.mouse.click(box.x + box.width / 2, box.y - 1);
    await expect(select).toBeFocused();

    await page.keyboard.press("Escape");
    await select.blur();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height + 1);
    await expect(select).toBeFocused();
  });
});

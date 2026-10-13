import { expect, test } from "@playwright/test";
import { expectFocusRing, openStory, savePreferences, tab } from "./helpers";

test.describe("TextField keyboard", () => {
  test("Tab reaches the input, shows the focus ring and typing fills it", async ({
    page,
  }) => {
    await openStory(page, "components-textfield--empty");
    const input = page.getByRole("textbox", { name: "Email" });

    await tab(page);
    await expectFocusRing(input);

    await page.keyboard.type("nhatanh@example.com");
    await expect(input).toHaveValue("nhatanh@example.com");
  });

  test("the hint and the error are read with the field, in that order", async ({
    page,
  }) => {
    await openStory(page, "components-textfield--error");
    const input = page.getByRole("textbox", { name: "Email" });

    await tab(page);

    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(
      "For booking updates Enter a full email address",
    );
  });

  test("the password toggle is the next Tab stop and works with Space and Enter", async ({
    page,
  }) => {
    await openStory(page, "components-textfield--password");
    const input = page.getByLabel("Password", { exact: true });
    const toggle = page.getByRole("button", { name: "Show password" });

    await tab(page);
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("type", "password");

    await tab(page);
    await expectFocusRing(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(input).toHaveAttribute("type", "text");
    await expect(toggle).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(input).toHaveAttribute("type", "password");

    await tab(page, { back: true });
    await expect(input).toBeFocused();
  });

  test("a disabled field is skipped by Tab", async ({ page }) => {
    await openStory(page, "components-textfield--disabled");
    const input = page.getByRole("textbox", { name: "Email" });

    await tab(page);

    await expect(input).toBeDisabled();
    await expect(input).not.toBeFocused();
  });

  test("keeps a 44px hit area at compact density", async ({ page }) => {
    await savePreferences(page, { density: "compact" });
    await openStory(page, "components-textfield--empty");
    const input = page.getByRole("textbox", { name: "Email" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-kerb-density",
      "compact",
    );

    const box = await input.boundingBox();
    if (!box) throw new Error("The input is not rendered");
    expect(box.height).toBe(40);

    // 1px above and 1px below the visible input still reach it: 2 + 40 + 2 = 44
    await page.mouse.click(box.x + box.width / 2, box.y - 1);
    await expect(input).toBeFocused();

    await input.blur();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height + 1);
    await expect(input).toBeFocused();
  });
});

import { expect, test } from "@playwright/test";
import { expectFocusRing, liveRegion, openStory, tab } from "./helpers";

test.describe("Button keyboard", () => {
  test("Tab reaches the button and shows the focus ring", async ({ page }) => {
    await openStory(page, "components-button--primary");
    const button = page.getByRole("button", { name: "Save changes" });

    await tab(page);

    await expectFocusRing(button);
  });

  for (const key of ["Enter", "Space"]) {
    test(`${key} activates the button`, async ({ page }) => {
      await openStory(page, "components-button--loading-on-press");
      const button = page.getByRole("button", { name: "Save changes" });
      await expect(page.getByText("Saved 0 times")).toBeVisible();

      await tab(page);
      await page.keyboard.press(key);

      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(liveRegion(page, "polite")).toHaveText("Saving");
      await expect(page.getByText("Saved 1 times")).toBeVisible();
      await expect(button).not.toHaveAttribute("aria-busy");
      await expect(liveRegion(page, "polite")).toHaveText("Changes saved");
      // Still the same button, still focused, with the same name
      await expect(button).toBeFocused();
    });
  }

  test("a loading button ignores further presses and keeps focus", async ({
    page,
  }) => {
    await openStory(page, "components-button--loading-on-press");
    const button = page.getByRole("button", { name: "Save changes" });

    await tab(page);
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");

    await expect(button).toBeFocused();
    await expect(page.getByText("Saved 1 times")).toBeVisible();
    await expect(button).not.toHaveAttribute("aria-busy");
    // Give a second save the time it would need, then check it never started
    await page.waitForTimeout(300);
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(page.getByText("Saved 1 times")).toBeVisible();
  });

  test("a disabled button stays in the Tab order and explains itself", async ({
    page,
  }) => {
    await openStory(page, "components-button--disabled-with-reason");
    const button = page.getByRole("button", { name: "Save changes" });
    const reason = page.getByRole("tooltip", { includeHidden: true });

    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(reason).toBeHidden();

    await tab(page);
    await expectFocusRing(button);
    await expect(reason).toBeVisible();
    await expect(button).toHaveAccessibleDescription(
      "Fill in your email address first",
    );

    // Esc hides the reason and leaves focus where it is
    await page.keyboard.press("Escape");
    await expect(reason).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("Tab moves through buttons in DOM order, and Shift+Tab goes back", async ({
    page,
  }) => {
    await openStory(page, "components-button--with-icons");
    const first = page.getByRole("button", { name: "Save changes" });
    const second = page.getByRole("button", { name: "More options" });

    await tab(page);
    await expect(first).toBeFocused();
    await tab(page);
    await expect(second).toBeFocused();
    await tab(page, { back: true });
    await expect(first).toBeFocused();
  });
});

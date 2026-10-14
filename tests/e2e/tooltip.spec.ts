import { expect, test } from "@playwright/test";
import { expectFocusRing, openStory, tab } from "./helpers";

test.describe("Tooltip keyboard and pointer", () => {
  test("appears at once on keyboard focus and describes the trigger", async ({
    page,
  }) => {
    await openStory(page, "components-tooltip--default");
    const trigger = page.getByRole("button", { name: "Copy link" });
    const tooltip = page.getByRole("tooltip");

    await expect(tooltip).toBeHidden();
    await tab(page);

    await expectFocusRing(trigger);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("Copy link to clipboard");
    await expect(trigger).toHaveAccessibleDescription("Copy link to clipboard");
  });

  test("Esc hides it and the trigger keeps focus", async ({ page }) => {
    await openStory(page, "components-tooltip--default");
    const trigger = page.getByRole("button", { name: "Copy link" });

    await tab(page);
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("tooltip")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("sits above the trigger, in the page, and not on top of it", async ({
    page,
  }) => {
    await openStory(page, "components-tooltip--default");
    await tab(page);
    const tooltip = page.getByRole("tooltip");
    const trigger = page.getByRole("button", { name: "Copy link" });
    await expect(tooltip).toBeVisible();

    // Polled: Firefox applies anchor positioning a frame after the tooltip appears
    await expect
      .poll(async () => {
        const own = await tooltip.boundingBox();
        const target = await trigger.boundingBox();
        if (!own || !target) return false;
        return own.y + own.height <= target.y && own.x >= 0;
      })
      .toBe(true);
  });

  test("shows after resting on the trigger and stays while the pointer moves onto it", async ({
    page,
  }) => {
    await openStory(page, "components-tooltip--default");
    const trigger = page.getByRole("button", { name: "Copy link" });
    const tooltip = page.getByRole("tooltip");

    await trigger.hover();
    await expect(tooltip).toBeVisible();

    const box = await tooltip.boundingBox();
    if (!box) throw new Error("Not rendered");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 5,
    });
    await page.waitForTimeout(400);
    await expect(tooltip).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });

  test("a disabled Button explains itself through the same Tooltip", async ({
    page,
  }) => {
    await openStory(page, "components-button--disabled-with-reason");
    const button = page.getByRole("button", { name: "Save changes" });

    await tab(page);
    await expect(page.getByRole("tooltip")).toHaveText(
      "Fill in your email address first",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
    await expect(button).toBeFocused();
  });
});

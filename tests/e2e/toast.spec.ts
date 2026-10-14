import { expect, test } from "@playwright/test";
import { liveRegion, openStory, tab } from "./helpers";

test.describe("Toast keyboard", () => {
  test("showing a toast leaves focus where it was", async ({ page }) => {
    await openStory(page, "components-toast--interactive");
    const trigger = page.getByRole("button", { name: "Save project" });

    await tab(page);
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText("Project saved");
    await expect(trigger).toBeFocused();
    await expect(liveRegion(page, "polite")).toHaveText(
      "Project saved. Your changes are live.",
    );
  });

  test("F6 moves to the toast's action and back", async ({ page }) => {
    await openStory(page, "components-toast--interactive");
    const trigger = page.getByRole("button", { name: "Delete item" });

    await tab(page);
    await tab(page);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(liveRegion(page, "polite")).toContainText(
      "Press F6 to reach Undo.",
    );

    await page.keyboard.press("F6");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();

    await page.keyboard.press("F6");
    await expect(trigger).toBeFocused();
  });

  test("Dismiss notification closes it from the keyboard and focus goes back", async ({
    page,
  }) => {
    await openStory(page, "components-toast--interactive");
    const trigger = page.getByRole("button", { name: "Upload image" });

    await tab(page);
    await tab(page);
    await tab(page);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(liveRegion(page, "assertive")).toContainText(
      "Could not upload image.",
    );

    await page.keyboard.press("F6");
    await expect(page.getByRole("button", { name: "Try again" })).toBeFocused();
    await tab(page);
    await expect(
      page.getByRole("button", { name: "Dismiss notification" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("an error toast stays until dismissed", async ({ page }) => {
    await openStory(page, "components-toast--error");
    const toasts = page.getByRole("region", { name: "Notifications" });
    await expect(toasts).toContainText("Could not upload image");

    // Longer than the 6 second default
    await page.waitForTimeout(6500);

    await expect(toasts).toContainText("Could not upload image");
  });
});

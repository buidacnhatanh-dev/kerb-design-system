import { expect, test } from "@playwright/test";
import { expectFocusRing, liveRegion, openStory, tab } from "./helpers";

const themes = ["light", "dark", "comfort"] as const;

for (const theme of themes) {
  test.describe(`Dialog keyboard, ${theme} theme`, () => {
    test("opens from the trigger with Enter and focus lands on the first field", async ({
      page,
    }) => {
      await openStory(page, "components-dialog--default", { theme });
      const trigger = page.getByRole("button", { name: "Rename project" });

      await tab(page);
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await page.keyboard.press("Enter");

      const dialog = page.getByRole("dialog", { name: "Rename project" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(
        "The new name shows everywhere this project is shared.",
      );
      await expectFocusRing(
        page.getByRole("textbox", { name: "Project name" }),
      );
    });

    test("Tab moves to the next element and wraps from last to first", async ({
      page,
    }) => {
      await openStory(page, "components-dialog--default", { theme });
      await tab(page);
      await page.keyboard.press("Enter");
      const field = page.getByRole("textbox", { name: "Project name" });
      await expect(field).toBeFocused();

      await tab(page);
      await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
      await tab(page);
      await expect(
        page.getByRole("button", { name: "Save name" }),
      ).toBeFocused();
      await tab(page);
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await tab(page);
      await expect(field).toBeFocused();
    });

    test("Shift+Tab moves back and wraps from first to last", async ({
      page,
    }) => {
      await openStory(page, "components-dialog--default", { theme });
      await tab(page);
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("textbox", { name: "Project name" }),
      ).toBeFocused();

      await tab(page, { back: true });
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await tab(page, { back: true });
      await expect(
        page.getByRole("button", { name: "Save name" }),
      ).toBeFocused();
    });

    test("Esc closes and returns focus to the trigger", async ({ page }) => {
      await openStory(page, "components-dialog--default", { theme });
      const trigger = page.getByRole("button", { name: "Rename project" });
      await tab(page);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expectFocusRing(trigger);
    });

    test("Enter activates the focused button, which closes and returns focus", async ({
      page,
    }) => {
      await openStory(page, "components-dialog--default", { theme });
      const trigger = page.getByRole("button", { name: "Rename project" });
      await tab(page);
      await page.keyboard.press("Enter");
      await tab(page);
      await tab(page);
      await expect(
        page.getByRole("button", { name: "Save name" }),
      ).toBeFocused();

      await page.keyboard.press("Enter");

      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  });
}

test.describe("Dialog", () => {
  test("a danger dialog starts on Cancel and Enter there keeps the project", async ({
    page,
  }) => {
    await openStory(page, "components-dialog--danger");
    const trigger = page.getByRole("button", { name: "Delete project" });
    await tab(page);
    await page.keyboard.press("Enter");

    await expectFocusRing(page.getByRole("button", { name: "Keep project" }));
    await expect(page.getByRole("dialog")).toHaveAccessibleName(
      "Delete “Portfolio 2026”?",
    );

    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("the page behind is inert while it is open", async ({ page }) => {
    await openStory(page, "components-dialog--default");
    await tab(page);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();

    await expect(page.locator("[data-kerb-app-root]")).toHaveAttribute(
      "inert",
      "",
    );
    // The trigger behind the backdrop cannot take focus
    const trigger = page.locator("[data-kerb-app-root] button", {
      hasText: "Rename project",
    });
    await trigger.focus();
    await expect(trigger).not.toBeFocused();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-kerb-app-root]")).not.toHaveAttribute(
      "inert",
    );
  });

  test("a backdrop click closes a default dialog but not a danger dialog", async ({
    page,
  }) => {
    await openStory(page, "components-dialog--default");
    await tab(page);
    await page.keyboard.press("Enter");
    await page.mouse.click(5, 5);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await openStory(page, "components-dialog--danger");
    await tab(page);
    await page.keyboard.press("Enter");
    await page.mouse.click(5, 5);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("when the trigger is gone, focus goes to the page and the close is announced", async ({
    page,
  }) => {
    await openStory(page, "components-dialog--trigger-removed");
    await tab(page);
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Keep project" }),
    ).toBeFocused();

    await tab(page);
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByText("The project was deleted.")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).toBeFocused();
    await expect(liveRegion(page, "polite")).toHaveText("Dialog closed");
  });
});

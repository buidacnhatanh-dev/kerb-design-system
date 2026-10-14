import { expect, test } from "@playwright/test";
import { expectFocusRing, openStory, tab } from "./helpers";

test.describe("Tabs keyboard", () => {
  test("Tab reaches the selected tab, Left and Right move and select, wrapping", async ({
    page,
  }) => {
    await openStory(page, "components-tabs--automatic");
    const overview = page.getByRole("tab", { name: "Overview" });

    await tab(page);
    await expectFocusRing(overview);

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Tokens" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Tokens" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tabpanel")).toContainText("semantic tokens");

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(overview).toBeFocused();
    await expect(overview).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Tests" })).toBeFocused();
  });

  test("Home and End go to the first and last tab", async ({ page }) => {
    await openStory(page, "components-tabs--automatic");
    await tab(page);

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Tests" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("tab", { name: "Overview" })).toBeFocused();
  });

  test("manual: arrows move focus only, Enter and Space select", async ({
    page,
  }) => {
    await openStory(page, "components-tabs--manual");
    await tab(page);

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Tokens" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("Enter");
    await expect(page.getByRole("tab", { name: "Tokens" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(page.getByRole("tab", { name: "Tests" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("Tab moves from the tab list into the panel", async ({ page }) => {
    await openStory(page, "components-tabs--automatic");
    await tab(page);

    await tab(page);
    await expectFocusRing(page.getByRole("tabpanel", { name: "Overview" }));
  });

  test("Tab moves into the panel's own controls when it has some", async ({
    page,
  }) => {
    await openStory(page, "components-tabs--panel-with-controls");
    await tab(page);

    await tab(page);
    await expect(
      page.getByRole("button", { name: "See the test report" }),
    ).toBeFocused();
  });
});

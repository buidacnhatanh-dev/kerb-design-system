import { expect, test } from "@playwright/test";
import { expectFocusRing, openStory, tab } from "./helpers";

// The Filled story: de-DE, 18 November 2026
test.describe("DatePicker keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await openStory(page, "components-datepicker--filled");
  });

  const field = (page: import("@playwright/test").Page) =>
    page.getByRole("textbox", { name: "Workshop date" });
  const button = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: "Choose date" });
  const calendar = (page: import("@playwright/test").Page) =>
    page.getByRole("dialog", { name: "Workshop date" });

  test("people can type the date without the calendar", async ({ page }) => {
    await tab(page);
    await expectFocusRing(field(page));
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("1.2.2027");
    await tab(page);

    await expect(field(page)).toHaveValue("01.02.2027");
    await expect(field(page)).not.toHaveAttribute("aria-invalid");
  });

  test("an invalid date shows the error pattern on blur", async ({ page }) => {
    await tab(page);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("31.02.2027");
    await expect(field(page)).not.toHaveAttribute("aria-invalid");
    await tab(page);

    await expect(field(page)).toHaveAttribute("aria-invalid", "true");
    await expect(field(page)).toHaveAccessibleDescription(
      "Format DD.MM.YYYY Enter a real date in the format DD.MM.YYYY",
    );
  });

  test("opens from the button with focus on the selected day, below the field", async ({
    page,
  }) => {
    await tab(page);
    await tab(page);
    await expectFocusRing(button(page));
    await page.keyboard.press("Enter");

    await expect(calendar(page)).toBeVisible();
    const selected = calendar(page).getByRole("button", {
      name: /18\. November 2026/,
    });
    await expect(selected).toBeFocused();
    await expect(
      calendar(page).getByRole("heading", { name: "November 2026" }),
    ).toBeVisible();

    await expect
      .poll(async () => {
        const own = await calendar(page).boundingBox();
        const anchor = await field(page).boundingBox();
        if (!own || !anchor) return false;
        return own.y >= anchor.y + anchor.height && own.x >= 0;
      })
      .toBe(true);
  });

  test("arrows, Page Up and Down, Home and End move through the grid; Enter selects", async ({
    page,
  }) => {
    await button(page).focus();
    await page.keyboard.press("Enter");
    const focusedName = () => page.locator(":focus").getAttribute("aria-label");

    await page.keyboard.press("ArrowRight");
    await expect.poll(focusedName).toMatch(/19\. November 2026/);
    await expectFocusRing(page.locator(":focus"));
    await page.keyboard.press("ArrowDown");
    await expect.poll(focusedName).toMatch(/26\. November 2026/);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(focusedName).toMatch(/18\. November 2026/);

    // Week starts on Monday in de-DE
    await page.keyboard.press("Home");
    await expect.poll(focusedName).toMatch(/Montag, 16\. November 2026/);
    await page.keyboard.press("End");
    await expect.poll(focusedName).toMatch(/Sonntag, 22\. November 2026/);

    await page.keyboard.press("PageDown");
    await expect.poll(focusedName).toMatch(/22\. Dezember 2026/);
    await expect(
      calendar(page).getByRole("heading", { name: "Dezember 2026" }),
    ).toBeVisible();
    await page.keyboard.press("Shift+PageDown");
    await expect.poll(focusedName).toMatch(/22\. Dezember 2027/);
    await page.keyboard.press("Shift+PageUp");
    await page.keyboard.press("PageUp");
    await expect.poll(focusedName).toMatch(/22\. November 2026/);

    await page.keyboard.press("Enter");

    await expect(calendar(page)).toBeHidden();
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveValue("22.11.2026");
  });

  test("Esc closes the calendar and returns focus to the button", async ({
    page,
  }) => {
    await button(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowRight");

    await page.keyboard.press("Escape");

    await expect(calendar(page)).toBeHidden();
    await expectFocusRing(button(page));
    await expect(field(page)).toHaveValue("18.11.2026");
  });

  test("a click on a day selects it", async ({ page }) => {
    await button(page).click();
    await calendar(page)
      .getByRole("button", { name: /25\. November 2026/ })
      .click();

    await expect(calendar(page)).toBeHidden();
    await expect(field(page)).toHaveValue("25.11.2026");
  });
});

test("the month heading is announced when it changes", async ({ page }) => {
  await openStory(page, "components-datepicker--filled");
  await page.getByRole("button", { name: "Choose date" }).click();
  await page.getByRole("button", { name: "Next month" }).click();

  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    "Dezember 2026",
  );
});

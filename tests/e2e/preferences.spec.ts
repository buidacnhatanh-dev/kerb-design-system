import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { expectFocusRing, liveRegion, openStory, tab } from "./helpers";

const html = (page: Page) => page.locator("html");

/** A radio drawn by its face: the ring is on the element right after the hidden input */
async function expectProxyRing(radio: Locator) {
  await expect(radio).toBeFocused();
  await expect(radio.locator("xpath=following-sibling::*[1]")).toHaveCSS(
    "box-shadow",
    /rgb\(255, 194, 26\)/,
  );
}

test.describe("Preferences panel keyboard", () => {
  test("a full keyboard pass through every group", async ({ page }) => {
    await openStory(page, "kerb-originals-preferences--panel");
    const radio = (group: string, name: string) =>
      page
        .getByRole("radiogroup", { name: group })
        .getByRole("radio", { name });

    await tab(page);
    await expectFocusRing(page.getByRole("button", { name: "Reset" }));

    // Presets: one Tab stop, arrows move and apply
    await tab(page);
    await expectProxyRing(radio("Start from a preset", "Standard"));
    await page.keyboard.press("ArrowRight");
    await expect(radio("Start from a preset", "Low vision")).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-kerb-density", "spacious");
    await page.keyboard.press("ArrowLeft");
    await expect(radio("Start from a preset", "Standard")).toBeChecked();

    // Ranges: the browser's own arrow keys
    await tab(page);
    const textSize = page.getByRole("slider", { name: "Text size" });
    await expectFocusRing(textSize);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(textSize).toHaveAttribute("aria-valuetext", "18 pixels");
    await expect(html(page)).toHaveAttribute(
      "style",
      /--kerb-pref-text-size: 1\.125rem/,
    );
    await expect(liveRegion(page, "polite")).toHaveText("Text size 18 pixels");
    // A value changed on top of Standard: Custom
    await expect(page.getByText("Current settings: Custom")).toBeVisible();

    await tab(page);
    const lineSpacing = page.getByRole("slider", { name: "Line spacing" });
    await expect(lineSpacing).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(lineSpacing).toHaveAttribute("aria-valuetext", "1.65");

    await tab(page);
    const wordSpacing = page.getByRole("slider", { name: "Word spacing" });
    await expect(wordSpacing).toBeFocused();
    await page.keyboard.press("End");
    await expect(wordSpacing).toHaveAttribute("aria-valuetext", "0.24 em");

    // Segmented groups, in order, one Tab stop each
    const groups: Array<[string, string, string]> = [
      ["Font", "Atkinson", "Lexend"],
      ["Line length", "Medium", "Wide"],
      ["Background", "White", "Warm"],
      ["Focus thickness", "Standard", "Thick"],
      ["Spacing and target size", "Default", "Spacious"],
      ["Motion", "Follow system", "Reduced"],
    ];
    for (const [group, from, to] of groups) {
      if (group === "Focus thickness") {
        // Focus colour comes before it: checked last so the yellow ring is
        // still the one expected above
        await tab(page);
        await expect(radio("Focus colour", "Yellow")).toBeFocused();
      }
      await tab(page);
      await expectProxyRing(radio(group, from));
      await page.keyboard.press("ArrowRight");
      await expect(radio(group, to)).toBeChecked();
      await expect(radio(group, to)).toBeFocused();
    }
    await expect(html(page)).toHaveAttribute("data-kerb-theme", "comfort");
    await expect(html(page)).toHaveAttribute("data-kerb-motion", "reduced");
    await expect(html(page)).toHaveAttribute("data-kerb-density", "spacious");

    // Switches: Space and Enter
    await tab(page);
    const underline = page.getByRole("switch", {
      name: "Always underline links",
    });
    await expectFocusRing(underline);
    await page.keyboard.press("Space");
    await expect(underline).toHaveAttribute("aria-checked", "true");
    await expect(html(page)).toHaveAttribute("data-kerb-underline-links", "");
    await expect(liveRegion(page, "polite")).toHaveText(
      "Always underline links on",
    );

    await tab(page);
    const focusOnClick = page.getByRole("switch", {
      name: "Show focus on click too",
    });
    await expect(focusOnClick).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(html(page)).toHaveAttribute("data-kerb-focus-on-click", "");

    await tab(page);
    await expect(page.getByRole("button", { name: "Copy code" })).toBeFocused();
    await tab(page);
    await expect(
      page.getByText("Use a code from another device"),
    ).toBeFocused();
  });

  test("the focus colour group changes the ring itself", async ({
    page,
    browserName,
  }) => {
    // WebKit stops matching :focus-visible on a radio reached with an arrow
    // key, even plain HTML radios, so there is no ring to read the colour from.
    // Known gap for every Kerb radio, see docs/04-accessibility-rules.md
    test.skip(
      browserName === "webkit",
      "WebKit drops :focus-visible after arrow keys in a radio group",
    );
    await openStory(page, "kerb-originals-preferences--panel");
    const magenta = page.getByRole("radio", { name: "Magenta" });

    // Reached with Tab: WebKit does not count script focus as keyboard focus
    await page
      .getByRole("radiogroup", { name: "Background" })
      .getByRole("radio", { name: "White" })
      .focus();
    await tab(page);
    await expect(page.getByRole("radio", { name: "Yellow" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(magenta).toBeChecked();
    await expect(magenta.locator("xpath=following-sibling::*[1]")).toHaveCSS(
      "box-shadow",
      /rgb\(192, 38, 211\)/,
    );
  });

  test("the panel does not move under the pointer when the text size changes", async ({
    page,
  }) => {
    await openStory(page, "kerb-originals-preferences--panel");
    const textSize = page.getByRole("slider", { name: "Text size" });
    // Measured once the fonts are in, so a late font swap is not counted as a jump
    await page.evaluate("document.fonts.ready.then(() => true)");
    const before = await textSize.boundingBox();

    await textSize.focus();
    await page.keyboard.press("End");
    await expect(textSize).toHaveAttribute("aria-valuetext", "26 pixels");

    expect(await textSize.boundingBox()).toEqual(before);
  });

  test("reset then Undo with F6, from the keyboard", async ({ page }) => {
    await openStory(page, "kerb-originals-preferences--panel");
    await page
      .getByRole("radiogroup", { name: "Start from a preset" })
      .getByRole("radio", { name: "Standard" })
      .focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Low vision" })).toBeChecked();

    const reset = page.getByRole("button", { name: "Reset" });
    await reset.focus();
    await page.keyboard.press("Enter");
    await expect(
      page
        .getByRole("radiogroup", { name: "Start from a preset" })
        .getByRole("radio", { name: "Standard" }),
    ).toBeChecked();

    await page.keyboard.press("F6");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("radio", { name: "Low vision" })).toBeChecked();
  });

  test("survives a reload", async ({ page }) => {
    await openStory(page, "kerb-originals-preferences--panel");
    await page
      .getByRole("radiogroup", { name: "Start from a preset" })
      .getByRole("radio", { name: "Standard" })
      .focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: "Dyslexia friendly" }),
    ).toBeChecked();

    await page.reload();

    await expect(
      page.getByRole("radio", { name: "Dyslexia friendly" }),
    ).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-kerb-theme", "comfort");
  });
});

test.describe("Preferences sheet keyboard", () => {
  test("opens on Close, Tab stays inside, Esc and Done return focus", async ({
    page,
  }) => {
    await openStory(page, "kerb-originals-preferences--sheet");
    const trigger = page.getByRole("button", { name: "Preferences" });
    await tab(page);
    await expectFocusRing(trigger);
    await page.keyboard.press("Enter");

    const sheet = page.getByRole("dialog", { name: "Your preferences" });
    await expect(sheet).toBeVisible();
    await expectFocusRing(sheet.getByRole("button", { name: "Close" }));

    // Back from Close wraps to Done, which is at the bottom and in view
    await tab(page, { back: true });
    const done = sheet.getByRole("button", { name: "Done" });
    await expect(done).toBeFocused();
    await expect(done).toBeInViewport();
    await tab(page);
    await expect(sheet.getByRole("button", { name: "Close" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await tab(page);
    await tab(page);
    await expectProxyRing(
      sheet
        .getByRole("radiogroup", { name: "Start from a preset" })
        .getByRole("radio", { name: "Standard" }),
    );
    await page.keyboard.press("ArrowDown");
    await expect(
      sheet.getByRole("radio", { name: "Low vision" }),
    ).toBeChecked();
    await done.focus();
    await page.keyboard.press("Enter");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(html(page)).toHaveAttribute("data-kerb-density", "spacious");
  });
});

test.describe("ComfortControls keyboard", () => {
  test("ranges and background from the keyboard", async ({ page }) => {
    await openStory(page, "kerb-originals-comfortcontrols--default");

    await tab(page);
    const textSize = page.getByRole("slider", { name: "Text size" });
    await expectFocusRing(textSize);
    await page.keyboard.press("ArrowRight");
    await expect(textSize).toHaveAttribute("aria-valuetext", "17 pixels");

    await tab(page);
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("slider", { name: "Line spacing" }),
    ).toHaveAttribute("aria-valuetext", "1.65");

    await tab(page);
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("slider", { name: "Letter spacing" }),
    ).toHaveAttribute("aria-valuetext", "0.01 em");

    await tab(page);
    await expectProxyRing(page.getByRole("radio", { name: "White" }));
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Warm" })).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-kerb-theme", "comfort");
    await expect(liveRegion(page, "polite")).toHaveText("Background Warm");
  });
});

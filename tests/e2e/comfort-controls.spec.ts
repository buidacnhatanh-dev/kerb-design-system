import { expect, test } from "@playwright/test";
import {
  expectFocusRing,
  expectProxyRing,
  liveRegion,
  openStory,
  tab,
} from "./helpers";

const html = (page: import("@playwright/test").Page) => page.locator("html");

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

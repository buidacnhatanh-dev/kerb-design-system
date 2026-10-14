import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  mockMatchMedia,
  renderWithKerb,
} from "../../test/utils";
import { Button } from "../button";
import { Preferences } from "./Preferences";

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  root.removeAttribute("style");
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-kerb-")) root.removeAttribute(name);
  }
});

/** The Announcer sets its text on the next frame */
async function nextFrame() {
  await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

const presetGroup = () =>
  screen.getByRole("radiogroup", { name: "Start from a preset" });
const preset = (name: string) =>
  within(presetGroup()).getByRole("radio", { name });

describe("Preferences", () => {
  it("is a labelled region with presets as a radio group and Standard selected", () => {
    renderWithKerb(<Preferences />);

    expect(
      screen.getByRole("region", { name: "Your preferences" }),
    ).toBeInTheDocument();
    expect(
      within(presetGroup())
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual(["standard", "lowVision", "dyslexia", "tiredEyes", "keyboard"]);
    expect(preset("Standard")).toBeChecked();
    expect(screen.getByText("Current settings:")).toHaveTextContent(
      "Current settings: Standard",
    );
    // The hint is the description, not part of the name
    expect(preset("Dyslexia friendly")).toHaveAccessibleDescription(
      "Space and shorter lines",
    );
  });

  it("picking a preset sets all its values and announces it", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);

    await user.click(preset("Dyslexia friendly"));
    await nextFrame();

    expect(preset("Dyslexia friendly")).toBeChecked();
    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    expect(root.style.getPropertyValue("--kerb-pref-font")).toBe(
      "var(--kerb-font-family-dyslexia)",
    );
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.125rem",
    );
    expect(root.style.getPropertyValue("--kerb-pref-line-height")).toBe("1.85");
    expect(root.style.getPropertyValue("--kerb-pref-measure")).toBe("52ch");
    expect(root).toHaveAttribute("data-kerb-motion", "reduced");
    expect(root).toHaveAttribute("data-kerb-underline-links");
    expect(screen.getByRole("slider", { name: "Text size" })).toHaveValue("18");
    expect(screen.getByRole("radio", { name: "Lexend" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Warm" })).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Always underline links" }),
    ).toBeChecked();
    expect(liveRegion("polite")).toHaveTextContent(
      "Preset Dyslexia friendly applied",
    );
  });

  it("shows Custom after one value changes on top of a preset", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);
    await user.click(preset("Tired eyes"));

    await user.click(screen.getByRole("radio", { name: "Wide" }));

    for (const radio of within(presetGroup()).getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(screen.getByText("Current settings:")).toHaveTextContent(
      "Current settings: Custom",
    );
  });

  it("names the current preset when its card is not shown", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithKerb(<Preferences />);
    await user.click(preset("Keyboard first"));

    rerender(<Preferences presets={["lowVision"]} />);

    expect(screen.getByText("Current settings:")).toHaveTextContent(
      "Current settings: Keyboard first",
    );
  });

  it("moves through a group with the arrow keys and between groups with Tab", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Preferences sections={["reading"]} />);

    await user.tab(); // Reset
    await user.tab();
    expect(preset("Standard")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(preset("Low vision")).toHaveFocus();
    expect(preset("Low vision")).toBeChecked();
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.375rem",
    );

    // One Tab stop per group: the next stop is the first range
    await user.tab();
    expect(screen.getByRole("slider", { name: "Text size" })).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("radio", { name: "Atkinson" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Lexend" })).toBeChecked();
    await user.tab();
    // Low vision has wide lines
    expect(screen.getByRole("radio", { name: "Wide" })).toHaveFocus();
  });

  it("changes a range and announces where it ended up, after 500ms", async () => {
    const wait = (ms: number) =>
      act(() => new Promise((resolve) => setTimeout(resolve, ms)));
    renderWithKerb(<Preferences sections={["reading"]} />);
    const textSize = screen.getByRole("slider", { name: "Text size" });
    expect(textSize).toHaveAttribute("aria-valuetext", "16 pixels");

    // Two steps, as two presses of the right arrow send them. jsdom does not
    // move a range with the arrow keys; the Playwright test does that for real
    fireEvent.change(textSize, { target: { value: "17" } });
    fireEvent.change(textSize, { target: { value: "18" } });

    expect(textSize).toHaveAttribute("aria-valuetext", "18 pixels");
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.125rem",
    );
    // Real timers: the wait is short, and userEvent does not mix well with fake ones
    await wait(350);
    expect(liveRegion("polite")).toHaveTextContent("");
    await wait(250);
    await nextFrame();
    // Once, for where it ended up, not once per step
    expect(liveRegion("polite")).toHaveTextContent(/^Text size 18 pixels$/);

    const lineSpacing = screen.getByRole("slider", { name: "Line spacing" });
    expect(lineSpacing).toHaveAttribute("aria-valuetext", "1.60");
    const wordSpacing = screen.getByRole("slider", { name: "Word spacing" });
    expect(wordSpacing).toHaveAttribute("aria-valuetext", "0.00 em");
  });

  it("announces choices and switches", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);

    await user.click(screen.getByRole("radio", { name: "Magenta" }));
    await nextFrame();
    expect(liveRegion("polite")).toHaveTextContent("Focus colour Magenta");
    expect(root.style.getPropertyValue("--kerb-focus-color")).toBe("#C026D3");

    const underline = screen.getByRole("switch", {
      name: "Always underline links",
    });
    expect(underline).toHaveAccessibleDescription(
      "Links stand out without relying on colour.",
    );
    await user.click(underline);
    await nextFrame();
    expect(underline).toHaveAttribute("aria-checked", "true");
    expect(root).toHaveAttribute("data-kerb-underline-links");
    expect(liveRegion("polite")).toHaveTextContent("Always underline links on");

    // The visible label toggles it too
    await user.click(screen.getByText("Show focus on click too"));
    expect(root).toHaveAttribute("data-kerb-focus-on-click");
  });

  it("keeps values across a reload", async () => {
    const user = userEvent.setup();
    const first = renderWithKerb(<Preferences />);
    await user.click(preset("Low vision"));
    first.unmount();

    renderWithKerb(<Preferences />);

    expect(preset("Low vision")).toBeChecked();
    expect(screen.getByRole("radio", { name: "Spacious" })).toBeChecked();
  });

  it("still works when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);

    await user.click(preset("Tired eyes"));

    expect(preset("Tired eyes")).toBeChecked();
    expect(root).toHaveAttribute("data-kerb-theme", "dark");
  });

  it("follows the system colour scheme only while the theme is system", async () => {
    const media = mockMatchMedia({ "(prefers-color-scheme: dark)": false });
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);
    const background = screen.getByRole("radiogroup", { name: "Background" });
    expect(
      within(background).getByRole("radio", { name: "White" }),
    ).toBeChecked();

    act(() => media.set("(prefers-color-scheme: dark)", true));
    expect(
      within(background).getByRole("radio", { name: "Dark" }),
    ).toBeChecked();
    expect(root).toHaveAttribute("data-kerb-theme", "dark");

    await user.click(within(background).getByRole("radio", { name: "Warm" }));
    act(() => media.set("(prefers-color-scheme: dark)", false));
    expect(
      within(background).getByRole("radio", { name: "Warm" }),
    ).toBeChecked();
    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    media.restore();
  });

  describe("codes", () => {
    it("shows the export code and copies it", async () => {
      const user = userEvent.setup();
      const writeText = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      renderWithKerb(<Preferences />);
      await user.click(preset("Dyslexia friendly"));

      expect(
        screen.getByText("kerb1.18.185.16.0.C.L.N.Y.S.D.R.u"),
      ).toBeVisible();
      const copy = screen.getByRole("button", { name: "Copy code" });
      expect(copy).toHaveAccessibleDescription(
        "kerb1.18.185.16.0.C.L.N.Y.S.D.R.u",
      );
      await user.click(copy);
      await nextFrame();

      expect(writeText).toHaveBeenCalledWith(
        "kerb1.18.185.16.0.C.L.N.Y.S.D.R.u",
      );
      expect(liveRegion("polite")).toHaveTextContent("Code copied");
    });

    it("says so when copying is not allowed", async () => {
      const user = userEvent.setup();
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
        new DOMException("Denied", "NotAllowedError"),
      );
      renderWithKerb(<Preferences />);

      await user.click(screen.getByRole("button", { name: "Copy code" }));
      await nextFrame();

      expect(liveRegion("polite")).toHaveTextContent(
        "Could not copy. Select the code and copy it yourself",
      );
    });

    it("round trips: export, reset, import", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Preferences />);
      await user.click(preset("Keyboard first"));
      await user.click(screen.getByRole("radio", { name: "Compact" }));
      const code = screen.getByText(/^kerb1\./).textContent ?? "";

      await user.click(preset("Standard"));
      await user.click(screen.getByText("Use a code from another device"));
      await user.type(screen.getByLabelText("Preferences code"), code);
      await user.click(screen.getByRole("button", { name: "Apply code" }));
      await nextFrame();

      expect(screen.getByText(/^kerb1\./)).toHaveTextContent(code);
      expect(screen.getByRole("radio", { name: "Compact" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Magenta" })).toBeChecked();
      expect(screen.getByLabelText("Preferences code")).toHaveValue("");
      expect(liveRegion("polite")).toHaveTextContent(
        "Preferences applied from the code",
      );
    });

    it("shows an error for a bad code without throwing, and keeps focus on the field", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Preferences />);
      await user.click(screen.getByText("Use a code from another device"));
      const field = screen.getByLabelText("Preferences code");

      await user.type(field, "kerb1.99.x");
      await user.click(screen.getByRole("button", { name: "Apply code" }));

      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAccessibleDescription(
        "Starts with kerb1 The code is incomplete.",
      );
      expect(field).toHaveFocus();
      expect(preset("Standard")).toBeChecked();
    });
  });

  it("reset offers an Undo toast that restores the previous settings", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Preferences />);
    await user.click(preset("Tired eyes"));

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(preset("Standard")).toBeChecked();
    const toast = screen.getByRole("region", { name: "Notifications" });
    expect(toast).toHaveTextContent("Preferences reset");
    await user.click(within(toast).getByRole("button", { name: "Undo" }));
    expect(preset("Tired eyes")).toBeChecked();
  });

  it("shows only the chosen sections", () => {
    renderWithKerb(<Preferences sections={["motion", "links"]} />);

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: "Focus colour" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Motion" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Always underline links" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: "Show focus on click too" }),
    ).not.toBeInTheDocument();
  });

  describe("sheet", () => {
    const sheet = (props: { onDone?: () => void } = {}) => (
      <Preferences
        variant="sheet"
        trigger={<Button>Open preferences</Button>}
        {...props}
      />
    );

    it("opens as a modal dialog with focus on Close, and Done closes it", async () => {
      const user = userEvent.setup();
      const onDone = vi.fn();
      renderWithKerb(sheet({ onDone }));
      const trigger = screen.getByRole("button", { name: "Open preferences" });

      await user.click(trigger);

      const dialog = screen.getByRole("dialog", { name: "Your preferences" });
      expect(
        within(dialog).getByRole("button", { name: "Close" }),
      ).toHaveFocus();
      expect(
        within(dialog).getByRole("radiogroup", { name: "Start from a preset" }),
      ).toBeVisible();

      await user.click(within(dialog).getByRole("button", { name: "Done" }));

      expect(onDone).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("closes before resetting, so the Undo toast can be reached", async () => {
      const user = userEvent.setup();
      renderWithKerb(sheet());
      await user.click(
        screen.getByRole("button", { name: "Open preferences" }),
      );
      await user.click(preset("Low vision"));

      await user.click(screen.getByRole("button", { name: "Reset" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Open preferences" }),
      ).toHaveFocus();
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });
  });

  forEachTheme(() => {
    it("has no axe violations as a panel", async () => {
      const { container } = renderWithKerb(<Preferences />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations as a sheet", async () => {
      renderWithKerb(
        <Preferences
          variant="sheet"
          defaultOpen
          trigger={<Button>Open preferences</Button>}
        />,
      );
      expect(
        await axe(screen.getByRole("dialog", { name: "Your preferences" })),
      ).toHaveNoViolations();
    });
  });
});

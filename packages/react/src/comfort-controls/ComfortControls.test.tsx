import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  mockMatchMedia,
  renderWithKerb,
} from "../../test/utils";
import { Preferences } from "../preferences";
import { ComfortControls } from "./ComfortControls";

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  root.removeAttribute("style");
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-kerb-")) root.removeAttribute(name);
  }
});

const wait = (ms: number) =>
  act(() => new Promise((resolve) => setTimeout(resolve, ms)));

describe("ComfortControls", () => {
  it("has native ranges with visible labels and values", () => {
    renderWithKerb(<ComfortControls />);

    expect(
      screen.getByRole("region", { name: "Reading comfort" }),
    ).toBeInTheDocument();
    const textSize = screen.getByRole("slider", { name: "Text size" });
    expect(textSize).toHaveAttribute("type", "range");
    expect(textSize).toHaveAttribute("min", "16");
    expect(textSize).toHaveAttribute("max", "24");
    expect(textSize).toHaveAttribute("step", "1");
    expect(textSize).toHaveAttribute("aria-valuetext", "16 pixels");
    expect(screen.getByText("16px")).toBeVisible();

    const lineSpacing = screen.getByRole("slider", { name: "Line spacing" });
    expect(lineSpacing).toHaveAttribute("min", "1.4");
    expect(lineSpacing).toHaveAttribute("max", "2.2");
    expect(lineSpacing).toHaveAttribute("step", "0.05");
    const letterSpacing = screen.getByRole("slider", {
      name: "Letter spacing",
    });
    expect(letterSpacing).toHaveAttribute("max", "0.12");
    expect(letterSpacing).toHaveAttribute("step", "0.01");
    expect(letterSpacing).toHaveAttribute("aria-valuetext", "0.00 em");
  });

  it("writes the --kerb-pref-* variables on <html> and updates the value text", () => {
    renderWithKerb(<ComfortControls />);

    fireEvent.change(screen.getByRole("slider", { name: "Text size" }), {
      target: { value: "18" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Line spacing" }), {
      target: { value: "1.75" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Letter spacing" }), {
      target: { value: "0.01" },
    });

    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.125rem",
    );
    expect(root.style.getPropertyValue("--kerb-pref-line-height")).toBe("1.75");
    expect(root.style.getPropertyValue("--kerb-pref-letter-spacing")).toBe(
      "0.01em",
    );
    expect(screen.getByRole("slider", { name: "Text size" })).toHaveAttribute(
      "aria-valuetext",
      "18 pixels",
    );
    expect(screen.getByText("1.75")).toBeVisible();
  });

  it("announces a range once it rests for 500ms", async () => {
    renderWithKerb(<ComfortControls />);
    const textSize = screen.getByRole("slider", { name: "Text size" });

    fireEvent.change(textSize, { target: { value: "17" } });
    await wait(300);
    fireEvent.change(textSize, { target: { value: "18" } });
    await wait(300);
    expect(liveRegion("polite")).toHaveTextContent("");
    await wait(250);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    expect(liveRegion("polite")).toHaveTextContent(/^Text size 18 pixels$/);
  });

  it("sets the theme with the background swatches and announces it", async () => {
    const user = userEvent.setup();
    renderWithKerb(<ComfortControls />);
    const background = screen.getByRole("radiogroup", {
      name: "Background (sets the theme)",
    });

    await user.click(within(background).getByRole("radio", { name: "Warm" }));
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    expect(
      within(background).getByRole("radio", { name: "Warm" }),
    ).toBeChecked();
    expect(liveRegion("polite")).toHaveTextContent("Background Warm");

    // Arrow keys move within the group
    await user.keyboard("{ArrowRight}");
    expect(root).toHaveAttribute("data-kerb-theme", "dark");
  });

  it("selects the theme the system shows while the theme is system", () => {
    const media = mockMatchMedia({ "(prefers-color-scheme: dark)": true });
    renderWithKerb(<ComfortControls />);

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    act(() => media.set("(prefers-color-scheme: dark)", false));
    expect(screen.getByRole("radio", { name: "White" })).toBeChecked();
    media.restore();
  });

  it("shares the store with Preferences", () => {
    renderWithKerb(
      <>
        <ComfortControls />
        <Preferences sections={["reading"]} />
      </>,
    );

    fireEvent.change(screen.getAllByRole("slider", { name: "Text size" })[0]!, {
      target: { value: "20" },
    });

    for (const slider of screen.getAllByRole("slider", { name: "Text size" })) {
      expect(slider).toHaveValue("20");
    }
  });

  it("shows only the chosen controls, the preview, and forwards ref and props", () => {
    const ref = createRef<HTMLElement>();
    renderWithKerb(
      <ComfortControls
        ref={ref}
        controls={["background", "textSize"]}
        preview={<p>Kerb cuts were made for wheelchairs.</p>}
        title="Make it comfortable"
        headingLevel={3}
        className="layout"
        data-testid="comfort"
      />,
    );

    expect(ref.current).toBe(screen.getByTestId("comfort"));
    expect(ref.current).toHaveClass("layout");
    expect(
      screen.getByRole("heading", { level: 3, name: "Make it comfortable" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(
      screen.getByText("Kerb cuts were made for wheelchairs."),
    ).toBeVisible();
    // The order given
    const background = screen.getByRole("radiogroup");
    const textSize = screen.getByRole("slider");
    expect(
      background.compareDocumentPosition(textSize) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  forEachTheme(() => {
    it("has no axe violations", async () => {
      const { container } = renderWithKerb(
        <ComfortControls
          preview={<p>Reading settings work the same way.</p>}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

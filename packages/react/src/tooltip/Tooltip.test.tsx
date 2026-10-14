import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { Button } from "../button";
import { Tooltip } from "./Tooltip";

function setup(content = "Copy link to clipboard") {
  return renderWithKerb(
    <>
      <Tooltip content={content}>
        <Button variant="secondary" aria-label="Copy link" />
      </Tooltip>
      <Button>Next</Button>
    </>,
  );
}

const hover = (element: Element) =>
  fireEvent.pointerEnter(element, { pointerType: "mouse" });
const unhover = (element: Element) =>
  fireEvent.pointerLeave(element, { pointerType: "mouse" });

const tooltip = () => screen.getByRole("tooltip", { hidden: true });

afterEach(() => {
  vi.useRealTimers();
});

describe("Tooltip", () => {
  it("exposes its text as the trigger's description", () => {
    setup();

    const trigger = screen.getByRole("button", { name: "Copy link" });
    expect(trigger).toHaveAccessibleDescription("Copy link to clipboard");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip().id);
  });

  it("keeps a description the trigger already had", () => {
    renderWithKerb(
      <>
        <Tooltip content="Copy link to clipboard">
          <Button aria-label="Copy link" aria-describedby="note" />
        </Tooltip>
        <p id="note">Anyone with the link can view.</p>
      </>,
    );

    expect(screen.getByRole("button")).toHaveAccessibleDescription(
      "Anyone with the link can view. Copy link to clipboard",
    );
  });

  it("is hidden until asked for", () => {
    setup();

    expect(tooltip()).not.toHaveClass("open");
    expect(tooltip()).toHaveAttribute("popover", "manual");
  });

  it("appears at once on keyboard focus", async () => {
    const user = userEvent.setup();
    setup();

    await user.tab();

    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
    expect(tooltip()).toHaveClass("open");
  });

  it("hides with Esc and the trigger keeps focus", async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();

    await user.keyboard("{Escape}");

    expect(tooltip()).not.toHaveClass("open");
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
  });

  it("does not let Esc reach anything else while it is open", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    setup();
    await user.tab();
    document.addEventListener("keydown", onKeyDown);

    expect(tooltip()).toHaveClass("open");
    await user.keyboard("{Escape}");
    expect(onKeyDown).not.toHaveBeenCalled();

    // Closed now, so the next Esc goes through
    await user.keyboard("{Escape}");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    document.removeEventListener("keydown", onKeyDown);
  });

  it("hides when focus leaves", async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();

    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(tooltip()).not.toHaveClass("open");
  });

  it("shows after hovering for 300ms", async () => {
    vi.useFakeTimers();
    setup();

    hover(screen.getByRole("button", { name: "Copy link" }));
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(tooltip()).not.toHaveClass("open");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(tooltip()).toHaveClass("open");
  });

  it("stays while the pointer moves onto it, and hides when it leaves both", async () => {
    vi.useFakeTimers();
    setup();
    const trigger = screen.getByRole("button", { name: "Copy link" });
    hover(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    unhover(trigger);
    hover(tooltip());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(tooltip()).toHaveClass("open");

    unhover(tooltip());
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(tooltip()).not.toHaveClass("open");
  });

  it("does not open when the pointer passes over quickly", async () => {
    vi.useFakeTimers();
    setup();
    const trigger = screen.getByRole("button", { name: "Copy link" });

    hover(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    unhover(trigger);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(tooltip()).not.toHaveClass("open");
  });

  it("keeps the trigger's own ref and handlers", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onFocus = vi.fn();
    renderWithKerb(
      <Tooltip content="Copy link to clipboard">
        <Button ref={ref} aria-label="Copy link" onFocus={onFocus} />
      </Tooltip>,
    );

    await user.tab();

    expect(ref.current).toBe(screen.getByRole("button"));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it("can start open, for demos", () => {
    renderWithKerb(
      <Tooltip content="Copy link to clipboard" defaultOpen>
        <Button aria-label="Copy link" />
      </Tooltip>,
    );

    expect(tooltip()).toHaveClass("open");
  });

  it("holds text only, never interactive content", () => {
    setup();

    expect(tooltip().querySelector("a, button, input")).toBeNull();
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations, closed and open", async () => {
        const { container } = renderWithKerb(
          <>
            <Tooltip content="Copy link to clipboard">
              <Button aria-label="Copy link" />
            </Tooltip>
            <Tooltip content="Share with your team" defaultOpen>
              <Button aria-label="Share" />
            </Tooltip>
          </>,
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});

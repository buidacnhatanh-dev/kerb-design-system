import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { composeEventHandlers } from "./composeEventHandlers";
import { cx } from "./cx";
import { FieldShell } from "./FieldShell";
import { Icon, iconNames } from "./Icon";
import { mergeRefs } from "./mergeRefs";
import { useFocusReturn } from "./useFocusReturn";
import { VisuallyHidden } from "./VisuallyHidden";

describe("cx", () => {
  it("joins the truthy names", () => {
    expect(cx("a", false, undefined, null, "", "b")).toBe("a b");
  });
});

describe("mergeRefs", () => {
  it("sets object and callback refs, and skips missing ones", () => {
    const objectRef = createRef<HTMLButtonElement>();
    const callbackRef = vi.fn();
    render(
      <button type="button" ref={mergeRefs(objectRef, callbackRef, undefined)}>
        Save
      </button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(objectRef.current).toBe(button);
    expect(callbackRef).toHaveBeenCalledWith(button);
  });
});

describe("composeEventHandlers", () => {
  it("runs the consumer's handler, then Kerb's", () => {
    const calls: string[] = [];
    const handler = composeEventHandlers(
      () => calls.push("theirs"),
      () => calls.push("ours"),
    );

    handler({ defaultPrevented: false });

    expect(calls).toEqual(["theirs", "ours"]);
  });

  it("skips Kerb's handler when the consumer prevented the default", () => {
    const ours = vi.fn();
    const event = { defaultPrevented: false };
    const handler = composeEventHandlers(() => {
      event.defaultPrevented = true;
    }, ours);

    handler(event);

    expect(ours).not.toHaveBeenCalled();
  });

  it("works without a consumer handler", () => {
    const ours = vi.fn();
    composeEventHandlers(undefined, ours)({ defaultPrevented: false });
    expect(ours).toHaveBeenCalledTimes(1);
  });
});

describe("VisuallyHidden", () => {
  it("keeps its content available to screen readers", () => {
    render(<VisuallyHidden>Opens in a new tab</VisuallyHidden>);

    const element = screen.getByText("Opens in a new tab");
    expect(element.tagName).toBe("SPAN");
    expect(element).toHaveClass("visuallyHidden");
    expect(element).not.toHaveAttribute("aria-hidden");
  });

  it("can render a div and forwards its ref and props", () => {
    const ref = createRef<HTMLElement>();
    render(<VisuallyHidden as="div" ref={ref} aria-live="off" />);

    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current).toHaveAttribute("aria-live", "off");
  });
});

describe("Icon", () => {
  it("has every icon in the set", () => {
    expect(iconNames).toEqual([
      "check",
      "info",
      "cross",
      "alert",
      "chevron",
      "calendar",
      "link",
      "eye",
      "eye-off",
      "sliders",
      "menu",
    ]);
  });

  it.each(iconNames)(
    "%s is hidden from assistive tech and not focusable",
    (name) => {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg?.childElementCount).toBeGreaterThan(0);
    },
  );

  it("cannot be made visible to assistive tech by a prop", () => {
    const { container } = render(
      <Icon name="check" {...{ "aria-hidden": false, focusable: "true" }} />,
    );

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "focusable",
      "false",
    );
  });
});

describe("useFocusReturn", () => {
  function Panel({ open }: { open: boolean }) {
    useFocusReturn(open);
    return open ? (
      <button type="button" ref={(element) => element?.focus()}>
        Inside
      </button>
    ) : null;
  }

  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
        <Panel open={open} />
      </>
    );
  }

  it("gives focus back to where it was when open becomes false", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const opener = screen.getByRole("button", { name: "Open" });

    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Inside" }));
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(opener).toHaveFocus();
  });

  it("gives focus back when the component unmounts while open", async () => {
    const user = userEvent.setup();
    function Host() {
      const [mounted, setMounted] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setMounted(true)}>
            Open
          </button>
          {mounted && (
            <>
              <Panel open />
              <button type="button" onClick={() => setMounted(false)}>
                Remove
              </button>
            </>
          )}
        </>
      );
    }
    render(<Host />);
    const opener = screen.getByRole("button", { name: "Open" });

    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(opener).toHaveFocus();
  });
});

describe("FieldShell", () => {
  it("wires the control to the label, hint and error", () => {
    render(
      <FieldShell
        label="Country"
        hint="Where you live"
        error="Choose a country"
      >
        {(control) => (
          <select {...control}>
            <option>Germany</option>
          </select>
        )}
      </FieldShell>,
    );
    const select = screen.getByLabelText("Country");

    expect(select).toHaveAccessibleDescription(
      "Where you live Choose a country",
    );
    expect(select).toHaveAttribute("aria-invalid", "true");
  });

  it("passes no description or invalid state when there is nothing to say", () => {
    render(
      <FieldShell label="Country">
        {(control) => <input {...control} />}
      </FieldShell>,
    );
    const input = screen.getByLabelText("Country");

    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });
});

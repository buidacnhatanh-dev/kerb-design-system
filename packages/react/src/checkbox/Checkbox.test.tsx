import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a native checkbox named by its label", () => {
    renderWithKerb(<Checkbox label="Email me updates" />);

    const checkbox = screen.getByRole("checkbox", { name: "Email me updates" });
    expect(checkbox.tagName).toBe("INPUT");
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("toggles with Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(<Checkbox label="Email me updates" onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox");

    await user.tab();
    expect(checkbox).toHaveFocus();

    await user.keyboard(" ");
    expect(checkbox).toBeChecked();

    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("toggles when the label is clicked", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Checkbox label="Email me updates" />);

    await user.click(screen.getByText("Email me updates"));

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("makes the whole row the label", () => {
    renderWithKerb(<Checkbox label="Email me updates" />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox.closest("label")).toContainElement(
      screen.getByText("Email me updates"),
    );
  });

  it("accepts rich content as the label", () => {
    renderWithKerb(
      <Checkbox
        label={
          <>
            I accept the <a href="/terms">terms</a>
          </>
        }
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "I accept the terms" }),
    ).toBeInTheDocument();
  });

  it("works controlled and uncontrolled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <>
        <Checkbox label="Uncontrolled" defaultChecked />
        <Checkbox label="Controlled" checked={false} onChange={onChange} />
      </>,
    );

    await user.click(screen.getByRole("checkbox", { name: "Uncontrolled" }));
    await user.click(screen.getByRole("checkbox", { name: "Controlled" }));

    expect(
      screen.getByRole("checkbox", { name: "Uncontrolled" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Controlled" }),
    ).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  describe("mixed", () => {
    it("exposes the mixed state", () => {
      renderWithKerb(<Checkbox label="All toppings" indeterminate />);
      const checkbox = screen.getByRole<HTMLInputElement>("checkbox");

      // The native property is what browsers map to checked: "mixed"
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox).toBePartiallyChecked();
    });

    it("follows the prop", () => {
      const { rerender } = renderWithKerb(
        <Checkbox label="All toppings" indeterminate />,
      );
      expect(screen.getByRole("checkbox")).toBePartiallyChecked();

      rerender(<Checkbox label="All toppings" />);
      expect(screen.getByRole("checkbox")).not.toBePartiallyChecked();
    });

    it("is not mixed by default", () => {
      renderWithKerb(<Checkbox label="All toppings" defaultChecked />);

      expect(screen.getByRole("checkbox")).not.toBePartiallyChecked();
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  it("links the hint as the description, outside the name", () => {
    renderWithKerb(
      <Checkbox label="Email me updates" hint="About one email a week" />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Email me updates" });

    expect(checkbox).toHaveAccessibleDescription("About one email a week");
  });

  it("keeps a description id passed by the consumer", () => {
    renderWithKerb(
      <>
        <Checkbox
          label="Email me updates"
          hint="About one email a week"
          aria-describedby="privacy"
        />
        <p id="privacy">We never share it.</p>
      </>,
    );

    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "We never share it. About one email a week",
    );
  });

  describe("error", () => {
    it("sets aria-invalid only when there is an error", () => {
      const { rerender } = renderWithKerb(
        <Checkbox label="I accept the terms" />,
      );
      expect(screen.getByRole("checkbox")).not.toHaveAttribute("aria-invalid");

      rerender(
        <Checkbox
          label="I accept the terms"
          error="Accept the terms to continue"
        />,
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-invalid",
        "true",
      );

      rerender(<Checkbox label="I accept the terms" error="" />);
      expect(screen.getByRole("checkbox")).not.toHaveAttribute("aria-invalid");
    });

    it("is the description, after the hint, and not part of the name", () => {
      renderWithKerb(
        <Checkbox
          label="I accept the terms"
          hint="You can read them before you order"
          error="Accept the terms to continue"
        />,
      );
      const checkbox = screen.getByRole("checkbox", {
        name: "I accept the terms",
      });

      expect(checkbox).toHaveAccessibleDescription(
        "You can read them before you order Accept the terms to continue",
      );
    });

    it("shows an icon and text, not only colour, and is not a live region", () => {
      renderWithKerb(
        <Checkbox
          label="I accept the terms"
          error="Accept the terms to continue"
        />,
      );
      const message = screen.getByText("Accept the terms to continue");
      const row = message.parentElement;

      expect(message).toBeVisible();
      expect(row?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(row).not.toHaveAttribute("aria-live");
      expect(row).not.toHaveAttribute("role");
      expect(row?.closest("label")).toBeNull();
    });

    it("still toggles, so the person can fix it", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <Checkbox
          label="I accept the terms"
          required
          error="Accept the terms to continue"
        />,
      );

      await user.click(screen.getByText("I accept the terms"));

      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  it("draws the focus ring on the box after the input", () => {
    renderWithKerb(<Checkbox label="Email me updates" />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveClass("kerb-focus-proxy");
    expect(checkbox.nextElementSibling).toHaveClass("box");
  });

  it("cannot be toggled when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <Checkbox label="Email me updates" disabled onChange={onChange} />,
    );

    await user.click(screen.getByText("Email me updates"));

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards its ref and remaining props to the input, and className to the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = renderWithKerb(
      <Checkbox
        ref={ref}
        label="Email me updates"
        name="updates"
        value="yes"
        required
        id="updates"
        className="grid-cell"
      />,
    );

    expect(ref.current).toBe(screen.getByRole("checkbox"));
    expect(ref.current).toHaveAttribute("name", "updates");
    expect(ref.current).toHaveAttribute("value", "yes");
    expect(ref.current).toHaveAttribute("id", "updates");
    expect(ref.current).toBeRequired();
    expect(container.firstElementChild).toHaveClass("grid-cell");
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations in every state", async () => {
        const { container } = renderWithKerb(
          <>
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" defaultChecked />
            <Checkbox label="Mixed" indeterminate />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="With hint" hint="About one email a week" />
            <Checkbox
              label="With error"
              hint="You can read them before you order"
              error="Accept the terms to continue"
            />
          </>,
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});

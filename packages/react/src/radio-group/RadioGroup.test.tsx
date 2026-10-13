import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { RadioGroup } from "./RadioGroup";

const delivery = [
  { value: "standard", label: "Standard", hint: "3 to 5 working days" },
  { value: "express", label: "Express", hint: "Next working day" },
  { value: "pickup", label: "Pick up" },
];

function setup(props: Partial<React.ComponentProps<typeof RadioGroup>> = {}) {
  return renderWithKerb(
    <>
      <button type="button">Before</button>
      <RadioGroup
        legend="Delivery"
        name="delivery"
        options={delivery}
        {...props}
      />
      <button type="button">After</button>
    </>,
  );
}

describe("RadioGroup", () => {
  it("is a fieldset named by its legend", () => {
    setup();

    const group = screen.getByRole("group", { name: "Delivery" });
    expect(group.tagName).toBe("FIELDSET");
    expect(within(group).getByText("Delivery").tagName).toBe("LEGEND");
  });

  it("renders a native radio per option, sharing the name", () => {
    setup();
    const radios = screen.getAllByRole("radio");

    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "standard",
      "express",
      "pickup",
    ]);
    for (const radio of radios) {
      expect(radio).toHaveAttribute("type", "radio");
      expect(radio).toHaveAttribute("name", "delivery");
    }
    expect(screen.getByRole("radio", { name: "Express" })).toBeInTheDocument();
  });

  it("starts with nothing selected, or with defaultValue", () => {
    const { unmount } = setup();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    unmount();

    setup({ defaultValue: "express" });
    expect(screen.getByRole("radio", { name: "Express" })).toBeChecked();
  });

  describe("keyboard", () => {
    it("moves and selects with the arrow keys", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({ defaultValue: "standard", onChange });

      await user.tab();
      await user.tab();
      expect(screen.getByRole("radio", { name: "Standard" })).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("radio", { name: "Express" })).toHaveFocus();
      expect(screen.getByRole("radio", { name: "Express" })).toBeChecked();
      expect(onChange).toHaveBeenLastCalledWith("express");

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Pick up" })).toBeChecked();

      // Wraps round
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();

      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("radio", { name: "Pick up" })).toBeChecked();
      expect(onChange).toHaveBeenLastCalledWith("pickup");
    });

    it("enters on the selected option and leaves the group in one Tab", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: "express" });

      await user.tab();
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("radio", { name: "Express" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();

      await user.tab({ shift: true });
      expect(screen.getByRole("radio", { name: "Express" })).toHaveFocus();
    });

    it("selects with Space when nothing is selected yet", async () => {
      const user = userEvent.setup();
      setup();

      await user.tab();
      await user.tab();
      expect(screen.getByRole("radio", { name: "Standard" })).toHaveFocus();

      await user.keyboard(" ");
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
    });
  });

  it("selects when a label is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ onChange });

    await user.click(screen.getByText("Pick up"));

    expect(screen.getByRole("radio", { name: "Pick up" })).toBeChecked();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("pickup");
  });

  it("keeps the value the parent gives it, controlled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = renderWithKerb(
      <RadioGroup
        legend="Delivery"
        name="delivery"
        options={delivery}
        value="standard"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByText("Express"));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("express");
    expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();

    rerender(
      <RadioGroup
        legend="Delivery"
        name="delivery"
        options={delivery}
        value="express"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radio", { name: "Express" })).toBeChecked();
  });

  it("links each hint as that option's description, outside its name", () => {
    setup();

    expect(
      screen.getByRole("radio", { name: "Standard" }),
    ).toHaveAccessibleDescription("3 to 5 working days");
    expect(screen.getByRole("radio", { name: "Pick up" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  describe("error", () => {
    it("is shown with an icon and described on the fieldset", () => {
      setup({ error: "Choose a delivery option" });
      const group = screen.getByRole("group", { name: "Delivery" });
      const message = screen.getByText("Choose a delivery option");

      expect(group).toHaveAccessibleDescription("Choose a delivery option");
      expect(message).toBeVisible();
      expect(message.parentElement?.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(message.parentElement).not.toHaveAttribute("aria-live");
    });

    it("comes after the legend and before the options", () => {
      setup({ error: "Choose a delivery option" });
      const group = screen.getByRole("group", { name: "Delivery" });

      expect(group.children[0]?.tagName).toBe("LEGEND");
      expect(group.children[1]).toHaveTextContent("Choose a delivery option");
    });

    it("leaves no description without an error", () => {
      setup();

      expect(screen.getByRole("group")).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("disabled", () => {
    it("skips a disabled option with the arrow keys", async () => {
      const user = userEvent.setup();
      setup({
        defaultValue: "standard",
        options: [
          delivery[0]!,
          { ...delivery[1]!, disabled: true },
          delivery[2]!,
        ],
      });

      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowDown}");

      expect(screen.getByRole("radio", { name: "Express" })).toBeDisabled();
      expect(screen.getByRole("radio", { name: "Pick up" })).toBeChecked();
    });

    it("disables every option through the fieldset", () => {
      setup({ disabled: true });

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
    });
  });

  it("forwards its ref and remaining props to the fieldset", () => {
    const ref = createRef<HTMLFieldSetElement>();
    setup({ ref, className: "grid-cell", id: "delivery-group" } as never);

    expect(ref.current).toBe(screen.getByRole("group"));
    expect(ref.current).toHaveClass("grid-cell");
    expect(ref.current).toHaveAttribute("id", "delivery-group");
  });

  it("draws the focus ring on the circle after the input", () => {
    setup();
    const radio = screen.getByRole("radio", { name: "Standard" });

    expect(radio).toHaveClass("kerb-focus-proxy");
    expect(radio.nextElementSibling).toHaveClass("circle");
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations in every state", async () => {
        const { container } = renderWithKerb(
          <>
            <RadioGroup legend="Default" name="a" options={delivery} />
            <RadioGroup
              legend="Selected"
              name="b"
              options={delivery}
              defaultValue="express"
            />
            <RadioGroup
              legend="Error"
              name="c"
              options={delivery}
              error="Choose a delivery option"
            />
            <RadioGroup
              legend="Disabled"
              name="d"
              options={delivery}
              disabled
            />
            <RadioGroup
              legend="Horizontal"
              name="e"
              options={delivery}
              orientation="horizontal"
            />
          </>,
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});

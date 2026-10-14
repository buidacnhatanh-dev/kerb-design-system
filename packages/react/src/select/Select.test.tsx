import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { Select } from "./Select";

const countries = [
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "nl", label: "Netherlands", disabled: true },
];

describe("Select", () => {
  it("associates the visible label with a native select", () => {
    renderWithKerb(<Select label="Country" options={countries} />);

    const select = screen.getByLabelText("Country");
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("combobox", { name: "Country" })).toBe(select);
    expect(screen.getByText("Country")).toBeVisible();
  });

  it("renders the options, including disabled ones", () => {
    renderWithKerb(<Select label="Country" options={countries} />);
    const options = within(screen.getByLabelText("Country")).getAllByRole(
      "option",
    );

    expect(options.map((option) => option.textContent)).toEqual([
      "Germany",
      "France",
      "Netherlands",
    ]);
    expect(options[0]).toHaveValue("de");
    expect(options[2]).toBeDisabled();
  });

  it("accepts option children instead of the options prop", () => {
    renderWithKerb(
      <Select label="Country" defaultValue="fr">
        <optgroup label="Europe">
          <option value="de">Germany</option>
          <option value="fr">France</option>
        </optgroup>
      </Select>,
    );

    expect(screen.getByLabelText("Country")).toHaveValue("fr");
    expect(screen.getByRole("group", { name: "Europe" })).toBeInTheDocument();
  });

  it("changes value when the person chooses, uncontrolled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <Select
        label="Country"
        options={countries}
        defaultValue="de"
        onChange={onChange}
      />,
    );
    const select = screen.getByLabelText("Country");

    await user.selectOptions(select, "France");

    expect(select).toHaveValue("fr");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("keeps the value the parent gives it, controlled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <Select
        label="Country"
        options={countries}
        value="de"
        onChange={onChange}
      />,
    );
    const select = screen.getByLabelText("Country");

    await user.selectOptions(select, "France");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue("de");
  });

  it("is reached with Tab", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Select label="Country" options={countries} />);

    await user.tab();

    expect(screen.getByLabelText("Country")).toHaveFocus();
    expect(screen.getByLabelText("Country")).toHaveClass("kerb-focusable");
  });

  it("forwards its ref and remaining props to the select, and className to the wrapper", () => {
    const ref = createRef<HTMLSelectElement>();
    const { container } = renderWithKerb(
      <Select
        ref={ref}
        label="Country"
        options={countries}
        name="country"
        required
        className="grid-cell"
      />,
    );

    expect(ref.current).toBe(screen.getByLabelText("Country"));
    expect(ref.current).toHaveAttribute("name", "country");
    expect(ref.current).toBeRequired();
    expect(ref.current).not.toHaveClass("grid-cell");
    expect(container.querySelector(".grid-cell")).toContainElement(ref.current);
  });

  describe("placeholder", () => {
    it("is a disabled first option, selected until the person chooses", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <Select
          label="Country"
          options={countries}
          placeholder="Choose a country"
        />,
      );
      const select = screen.getByLabelText("Country");
      const placeholder = screen.getByRole("option", {
        name: "Choose a country",
      });

      expect(select).toHaveValue("");
      expect(placeholder).toBeDisabled();
      expect(select.firstElementChild).toBe(placeholder);
      // The label, not the placeholder, names the field
      expect(select).toHaveAccessibleName("Country");

      await user.selectOptions(select, "Germany");
      expect(select).toHaveValue("de");
    });

    it("does not override a default value", () => {
      renderWithKerb(
        <Select
          label="Country"
          options={countries}
          placeholder="Choose a country"
          defaultValue="fr"
        />,
      );

      expect(screen.getByLabelText("Country")).toHaveValue("fr");
    });

    it("has no placeholder option unless asked", () => {
      renderWithKerb(<Select label="Country" options={countries} />);

      expect(screen.getAllByRole("option")).toHaveLength(3);
    });
  });

  describe("error, as for TextField", () => {
    it("sets aria-invalid only when there is an error", () => {
      const { rerender } = renderWithKerb(
        <Select label="Country" options={countries} />,
      );
      expect(screen.getByLabelText("Country")).not.toHaveAttribute(
        "aria-invalid",
      );

      rerender(
        <Select label="Country" options={countries} error="Choose a country" />,
      );
      expect(screen.getByLabelText("Country")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("lists the hint, then the error, in the description", () => {
      renderWithKerb(
        <Select
          label="Country"
          options={countries}
          hint="Where we send your order"
          error="Choose a country"
        />,
      );

      expect(screen.getByLabelText("Country")).toHaveAccessibleDescription(
        "Where we send your order Choose a country",
      );
    });

    it("shows an icon and text, and is not a live region", () => {
      renderWithKerb(
        <Select label="Country" options={countries} error="Choose a country" />,
      );
      const row = screen.getByText("Choose a country", {
        selector: "span",
      }).parentElement;

      expect(row?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(row).not.toHaveAttribute("aria-live");
    });
  });

  it("uses the native disabled attribute", () => {
    renderWithKerb(<Select label="Country" options={countries} disabled />);

    expect(screen.getByLabelText("Country")).toBeDisabled();
  });

  describe("hit area", () => {
    it("passes a press on the padding around the select through to it", async () => {
      const user = userEvent.setup();
      const showPicker = vi.fn();
      renderWithKerb(<Select label="Country" options={countries} />);
      const select = screen.getByLabelText<HTMLSelectElement>("Country");
      select.showPicker = showPicker;
      const hitArea = select.parentElement?.parentElement as HTMLElement;

      await user.pointer({ keys: "[MouseLeft>]", target: hitArea });

      expect(select).toHaveFocus();
      expect(showPicker).toHaveBeenCalledTimes(1);
    });

    it("still focuses the select where the picker cannot be opened", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Select label="Country" options={countries} />);
      const select = screen.getByLabelText<HTMLSelectElement>("Country");
      select.showPicker = () => {
        throw new DOMException("No user activation", "NotAllowedError");
      };
      const hitArea = select.parentElement?.parentElement as HTMLElement;

      await user.pointer({ keys: "[MouseLeft>]", target: hitArea });

      expect(select).toHaveFocus();
    });
  });

  it("makes a select without a label a type error", () => {
    // The assertion is the @ts-expect-error line: `pnpm typecheck` fails if it compiles
    // @ts-expect-error -- label is required, a placeholder does not replace it
    const field = <Select placeholder="Country" options={countries} />;
    expect(field).toBeTruthy();
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations in every state", async () => {
        const { container } = renderWithKerb(
          <>
            <Select label="Country" options={countries} defaultValue="de" />
            <Select
              label="Country"
              options={countries}
              placeholder="Choose a country"
              hint="Where we send your order"
            />
            <Select
              label="Country"
              options={countries}
              placeholder="Choose a country"
              error="Choose a country"
            />
            <Select label="Country" options={countries} disabled />
          </>,
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});

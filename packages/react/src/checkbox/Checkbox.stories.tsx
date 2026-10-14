import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: { label: "Email me booking updates" },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

/** For a "select all" when only some items are selected. */
export const Mixed: Story = {
  args: { label: "Mixed (some selected)", indeterminate: true },
};

/** The ring is drawn on the box, not on the hidden native input. */
export const Focused: Story = {
  render: (args) => <Checkbox {...args} {...forced("focus-visible")} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

/** A required checkbox the person has not ticked: red box, icon and text. */
export const Error: Story = {
  args: {
    label: "I accept the terms and conditions",
    required: true,
    error: "Accept the terms to continue",
  },
};

export const ErrorWithHint: Story = {
  args: {
    label: "I accept the terms and conditions",
    hint: "You can read them before you order",
    required: true,
    error: "Accept the terms to continue",
  },
};

export const WithHint: Story = {
  args: { hint: "About one email a week. Unsubscribe at any time." },
};

const toppings = ["Mushrooms", "Olives", "Peppers"];

function SelectAllDemo() {
  const [chosen, setChosen] = useState<string[]>(["Olives"]);
  const all = chosen.length === toppings.length;

  return (
    <div>
      <Checkbox
        label="All toppings"
        checked={all}
        indeterminate={chosen.length > 0 && !all}
        onChange={() => setChosen(all ? [] : toppings)}
      />
      <div style={{ paddingInlineStart: "2.125rem" }}>
        {toppings.map((topping) => (
          <Checkbox
            key={topping}
            label={topping}
            checked={chosen.includes(topping)}
            onChange={(event) =>
              setChosen(
                event.target.checked
                  ? [...chosen, topping]
                  : chosen.filter((item) => item !== topping),
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

/** "All toppings" is mixed while some, but not all, are selected. */
export const SelectAll: Story = {
  render: () => <SelectAllDemo />,
};

/** Every state, as on the design board. */
export const AllStates: Story = {
  render: () => (
    <div>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Mixed (some selected)" indeterminate />
      <Checkbox label="Focused" {...forced("focus-visible")} />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Error" error="Accept the terms to continue" />
    </div>
  ),
};

export const Themes: Story = {
  render: () => (
    <ThemeColumns>
      <div className={storyStyles.row}>
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Mixed" indeterminate />
      </div>
    </ThemeColumns>
  ),
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { ThemeColumns, storyStyles } from "../internal/stories/helpers";
import { RadioGroup } from "./RadioGroup";

const delivery = [
  { value: "standard", label: "Standard", hint: "3 to 5 working days" },
  { value: "express", label: "Express", hint: "Next working day" },
  { value: "pickup", label: "Pick up", hint: "From the Darmstadt shop" },
];

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  args: {
    legend: "Delivery",
    name: "delivery",
    options: delivery,
    defaultValue: "standard",
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

/** One Tab stop for the group. Arrow keys move and select. */
export const Default: Story = {};

export const NothingSelected: Story = {
  args: { defaultValue: undefined },
};

/** The ring is drawn on the circle of the focused option. */
export const Focused: Story = {
  play: ({ canvasElement }) => {
    // Shown without real focus, like the other focus stories
    canvasElement
      .querySelector("input:checked")
      ?.setAttribute("data-sb-pseudo", "focus-visible");
  },
};

export const Error: Story = {
  args: { defaultValue: undefined, error: "Choose a delivery option" },
};

export const DisabledOption: Story = {
  args: {
    options: delivery.map((option) =>
      option.value === "pickup"
        ? { ...option, disabled: true, hint: "The shop is closed this week" }
        : option,
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Horizontal: Story = {
  args: {
    legend: "Text size",
    name: "size",
    orientation: "horizontal",
    defaultValue: "medium",
    options: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
    ],
  },
};

function ControlledDemo() {
  const [value, setValue] = useState("express");
  return (
    <div>
      <RadioGroup
        legend="Delivery"
        name="delivery-controlled"
        options={delivery}
        value={value}
        onChange={setValue}
      />
      <p>Selected: {value}</p>
    </div>
  );
}

/** The value is owned by the parent through `value` and `onChange`. */
export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

/** Tab stops once in the group, then moves on to the button. */
export const InAForm: Story = {
  render: (args) => (
    <form onSubmit={(event) => event.preventDefault()}>
      <RadioGroup {...args} />
      <div className={storyStyles.row}>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  ),
};

export const Themes: Story = {
  render: (args) => (
    <ThemeColumns>
      {/* Radios with one name are one group, so each column gets its own */}
      {(theme) => <RadioGroup {...args} name={`delivery-${theme}`} />}
    </ThemeColumns>
  ),
};

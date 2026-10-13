import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useAnnouncer } from "../announcer";
import { Icon } from "../internal/Icon";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: { control: "inline-radio", options: ["default", "small"] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Learn more" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const Hover: Story = {
  render: (args) => <Button {...args} {...forced("hover")} />,
};

export const Focus: Story = {
  render: (args) => <Button {...args} {...forced("focus-visible")} />,
};

/** Moves down 1px while pressed, only at the full motion level. */
export const Active: Story = {
  render: (args) => <Button {...args} {...forced("active")} />,
};

export const Loading: Story = {
  args: { loading: true, loadingLabel: "Saving" },
};

/** Stays in the Tab order and does not fire `onClick`. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Hover or focus the button to read why it is disabled. Esc hides the reason. */
export const DisabledWithReason: Story = {
  args: {
    disabled: true,
    disabledReason: "Fill in your email address first",
  },
  decorators: [
    (Story) => (
      <div style={{ paddingBlockStart: "4rem" }}>
        <Story />
      </div>
    ),
  ],
};

/** 40px tall, with a 44px hit area. */
export const Small: Story = {
  args: { size: "small" },
};

export const WithIcons: Story = {
  render: () => (
    <div className={storyStyles.row}>
      <Button iconStart={<Icon name="check" />}>Save changes</Button>
      <Button variant="secondary" iconEnd={<Icon name="chevron" />}>
        More options
      </Button>
    </div>
  ),
};

/** No visible text, so `aria-label` is required by the types. */
export const IconOnly: Story = {
  render: () => (
    <div className={storyStyles.row}>
      <Button
        variant="secondary"
        aria-label="Copy link"
        iconStart={<Icon name="link" />}
      />
      <Button
        variant="ghost"
        size="small"
        aria-label="Open menu"
        iconStart={<Icon name="menu" />}
      />
    </div>
  ),
};

function SaveDemo() {
  const { announce } = useAnnouncer();
  const [saving, setSaving] = useState(false);
  const [saves, setSaves] = useState(0);

  return (
    <div className={storyStyles.row}>
      <Button
        loading={saving}
        loadingLabel="Saving"
        onClick={() => {
          setSaving(true);
          setTimeout(() => {
            setSaving(false);
            setSaves((count) => count + 1);
            announce("Changes saved");
          }, 1500);
        }}
      >
        Save changes
      </Button>
      <p>Saved {saves} times</p>
    </div>
  );
}

/** Press the button: it loads for a moment, ignores further presses and announces both steps. */
export const LoadingOnPress: Story = {
  render: () => <SaveDemo />,
};

const rows = [
  { variant: "primary", name: "Primary", label: "Save changes" },
  { variant: "secondary", name: "Secondary", label: "Cancel" },
  { variant: "ghost", name: "Ghost", label: "Learn more" },
  { variant: "danger", name: "Danger", label: "Delete" },
] as const;

/** Every variant in every state, as on the design board. */
export const AllStates: Story = {
  render: () => (
    <div className={storyStyles.card}>
      <table className={storyStyles.matrix}>
        <thead>
          <tr>
            <th scope="col">Variant</th>
            <th scope="col">Default</th>
            <th scope="col">Hover</th>
            <th scope="col">Focus</th>
            <th scope="col">Loading</th>
            <th scope="col">Disabled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ variant, name, label }) => (
            <tr key={variant}>
              <th scope="row">{name}</th>
              <td>
                <Button variant={variant}>{label}</Button>
              </td>
              <td>
                <Button variant={variant} {...forced("hover")}>
                  {label}
                </Button>
              </td>
              <td>
                <Button variant={variant} {...forced("focus-visible")}>
                  {label}
                </Button>
              </td>
              <td>
                <Button variant={variant} loading>
                  {label}
                </Button>
              </td>
              <td>
                <Button variant={variant} disabled>
                  {label}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const Themes: Story = {
  render: () => (
    <ThemeColumns>
      <div className={storyStyles.row}>
        <Button>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Learn more</Button>
        <Button variant="danger">Delete</Button>
      </div>
    </ThemeColumns>
  ),
};

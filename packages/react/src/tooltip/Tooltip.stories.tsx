import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Icon } from "../internal/Icon";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: { content: "Copy link to clipboard" },
  render: (args) => (
    <Tooltip {...args}>
      <Button
        variant="secondary"
        aria-label="Copy link"
        iconStart={<Icon name="link" />}
      />
    </Tooltip>
  ),
  decorators: [
    // Room above the trigger for the tooltip
    (Story) => (
      <div style={{ paddingBlock: "4rem", paddingInline: "2rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/** Hover for 300ms, or focus with the keyboard. Esc hides it. */
export const Default: Story = {};

/** Shown at once on keyboard focus, as on the design board. */
export const OnFocus: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Tooltip {...args}>
      <Button
        variant="secondary"
        aria-label="Copy link"
        iconStart={<Icon name="link" />}
        {...forced("focus-visible")}
      />
    </Tooltip>
  ),
};

/** No room above, so it flips below the trigger. */
export const FlipsBelow: Story = {
  decorators: [
    (Story) => (
      <div style={{ marginBlockStart: "-4rem" }}>
        <Story />
      </div>
    ),
  ],
  args: { defaultOpen: true },
};

/** Long text wraps at 240px. */
export const LongContent: Story = {
  args: {
    content:
      "Copies a link to this project. Anyone with the link can view it, but not edit it.",
    defaultOpen: true,
  },
};

export const Themes: Story = {
  render: (args) => (
    <ThemeColumns>
      <div className={storyStyles.row}>
        <Tooltip {...args} defaultOpen>
          <Button
            variant="secondary"
            aria-label="Copy link"
            iconStart={<Icon name="link" />}
          />
        </Tooltip>
      </div>
    </ThemeColumns>
  ),
};

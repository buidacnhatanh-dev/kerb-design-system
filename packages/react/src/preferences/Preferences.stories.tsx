import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Icon } from "../internal/Icon";
import { ThemeColumns, WithPreferences } from "../internal/stories/helpers";
import { Preferences } from "./Preferences";

const meta: Meta<typeof Preferences> = {
  title: "Kerb originals/Preferences",
  component: Preferences,
};

export default meta;
type Story = StoryObj<typeof Preferences>;

/** The panel, on the defaults: Standard is selected. */
export const Panel: Story = {};

/** As on the design board: Dyslexia friendly applied. */
export const DyslexiaFriendly: Story = {
  render: (args) => (
    <WithPreferences preset="dyslexia">
      <Preferences {...args} />
    </WithPreferences>
  ),
};

/** One value changed after a preset: no card is selected and the panel says Custom. */
export const Custom: Story = {
  render: (args) => (
    <WithPreferences preset="tiredEyes" values={{ textSize: 20 }}>
      <Preferences {...args} />
    </WithPreferences>
  ),
};

/** Fewer presets and only the reading settings. */
export const ReadingOnly: Story = {
  args: { presets: ["lowVision", "dyslexia"], sections: ["reading"] },
};

/** The bottom sheet for small screens. Focus starts on Close; Done stays in view. */
export const Sheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    variant: "sheet",
    trigger: (
      <Button
        variant="secondary"
        aria-label="Preferences"
        iconStart={<Icon name="sliders" />}
      />
    ),
  },
};

/** The sheet, open. */
export const SheetOpen: Story = {
  args: { ...Sheet.args, defaultOpen: true },
};

export const Themes: Story = {
  render: (args) => (
    <ThemeColumns>
      {(theme) => (
        <Preferences {...args} title={`Your preferences, ${theme}`} />
      )}
    </ThemeColumns>
  ),
};

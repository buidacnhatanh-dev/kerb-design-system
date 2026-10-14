import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeColumns, WithPreferences } from "../internal/stories/helpers";
import { ComfortControls } from "./ComfortControls";

const preview = (
  <p>
    Kerb cuts were made for wheelchairs, then everyone with a pram, a bike or a
    suitcase started using them. Reading settings work the same way.
  </p>
);

const meta: Meta<typeof ComfortControls> = {
  title: "Kerb originals/ComfortControls",
  component: ComfortControls,
  args: { preview },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "44rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComfortControls>;

/** Changes the whole app, through the same store as Preferences. */
export const Default: Story = {};

/** As on the design board: 18px, line spacing 1.75, letter spacing 0.01em, Warm. */
export const Warm: Story = {
  render: (args) => (
    <WithPreferences
      values={{
        theme: "comfort",
        textSize: 18,
        lineHeight: 1.75,
        letterSpacing: 0.01,
      }}
    >
      <ComfortControls {...args} />
    </WithPreferences>
  ),
};

export const WithoutPreview: Story = {
  args: { preview: undefined },
};

/** Only some controls, in the order given. */
export const TextSizeAndBackground: Story = {
  args: { controls: ["textSize", "background"] },
};

/** The controls in each theme. The selected background is the page's theme. */
export const Themes: Story = {
  decorators: [
    (Story) => <div style={{ maxInlineSize: "none" }}>{Story()}</div>,
  ],
  render: (args) => (
    <ThemeColumns>
      {(theme) => (
        <ComfortControls {...args} title={`Reading comfort, ${theme}`} />
      )}
    </ThemeColumns>
  ),
};

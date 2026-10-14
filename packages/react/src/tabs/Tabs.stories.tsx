import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { ThemeColumns, forced } from "../internal/stories/helpers";
import { Tabs } from "./Tabs";

function Example(props: {
  activation?: "automatic" | "manual";
  focusTab?: boolean;
}) {
  return (
    <Tabs
      label="Kerb at a glance"
      defaultValue="overview"
      activation={props.activation}
    >
      <Tabs.List>
        <Tabs.Tab
          value="overview"
          {...(props.focusTab ? forced("focus-visible") : {})}
        >
          Overview
        </Tabs.Tab>
        <Tabs.Tab value="tokens">Tokens</Tabs.Tab>
        <Tabs.Tab value="tests">Tests</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">
        <p style={{ margin: 0 }}>
          Kerb is a set of thirteen accessible React components with three
          themes.
        </p>
      </Tabs.Panel>
      <Tabs.Panel value="tokens">
        <p style={{ margin: 0 }}>
          Colours, type and spacing come from semantic tokens.
        </p>
      </Tabs.Panel>
      <Tabs.Panel value="tests">
        <p style={{ margin: 0 }}>
          Every story is checked with axe in light, dark and comfort.
        </p>
        <Button variant="ghost">See the test report</Button>
      </Tabs.Panel>
    </Tabs>
  );
}

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "32rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

/** Arrow keys select at once. Tab moves into the panel. */
export const Automatic: Story = {
  render: () => <Example />,
};

/** Arrow keys move focus only; Enter or Space selects. For panels that load data. */
export const Manual: Story = {
  render: () => <Example activation="manual" />,
};

export const Focus: Story = {
  render: () => <Example focusTab />,
};

/** The Tests panel has a button, so the panel itself is not a Tab stop. */
export const PanelWithControls: Story = {
  render: () => (
    <Tabs label="Kerb at a glance" defaultValue="tests">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="tests">Tests</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Overview text.</Tabs.Panel>
      <Tabs.Panel value="tests">
        <Button variant="ghost">See the test report</Button>
      </Tabs.Panel>
    </Tabs>
  ),
};

export const Themes: Story = {
  decorators: [
    (Story) => (
      <div style={{ inlineSize: "min(72rem, 100vw - 2rem)" }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <ThemeColumns>
      <Example />
    </ThemeColumns>
  ),
};

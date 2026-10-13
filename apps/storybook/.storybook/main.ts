import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    // Foundations that are not components
    "../stories/**/*.stories.@(ts|tsx)",
    // Stories live next to their components in @kerb/react
    "../../../packages/react/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  // The Kerb theme toolbar sets the page background
  features: { backgrounds: false },
};

export default config;

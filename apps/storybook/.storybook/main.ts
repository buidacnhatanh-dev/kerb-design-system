import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    // Foundations that are not components
    "../stories/**/*.stories.@(ts|tsx)",
    // Stories live next to their components in @kerb/react
    "../../../packages/react/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: { disableTelemetry: true },
  // The Kerb theme toolbar sets the page background
  features: { backgrounds: false },
  viteFinal(viteConfig) {
    viteConfig.css = {
      ...viteConfig.css,
      modules: {
        // The same readable names as the published stylesheet: kerb-Button-label
        generateScopedName: (name, filename) =>
          `kerb-${(filename.split("/").pop() ?? "").replace(/\.module\.css.*$/, "")}-${name}`,
      },
    };
    return viteConfig;
  },
};

export default config;

import type { Decorator, Preview } from "@storybook/react-vite";
import { createElement } from "react";

// Source styles rather than the built package, so edits hot reload
import "../../../packages/react/src/styles/fonts.css";
import "../../../packages/react/src/styles/base.css";
import "./preview.css";

const withTheme: Decorator = (Story, context) => {
  // Set before the story renders so the first paint and the axe run use the right theme
  document.documentElement.setAttribute(
    "data-kerb-theme",
    String(context.globals.theme),
  );
  return createElement(Story);
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Kerb theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "comfort", title: "Comfort" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
  parameters: {
    a11y: {
      // Fail the story test on any axe violation
      test: "error",
    },
  },
};

export default preview;

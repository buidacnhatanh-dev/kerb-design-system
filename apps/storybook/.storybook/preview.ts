import type { Decorator, Preview } from "@storybook/react-vite";
import { createElement } from "react";

// Source rather than the built package, so edits hot reload
import "../../../packages/react/src/styles/fonts.css";
// Imported here as well as from index.ts: the production build treats index.ts
// as free of side effects and would drop its stylesheet import with it
import "../../../packages/react/src/styles/base.css";
// The optional page styles, so the canvas follows the theme and the reading preferences
import "../../../packages/react/src/styles/global.css";
import { KerbProvider } from "../../../packages/react/src/index";
import "./preview.css";
import { forcePseudoStates } from "./pseudo-states";

type Theme = "light" | "dark" | "comfort";

// Every story runs inside the provider. The toolbar theme is the provider's
// default, so it reaches <html> the same way it does in an app
const withKerb: Decorator = (Story, context) => {
  forcePseudoStates();
  return createElement(
    KerbProvider,
    { storageKey: "kerb-storybook", theme: context.globals.theme as Theme },
    createElement(Story),
  );
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
  decorators: [withKerb],
  parameters: {
    a11y: {
      // Fail the story test (`pnpm test:a11y`) on any axe violation
      test: "error",
      // The whole page, not just the story root: dialogs render in a portal on <body>
      context: "body",
      config: {
        // Stories are fragments, not pages
        rules: [
          { id: "region", enabled: false },
          { id: "landmark-one-main", enabled: false },
          { id: "page-has-heading-one", enabled: false },
        ],
      },
    },
  },
};

export default preview;

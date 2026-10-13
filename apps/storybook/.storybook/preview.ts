import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    a11y: {
      // Fail the story test on any axe violation
      test: "error",
    },
  },
};

export default preview;

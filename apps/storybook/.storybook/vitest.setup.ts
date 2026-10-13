import * as a11yAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import { beforeAll, inject } from "vitest";
import * as previewAnnotations from "./preview";

declare module "vitest" {
  interface ProvidedContext {
    kerbTheme: "light" | "dark" | "comfort";
  }
}

setProjectAnnotations([
  a11yAnnotations,
  previewAnnotations,
  {
    // Each Vitest project renders every story in one theme
    initialGlobals: { theme: inject("kerbTheme") },

    // axe accepts a placeholder as a field's name. Kerb does not
    afterEach({ canvasElement }: { canvasElement: HTMLElement }) {
      for (const field of canvasElement.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >("input[placeholder], textarea[placeholder]")) {
        const labelled =
          (field.labels?.length ?? 0) > 0 ||
          field.hasAttribute("aria-labelledby") ||
          field.hasAttribute("aria-label");
        if (!labelled) {
          throw new Error(
            `A placeholder is never the label. Give this field a visible label: ${field.outerHTML}`,
          );
        }
      }
    },
  },
]);

// A canvas without the tokens has no colours to fail on, so every story would pass by mistake
beforeAll(() => {
  const root = document.documentElement;
  if (!getComputedStyle(root).getPropertyValue("--kerb-color-bg")) {
    throw new Error("The Kerb tokens are not loaded in the story tests.");
  }
});

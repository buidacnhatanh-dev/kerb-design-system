import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const themes = ["light", "dark", "comfort"] as const;

/*
 * `pnpm test:a11y`: every story runs as a test in a real browser, once per
 * theme, and the a11y addon fails it on any axe violation
 * (`parameters.a11y.test` is "error" in .storybook/preview.ts).
 */
export default defineConfig({
  test: {
    projects: themes.map((theme) => ({
      extends: true,
      plugins: [storybookTest({ configDir: ".storybook" })],
      test: {
        name: `stories-${theme}`,
        // Read by .storybook/vitest.setup.ts
        provide: { kerbTheme: theme },
        setupFiles: [".storybook/vitest.setup.ts"],
        browser: {
          enabled: true,
          headless: true,
          provider: playwright(),
          instances: [{ browser: "chromium" }],
        },
      },
    })),
  },
});

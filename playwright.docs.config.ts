import { defineConfig, devices } from "@playwright/test";

const port = 3000;

// Checks on the built docs site (`pnpm build` first): axe in every theme,
// 400% zoom, text spacing, and the site's own keyboard flows. Chromium only:
// these check the pages, the components are covered in three browsers by test:e2e.
export default defineConfig({
  testDir: "./tests/docs",
  outputDir: "test-results/docs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    [process.env.CI ? "github" : "list"],
    // Read by scripts/passport-stats.ts
    ["json", { outputFile: "reports/docs.json" }],
  ],
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter docs start",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});

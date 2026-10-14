import { defineConfig, devices } from "@playwright/test";

const port = 6006;

// Specs run against the built Storybook (`pnpm build` first).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ...(process.env.CI
      ? ([["html", { open: "never" }], ["github"]] as const)
      : ([["list"]] as const)),
    // Read by scripts/passport-stats.ts. Outside test-results, which each run empties
    ["json", { outputFile: "reports/e2e.json" }],
  ],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm --filter kerb-storybook preview",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});

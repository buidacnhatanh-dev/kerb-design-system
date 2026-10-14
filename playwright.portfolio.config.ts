import { defineConfig, devices } from "@playwright/test";

const port = 4173;

// The portfolio's project modal (apps/portfolio-demo), built: `pnpm build` first
export default defineConfig({
  testDir: "./tests/portfolio",
  outputDir: "test-results/portfolio",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm --filter portfolio-demo preview",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});

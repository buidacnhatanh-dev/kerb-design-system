import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "react",
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    css: {
      // Keep class names readable in test output
      modules: { classNameStrategy: "non-scoped" },
    },
  },
});

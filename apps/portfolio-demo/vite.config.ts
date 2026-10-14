import { defineConfig } from "vite";

// No React plugin: the automatic JSX runtime is all this demo needs
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
});

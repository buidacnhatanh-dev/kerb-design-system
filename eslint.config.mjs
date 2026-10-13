import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/.next/",
    "**/out/",
    "**/next-env.d.ts",
    "**/storybook-static/",
    "**/.tsbuild/",
    "coverage/",
    "test-results/",
    "playwright-report/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.strict,
    ],
    settings: { react: { version: "detect" } },
  },
  {
    // Hooks also live in plain .ts files
    files: ["packages/react/src/**/*.ts"],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    // The placeholder is never the label: a field in a story always has one
    files: ["**/*.stories.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name=/^(TextField|Select|DatePicker)$/]:not(:has(JSXAttribute[name.name='label'], JSXSpreadAttribute))",
          message:
            "Give the field a visible label. A placeholder is never the label.",
        },
        {
          selector:
            "JSXOpeningElement[name.name=/^(input|textarea)$/]:has(JSXAttribute[name.name='placeholder'])",
          message:
            "Use TextField, which always has a visible label. A placeholder is never the label.",
        },
      ],
    },
  },
  {
    // Config files and scripts run in Node
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly", URL: "readonly" },
    },
  },
);

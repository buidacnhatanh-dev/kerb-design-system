# 01 · Architecture

## Repo layout

```
kerb/
├─ CONTRIBUTING.md
├─ package.json              # workspace scripts only
├─ pnpm-workspace.yaml       # packages/*, apps/*
├─ tsconfig.base.json        # strict, moduleResolution bundler
├─ .changeset/
├─ .github/workflows/ci.yml
├─ packages/
│  ├─ tokens/
│  │  ├─ src/                # primitives.json, semantic.light.json, semantic.dark.json, semantic.comfort.json
│  │  ├─ style-dictionary.config.mjs
│  │  └─ dist/               # kerb.css, light.css, dark.css, comfort.css, tokens.json, tokens.d.ts
│  └─ react/
│     ├─ src/
│     │  ├─ index.ts
│     │  ├─ provider/        # KerbProvider, preferences store, useKerbPreferences, head script
│     │  ├─ announcer/
│     │  ├─ button/  text-field/  select/  checkbox/  radio-group/
│     │  ├─ dialog/  tabs/  tooltip/  toast/  date-picker/
│     │  ├─ preferences/  comfort-controls/
│     │  ├─ internal/        # useId, useFocusReturn, mergeRefs, VisuallyHidden, Icon
│     │  └─ styles/          # base.css (focus ring, reduced motion, fonts)
│     ├─ tsup.config.ts
│     └─ package.json
├─ apps/
│  ├─ docs/                  # Next.js App Router
│  └─ storybook/             # Storybook React Vite
└─ tests/
   └─ e2e/                   # Playwright specs, run against Storybook
```

## Package outputs

### `@kerb/tokens`

* `dist/kerb.css`: all three themes in one file. Light is the default on `:root`, dark on `[data-kerb-theme="dark"]`, comfort on `[data-kerb-theme="comfort"]`
* `dist/tokens.json` and `dist/tokens.d.ts` for JS use
* Side effect: CSS only. `"sideEffects": ["*.css"]`

### `@kerb/react`

* ESM only, `exports` map with `types`
* `dist/index.js`, `dist/index.d.ts`, `dist/kerb.css` (component styles, extracted from CSS Modules by tsup)
* `peerDependencies`: `react >=18`, `react-dom >=18`
* `dependencies`: `@kerb/tokens`, `react-aria` (date picker only), `@internationalized/date`
* `"sideEffects": ["*.css"]`
* Consumers import once: `import '@kerb/react/kerb.css'`

## Styling approach

* CSS Modules for component styles. Class names are hashed with a `kerb` prefix for readable dev tools
* All values come from CSS variables in `@kerb/tokens`
* Preferences write extra variables on `document.documentElement` (see `03-themes-and-preferences.md`). Component CSS reads them with fallbacks, for example `font-size: var(--kerb-pref-text-size, var(--kerb-font-size-body))`
* No `!important` except inside `@media (forced-colors: active)` fixes

## Fonts

Install with Fontsource and import in `packages/react/src/styles/base.css`:

* `@fontsource/atkinson-hyperlegible` 400, 400 italic, 700
* `@fontsource/overpass` 700, 800
* `@fontsource/lexend` 400, 600 (used by the dyslexia friendly preset)
* `@fontsource/jetbrains-mono` 400, 500

Fonts are optional for consumers: export `@kerb/react/fonts.css` separately so teams can bring their own.

## Root scripts

```json
{
  "dev": "pnpm -r --parallel dev",
  "build": "pnpm -r build",
  "storybook": "pnpm --filter storybook dev",
  "test": "vitest run",
  "test:a11y": "pnpm --filter storybook test:a11y",
  "test:e2e": "playwright test",
  "lint": "eslint .",
  "typecheck": "tsc -b",
  "size": "size-limit",
  "changeset": "changeset"
}
```

## Linting

* ESLint flat config with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` (strict)
* Prettier with default settings

## Deployment

* Docs site: Vercel, from `apps/docs`
* Storybook: GitHub Pages or Chromatic, linked from the docs header
* npm: published through Changesets on merge to `main`

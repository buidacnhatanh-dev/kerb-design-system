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
│  │  ├─ style-dictionary.config.mjs   # one config per theme, custom formats
│  │  ├─ build.mjs           # runs the three configs and assembles dist/
│  │  ├─ test/               # contrast.test.ts
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
│     │  └─ styles/          # base.css (tokens, focus ring, motion levels, forced colours), fonts.css (Fontsource font faces)
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
* Tokens that are the same in every theme (space, radius, size, focus width, motion, font family and weight) are written once in a plain `:root` block. Theme blocks hold only colour, the type scale and `color-scheme`. This keeps a nested `data-kerb-theme` element from resetting overrides made on `<html>`, such as the reduced motion durations
* `dist/light.css`, `dist/dark.css`, `dist/comfort.css`: the shared block plus one theme, each usable on its own
* The raw palette (`palette.*`) is not emitted as CSS variables, only in `tokens.json`
* Built with `node build.mjs`, because the Style Dictionary CLI runs a single config
* `dist/tokens.json` and `dist/tokens.d.ts` for JS use
* Side effect: CSS only. `"sideEffects": ["*.css"]`

### `@kerb/react`

* ESM only, `exports` map with `types`
* `dist/index.js`, `dist/index.d.ts`, `dist/kerb.css` (base and component styles, extracted by tsup from everything `src/index.ts` imports, with the `@kerb/tokens` variables inlined so one stylesheet is enough)
* `dist/fonts.css` plus the font files, built from `src/styles/fonts.css`
* `peerDependencies`: `react >=18`, `react-dom >=18`
* `dependencies`: `@kerb/tokens`, `react-aria` (date picker only), `@internationalized/date`
* `"sideEffects": ["*.css"]`
* Consumers import once: `import '@kerb/react/kerb.css'`, and optionally `import '@kerb/react/fonts.css'`

## Styling approach

* CSS Modules for component styles. Class names are hashed with a `kerb` prefix for readable dev tools
* All values come from CSS variables in `@kerb/tokens`
* Preferences write extra variables on `document.documentElement` (see `03-themes-and-preferences.md`). Component CSS reads them with fallbacks, for example `font-size: var(--kerb-pref-text-size, var(--kerb-font-size-body))`
* No `!important` except inside `@media (forced-colors: active)` fixes
* Motion is controlled through variables, see `04-accessibility-rules.md`: durations from `--kerb-motion-duration-*`, movement multiplied by `--kerb-motion-move`

## Fonts

Install with Fontsource (dev dependencies of `@kerb/react`) and import in `packages/react/src/styles/fonts.css`. Not in `base.css`: anything imported there ends up in `kerb.css`, and fonts must stay optional.

* `@fontsource/atkinson-hyperlegible` 400, 400 italic, 700
* `@fontsource/overpass` 700, 800
* `@fontsource/lexend` 400, 600 (used by the dyslexia friendly preset)
* `@fontsource/jetbrains-mono` 400, 500

Fonts are optional for consumers: `fonts.css` is its own tsup entry and is published as `@kerb/react/fonts.css`, so teams can bring their own. Storybook and the docs site import both stylesheets.

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

Run `pnpm build` once after a fresh clone or a token change before `pnpm storybook`, `pnpm dev` or `pnpm test`. Storybook imports the React styles from source, but those import `@kerb/tokens/kerb.css` from `packages/tokens/dist`, and the contrast test reads `dist/tokens.json`. `@kerb/tokens` has no watch mode.

## Linting

* ESLint flat config with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` (strict)
* Prettier with default settings

## Deployment

* Docs site: Vercel, from `apps/docs`
* Storybook: GitHub Pages or Chromatic, linked from the docs header
* npm: published through Changesets on merge to `main`

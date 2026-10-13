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
│     │  ├─ head-script.ts   # getKerbHeadScript, its own entry so server components can call it
│     │  ├─ internal/        # useFocusReturn, mergeRefs, composeEventHandlers, VisuallyHidden, Icon, FieldShell, stories/ (story helpers)
│     │  └─ styles/          # base.css (tokens, focus ring, motion levels, forced colours), fonts.css (Fontsource font faces), global.css (optional page styles)
│     ├─ test/               # utils.tsx: renderWithKerb, forEachTheme, axe for jsdom, mockMatchMedia
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
* `dist/index.js` starts with `"use client"`: the provider and every component use hooks or context, so React Server Components treat the whole entry as client code
* `dist/head-script.js` and `dist/head-script.d.ts`, published as `@kerb/react/head-script`: `getKerbHeadScript` only, with no `"use client"`, so a Next.js server layout can call it. It is not exported from the main entry
* `dist/fonts.css` plus the font files, built from `src/styles/fonts.css`
* `dist/global.css`, built from `src/styles/global.css`, published as `@kerb/react/global.css` (see below)
* tsup runs two builds into `dist` (the main entry with the banner, then the head script and the optional stylesheets), so the build script empties `dist` first instead of using tsup's `clean`
* `peerDependencies`: `react >=18`, `react-dom >=18`
* `dependencies`: `@kerb/tokens`, `react-aria` (date picker only), `@internationalized/date`
* `"sideEffects": ["*.css"]`
* Consumers import once: `import '@kerb/react/kerb.css'`, and optionally `import '@kerb/react/fonts.css'` and `import '@kerb/react/global.css'`

### `@kerb/react/global.css` (optional)

`kerb.css` only styles Kerb's own components, so on its own the theme and the person's preferences stop at the edge of each component. `global.css` carries them to the rest of the page. Load it after `kerb.css`.

| Selector | What it sets |
| --- | --- |
| `html` | Font family, line height, letter spacing and word spacing from `--kerb-pref-font`, `--kerb-pref-line-height`, `--kerb-pref-letter-spacing`, `--kerb-pref-word-spacing`, each falling back to the theme token |
| `body` | `margin: 0`, background `color.bg`, text `color.text`, font size from `--kerb-pref-text-size` |
| `.kerb-prose` | `max-inline-size: var(--kerb-pref-measure, 66ch)`. Add the class to an article or any block of long form text |
| `.kerb-prose` links, and every link under `[data-kerb-underline-links]` | Underlined |
| Links | `color.link`, at zero specificity so any app style wins |

The text size goes on `body`, not `html`: the preference is written in rem, and changing the root font size would scale it, and every rem based token, a second time.

Teams that have their own page styles skip this file and read the same variables themselves. Storybook and the docs site load it.

## Styling approach

* CSS Modules for component styles. Class names are scoped as `kerb-<File>-<name>` (for example `kerb-Button-label`), the same in the published stylesheet and in Storybook, so they are readable in dev tools. There is no hash: the prefix and file name keep them unique
* How that is built: tsup loads every `.css` file as a global stylesheet, so a small esbuild plugin in `tsup.config.ts` hands `*.module.css` to esbuild's CSS Modules loader, and `onSuccess` renames esbuild's `Button_module_label` to `kerb-Button-label` in `kerb.css` and in the class maps in `index.js`. Storybook sets the same pattern with `css.modules.generateScopedName`
* `src/index.ts` imports `styles/base.css` for the published build. A production Vite build treats `index.ts` as free of side effects and drops that import, so `apps/storybook/.storybook/preview.ts` imports `base.css` directly as well
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

Fonts are optional for consumers: `fonts.css` is its own tsup entry and is published as `@kerb/react/fonts.css`, so teams can bring their own. Storybook and the docs site import `kerb.css`, `fonts.css` and `global.css`.

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

`test:a11y` runs `vitest run` in `apps/storybook` (the Storybook Vitest addon, see `07-testing-and-ci.md`). `test:e2e` runs against the built Storybook, so it needs `pnpm build` first.

Run `pnpm build` once after a fresh clone or a token change before `pnpm storybook`, `pnpm dev`, `pnpm test` or `pnpm test:a11y`. Storybook imports the React styles from source, but those import `@kerb/tokens/kerb.css` from `packages/tokens/dist`, and the contrast test reads `dist/tokens.json`. `@kerb/tokens` has no watch mode.

## Linting

* ESLint flat config with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` (strict)
* The hooks rules also run on plain `.ts` files in `packages/react/src`, where hooks like `useFocusReturn` live
* In `*.stories.tsx`, a `TextField`, `Select` or `DatePicker` without a `label`, and a raw `<input>` or `<textarea>` with a `placeholder`, are lint errors: the placeholder is never the label
* Prettier with default settings

## Deployment

* Docs site: Vercel, from `apps/docs`
* Storybook: GitHub Pages or Chromatic, linked from the docs header
* npm: published through Changesets on merge to `main`

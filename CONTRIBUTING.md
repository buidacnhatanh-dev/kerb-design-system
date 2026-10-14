# Contributing to Kerb

Kerb is an accessibility first React component library with three themes (light, dark, comfort), a Preferences panel, a Next.js docs site and Storybook. Full specs live in `docs/`. Visual source of truth is `design/*.png`.

Read `docs/00-overview.md`, `docs/01-architecture.md` and `docs/04-accessibility-rules.md` before writing any code. Read the matching file in `docs/components/` before building or changing a component.

## Stack (do not swap without asking)

* pnpm workspaces, Node LTS, TypeScript strict
* React 18 and 19 compatible (peer dependency `>=18`)
* CSS Modules plus CSS custom properties. No Tailwind, no CSS in JS, no runtime styling library in the published packages
* Style Dictionary for tokens
* tsup for building `@kerb/react` and `@kerb/tokens`
* React Aria is allowed ONLY inside `DatePicker` (calendar grid and date parsing). Every other component is hand built. That covers `react-aria`, `react-stately` (its state hooks: `useCalendarState`) and `@internationalized/date`. ESLint blocks importing them outside `packages/react/src/date-picker/`. `react-aria` and `react-stately` are pinned to exact versions because DatePicker relies on how `useCalendar` announces (see `docs/components/date-picker.md`): check that before bumping them
* Storybook (React + Vite) with the a11y addon and the Vitest addon (`@storybook/addon-vitest`, Vitest browser mode on Playwright). The old Storybook test runner is not used: its support has ended
* Next.js (App Router) for `apps/docs`
* Vitest, Testing Library (including `@testing-library/jest-dom`), vitest-axe, Playwright
* Changesets for versioning, size-limit for bundle budget
* Fontsource for Atkinson Hyperlegible, Overpass, Lexend, JetBrains Mono. Never load fonts from Google servers (GDPR, the author is based in Germany)
* Font faces live only in `packages/react/src/styles/fonts.css`, published as `@kerb/react/fonts.css`. Never import Fontsource from `base.css` or a component: fonts must stay optional for consumers

## Conventions

* One folder per component: `packages/react/src/<component>/` with `Component.tsx`, `Component.module.css`, `Component.test.tsx`, `Component.stories.tsx`, `index.ts`
* Components read semantic tokens only (`var(--kerb-color-action-primary)`), never primitives or hex values. The raw palette is deliberately not emitted as CSS variables (there is no `--kerb-palette-*`); it exists only in `tokens.json`. The shared scale tokens (`--kerb-space-*`, `--kerb-radius-*`, `--kerb-size-*`, `--kerb-motion-*`, `--kerb-font-family-*`, `--kerb-font-weight-*`) are fine to use
* Motion: take every duration from `var(--kerb-motion-duration-fast | base | slow)` and multiply any movement or scale by `var(--kerb-motion-move)`, for example `translateY(calc(0.5rem * var(--kerb-motion-move)))`. `base.css` turns these down for the reduced and off levels. Never write your own `prefers-reduced-motion` query in a component, and never use `!important` for motion
* Native elements first: `<button>`, `<input>`, `<select>`, `<dialog>`. Add ARIA only when no native element fits
* Every interactive component forwards refs and spreads remaining props onto the root native element. Exceptions: `Preferences` is a composite with a `variant` and takes only `className`; `ComfortControls` forwards to its `<section>`
* Controlled and uncontrolled modes where it makes sense (`value` and `defaultValue`, `open` and `defaultOpen`)
* Public API is exported from `packages/react/src/index.ts` only, with one exception: `getKerbHeadScript` lives in `src/head-script.ts` and is published as `@kerb/react/head-script`, with no `"use client"`, so server components can call it. Never re-export it from `index.ts`
* `dist/index.js` carries a `"use client"` banner. Anything that must run in a server component needs its own entry in `tsup.config.ts`
* Optional stylesheets are separate entries: `@kerb/react/fonts.css` and `@kerb/react/global.css` (page level styles that apply the theme and the `--kerb-pref-*` variables to `html` and `body`). `kerb.css` itself never styles `html`, `body` or bare elements
* Read preference variables with a token fallback (`var(--kerb-pref-text-size, var(--kerb-font-size-body))`). The provider only writes a variable when someone chose a value, so the fallback is what most people see
* Fields (TextField, Select, DatePicker) are built on `internal/FieldShell` and share the bordered box in `internal/NativeControl.module.css`. `ref` and remaining props go to the native control, `className` goes to the outer wrapper
* Preferences and ComfortControls share `internal/PreferenceControls.tsx` (range, segmented radio group, preset cards, switch, the debounced announcer and `useShownTheme`) and `internal/preferenceLabels.ts` (names and value formats). Their controls use fixed sizes from the default scale and reset `--kerb-pref-*` in their own scope, so a setting never moves under the pointer. They change preferences only through `useKerbPreferences()`
* Never put a `box-shadow` on an element that draws the focus ring (including a focus proxy's face) in a more specific rule than the ring's: it replaces the ring. Mark chosen states with border, fill and weight
* Stories that need preferences applied wrap the component in `WithPreferences` from `internal/stories/helpers`: it applies them on mount and goes back to Standard on unmount and on `pagehide`, because the store saves to localStorage and would carry them into the next story
* Checkbox and RadioGroup share `internal/Choice.module.css`: a native input, invisible, on top of a styled mark, inside its label. Checkbox follows the field rule for `ref`, props and `className`; RadioGroup's root is the `<fieldset>`, which gets all three
* Hints are never inside a `<label>`: they are linked with `aria-describedby`, so they are the description and not part of the name
* `KerbProvider` wraps the app in `<div data-kerb-app-root style="display: contents">`. Modal dialogs portal to `document.body`, outside it, and make it `inert` while open. The live regions and the toast region are siblings of it, not inside it
* A modal Dialog makes toasts inert. An action inside a modal that shows a toast with an action (Reset in the Preferences sheet) closes the modal first
* Dialog has `placement="bottom"` for sheets, `initialFocus="close"`, and `eyebrow` with `headerTheme` for a header band in another theme. Use them rather than overriding Dialog's class names
* Releases: `pnpm changeset` with every change to a package. The packages are not published to npm for now: CI runs Changesets for version pull requests only. Never run `npm publish` by hand and never turn publishing on without the owner (`docs/10-release.md`). The Storybook workspace is named `kerb-storybook` (a workspace called `storybook` clashes with the npm package in Changesets)
* Overlays go in the top layer: Dialog with `showModal()`, Tooltip and the DatePicker calendar with `popover="manual"`. Never rely on `z-index` against the app. jsdom hides every `[popover]` and has no `showPopover()`: unit tests that need one visible add `[popover]:not(#none) { display: block }` in the test file (see `DatePicker.test.tsx`)
* Esc closes only the innermost thing. A component that handles Esc while open (Tooltip, DatePicker) listens on `window` in the capture phase and stops the event, so a dialog around it stays open
* Do not use CSS Modules `composes`. The build renames scoped class names one at a time. Share styles by importing a shared module and joining classes with `cx`
* Stories show hover, focus and active states with `forced("hover")` from `internal/stories/helpers`, never with test only selectors in component CSS
* Sizes in `rem` so browser text size settings work
* Docs site: every page is in `apps/docs/lib/registry.ts`; content is MDX in `apps/docs/content/`; the code under a live example is the source of `apps/docs/examples/<slug>.tsx`, so edit the example, never a copy of its code. Docs code uses Kerb tokens and components like any Kerb app, and scrolling code blocks and tables are focusable named regions (`TableScroll`, `CodeBlock`)
* Passport numbers come only from `scripts/passport-stats.ts`. Never edit `*.stats.json` or `content/stats.json` by hand. Keyboard tests are counted per file, so a component's Playwright tests live in `tests/e2e/<slug>.spec.ts`
* The e2e tsconfig has no DOM types: in `tests/e2e`, read the page through locators (`toHaveAttribute`, `getAttribute`) or pass `page.evaluate` a string, never `document` in a function
* No `outline: none` without the Kerb focus ring replacing it

## Accessibility rules (hard requirements)

* Focus ring on every focusable element: add the `kerb-focusable` class. When the focusable element is a native input hidden under a styled mark (checkbox, radio), give the input `kerb-focus-proxy` instead and put the mark right after it: the ring is drawn on that next element. For radios that ring shows on `:focus` (WebKit drops `:focus-visible` after arrow keys), so in Chromium and Firefox a click on a radio shows it too. The ring is defined once in `packages/react/src/styles/base.css` (ink ring `--kerb-color-focus-ink` inside a `--kerb-color-focus` ring, with a transparent outline that keeps focus visible in forced colours mode). Do not redefine it per component
* Text contrast at least 4.5 : 1, control borders and focus at least 3 : 1, in all three themes
* Targets at least 44 by 44 CSS px (24 px minimum for inline controls like calendar days, with spacing). This holds at compact density too, where the visible control is 40 px: Button uses a `::before` hit area, fields get it from `FieldShell`
* Never use colour alone: errors and statuses always have an icon and text
* Respect `prefers-reduced-motion` and the Kerb motion preference
* Live updates go through the shared `Announcer`, never ad hoc `aria-live` regions. That includes third party code: React Aria's own announcer must never run (DatePicker keeps it quiet, and a test checks no extra live region appears)
* Disabled buttons use `aria-disabled="true"` and stay focusable, so people can discover why

## Definition of done for any component

1. Matches its spec in `docs/components/` and the design board
2. Unit tests pass, including keyboard behaviour listed in the spec
3. `axe` reports zero violations for every story in light, dark and comfort (`pnpm test:a11y`)
4. Playwright keyboard test passes for the component's main flow
5. Story exists for every state in the spec
6. Docs page exists in `apps/docs` with passport data filled from real test results: add the component to `apps/docs/lib/registry.ts`, write `content/components/<slug>.mdx`, `content/passports/<slug>.json` and `examples/<slug>.tsx`, then run the tests and `pnpm passports`. CI fails when the committed passport numbers differ from its run
7. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass

## Commands

Run `pnpm build` once after a fresh clone or any token change, before `pnpm storybook`, `pnpm dev` or `pnpm test`: Storybook and the contrast test read `packages/tokens/dist`.

```
pnpm install
pnpm dev            # docs site and Storybook together
pnpm storybook
pnpm test           # vitest
pnpm test:a11y      # every story in a real browser with axe, once per theme (Storybook Vitest addon)
pnpm test:e2e       # playwright, against the built Storybook (run pnpm build first)
pnpm test:docs      # playwright on the built docs site: axe in all themes, 400% zoom, text spacing, site flows
pnpm passports      # passport numbers from the reports of test:a11y, test:e2e and test:docs
pnpm test:portfolio # the portfolio's project modal (apps/portfolio-demo), built
pnpm lint
pnpm typecheck
pnpm build
pnpm size
pnpm changeset
```

## Never

* Invent test results, counts, dates or user research. Leave `[placeholders]` or compute real values
* Add a dependency not listed above without asking
* Commit secrets or tokens
* Use `tabindex` greater than 0
* Trap focus anywhere except inside an open modal dialog or sheet
* Move focus from an effect cleanup: React puts focus back where it was after the commit. Do it in an effect body (see `internal/useFocusReturn`)
* Remove the `base.css` import from `apps/storybook/.storybook/preview.ts`: the production build drops the one in `index.ts`, and the canvas loses its tokens and focus ring

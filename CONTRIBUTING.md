# Contributing to Kerb

Kerb is an accessibility first React component library with three themes (light, dark, comfort), a Preferences panel, a Next.js docs site and Storybook. Full specs live in `docs/`. Visual source of truth is `design/*.png`.

Read `docs/00-overview.md`, `docs/01-architecture.md` and `docs/04-accessibility-rules.md` before writing any code. Read the matching file in `docs/components/` before building or changing a component.

## Stack (do not swap without asking)

* pnpm workspaces, Node LTS, TypeScript strict
* React 18 and 19 compatible (peer dependency `>=18`)
* CSS Modules plus CSS custom properties. No Tailwind, no CSS in JS, no runtime styling library in the published packages
* Style Dictionary for tokens
* tsup for building `@kerb/react` and `@kerb/tokens`
* React Aria is allowed ONLY inside `DatePicker` (calendar grid and date parsing). Every other component is hand built
* Storybook (React + Vite) with the a11y addon
* Next.js (App Router) for `apps/docs`
* Vitest, Testing Library, vitest-axe, Playwright, Storybook test runner
* Changesets for versioning, size-limit for bundle budget
* Fontsource for Atkinson Hyperlegible, Overpass, Lexend, JetBrains Mono. Never load fonts from Google servers (GDPR, the author is based in Germany)
* Font faces live only in `packages/react/src/styles/fonts.css`, published as `@kerb/react/fonts.css`. Never import Fontsource from `base.css` or a component: fonts must stay optional for consumers

## Conventions

* One folder per component: `packages/react/src/<component>/` with `Component.tsx`, `Component.module.css`, `Component.test.tsx`, `Component.stories.tsx`, `index.ts`
* Components read semantic tokens only (`var(--kerb-color-action-primary)`), never primitives or hex values. The raw palette is deliberately not emitted as CSS variables (there is no `--kerb-palette-*`); it exists only in `tokens.json`. The shared scale tokens (`--kerb-space-*`, `--kerb-radius-*`, `--kerb-size-*`, `--kerb-motion-*`, `--kerb-font-family-*`, `--kerb-font-weight-*`) are fine to use
* Motion: take every duration from `var(--kerb-motion-duration-fast | base | slow)` and multiply any movement or scale by `var(--kerb-motion-move)`, for example `translateY(calc(0.5rem * var(--kerb-motion-move)))`. `base.css` turns these down for the reduced and off levels. Never write your own `prefers-reduced-motion` query in a component, and never use `!important` for motion
* Native elements first: `<button>`, `<input>`, `<select>`, `<dialog>`. Add ARIA only when no native element fits
* Every interactive component forwards refs and spreads remaining props onto the root native element
* Controlled and uncontrolled modes where it makes sense (`value` and `defaultValue`, `open` and `defaultOpen`)
* Public API is exported from `packages/react/src/index.ts` only
* Sizes in `rem` so browser text size settings work
* No `outline: none` without the Kerb focus ring replacing it

## Accessibility rules (hard requirements)

* Focus ring on every focusable element: add the `kerb-focusable` class. The ring is defined once in `packages/react/src/styles/base.css` (ink ring `--kerb-color-focus-ink` inside a `--kerb-color-focus` ring, with a transparent outline that keeps focus visible in forced colours mode). Do not redefine it per component
* Text contrast at least 4.5 : 1, control borders and focus at least 3 : 1, in all three themes
* Targets at least 44 by 44 CSS px (24 px minimum for inline controls like calendar days, with spacing)
* Never use colour alone: errors and statuses always have an icon and text
* Respect `prefers-reduced-motion` and the Kerb motion preference
* Live updates go through the shared `Announcer`, never ad hoc `aria-live` regions
* Disabled buttons use `aria-disabled="true"` and stay focusable, so people can discover why

## Definition of done for any component

1. Matches its spec in `docs/components/` and the design board
2. Unit tests pass, including keyboard behaviour listed in the spec
3. `axe` reports zero violations for every story in light, dark and comfort
4. Playwright keyboard test passes for the component's main flow
5. Story exists for every state in the spec
6. Docs page exists in `apps/docs` with passport data filled from real test results
7. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass

## Commands

Run `pnpm build` once after a fresh clone or any token change, before `pnpm storybook`, `pnpm dev` or `pnpm test`: Storybook and the contrast test read `packages/tokens/dist`.

```
pnpm install
pnpm dev            # docs site and Storybook together
pnpm storybook
pnpm test           # vitest
pnpm test:a11y      # storybook test runner with axe in all themes
pnpm test:e2e       # playwright
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

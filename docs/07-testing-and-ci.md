# 07 · Testing and CI

## Layers

| Layer | Tool | What it proves |
| --- | --- | --- |
| Token contrast | Vitest | Every semantic colour pair meets its ratio in all themes |
| Unit | Vitest + Testing Library + `vitest-axe` | Roles, names, states, keyboard handlers, no axe violations in jsdom |
| Story a11y | Storybook Vitest addon + a11y addon (axe) | Every story, rendered in a real browser, in light, dark and comfort |
| Keyboard e2e | Playwright against built Storybook | Real focus order, Tab wrapping, Esc, focus return |
| Visual | Playwright screenshots | Focus ring and themes do not regress (one screenshot per state per theme) |
| Zoom and spacing | Playwright | Page at 400% zoom and with WCAG 1.4.12 text spacing CSS injected has no clipped text or horizontal scroll |
| Screen reader | Guidepup (optional) + manual | Transcript for the docs page; manual passes recorded in passports |
| Size | size-limit | `@kerb/react` stays under the budget (start at `[n] kB`, set after first build) |

## Rules

* Tests query by role and accessible name (`getByRole('button', { name: 'Delete' })`), never by class or test id unless there is no accessible handle
* Every keyboard row in a component spec becomes a test
* Theme loop helper: `forEachTheme((theme) => …)` sets `data-kerb-theme` before each run
* Unit test helpers live in `packages/react/test/utils.tsx`: `renderWithKerb` (renders inside `KerbProvider`), `forEachTheme`, `liveRegion`, `mockMatchMedia` and an `axe` set up for jsdom
* axe in jsdom runs with `color-contrast` off, because jsdom does not render. Contrast is proven by the token contrast test and by the story a11y run in a real browser
* Type level rules (an icon only Button needs a name, a TextField needs a label) are tested with `// @ts-expect-error` lines, which `pnpm typecheck` checks

## Story a11y (`pnpm test:a11y`)

`apps/storybook/vitest.config.ts` defines three Vitest projects, `stories-light`, `stories-dark` and `stories-comfort`. Each one runs every story as a test in headless Chromium (Vitest browser mode with the Playwright provider) and sets the Storybook `theme` global, so the story renders through `KerbProvider` in that theme. The a11y addon runs axe after each story and fails the test on any violation (`parameters.a11y.test: "error"` in `preview.ts`).

`apps/storybook/.storybook/vitest.setup.ts` adds two checks of its own:

* **Tokens guard:** the run fails at once if `--kerb-color-bg` is not defined. A canvas without tokens has no colours to fail on, so every story would pass by mistake
* **Placeholder is never the label:** a story fails if an `input` or `textarea` has a placeholder and no label. axe alone accepts a placeholder as the name

It reads source, not the built Storybook, so it only needs `packages/tokens/dist`. The Storybook test runner (`@storybook/test-runner`) is not used: its support has ended and it cannot load its config file under Jest 30.

## Keyboard e2e (`pnpm test:e2e`)

* Specs live in `tests/e2e/`, one file per component, and open one story at a time through `iframe.html` (`openStory` in `helpers.ts`)
* They run against the built Storybook, which is the only place a production build problem shows up (for example a stylesheet dropped by tree shaking), so `expectFocusRing` checks the real ring colour
* Locally Playwright reuses whatever is already on port 6006. Stop `pnpm storybook` first, or the specs run against the dev server
* `savePreferences(page, { density: "compact" })` from `helpers.ts` stores a preference before the page loads, the way `KerbProvider` saves it for Storybook
* A story used to test "Tab leaves the component" needs a focusable element after it. With nothing after, Firefox wraps focus back into the component
* Use `tab(page)` from `helpers.ts` instead of pressing Tab directly. Safari only stops at text fields with a plain Tab, so in WebKit it presses Option+Tab

## Counting for the passport

A script `scripts/passport-stats.ts` runs after tests and writes per component:

```json
{ "keyboardTests": 14, "axeViolations": 0, "lastRun": "2026-11-02" }
```

into `apps/docs/content/passports/<slug>.stats.json`. The docs read these. Never hand edit them.

## CI (`.github/workflows/ci.yml`)

On every pull request and push to `main`:

1. Install with pnpm (cache)
2. `pnpm lint` and `pnpm typecheck`
3. `pnpm build` (tokens, react, storybook, docs)
4. `pnpm test` (includes contrast test)
5. Install the Playwright browsers
6. `pnpm test:a11y` (Storybook Vitest addon with axe, all themes) and `pnpm test:e2e` (Playwright, Chromium, Firefox, WebKit)
7. `pnpm size`
8. Upload Playwright report as an artifact on failure
9. On `main` only: Changesets release action publishes to npm and deploys Storybook

## Manual screen reader checklist (per component, before marking Stable)

* VoiceOver + Safari (macOS), VoiceOver + Safari (iOS), NVDA + Firefox (Windows), TalkBack + Chrome (Android)
* Name, role, state read correctly
* All actions possible without sight
* Record date and tester in `passports/<slug>.json`

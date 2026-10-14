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

axe runs on the whole `<body>` (`parameters.a11y.context` in `preview.ts`), not only the story root, because dialogs render in a portal on `<body>`. The page level rules `region`, `landmark-one-main` and `page-has-heading-one` are off: stories are fragments, not pages.

`react-dom` is listed in Storybook's `optimizeDeps.include`. A dependency that Vite discovers in the middle of the run makes it reload, and the story tests in flight fail; with a cold cache in CI that would be flaky.

`apps/storybook/.storybook/vitest.setup.ts` adds two checks of its own:

* **Tokens guard:** the run fails at once if `--kerb-color-bg` is not defined. A canvas without tokens has no colours to fail on, so every story would pass by mistake
* **Placeholder is never the label:** a story fails if an `input` or `textarea` has a placeholder and no label. axe alone accepts a placeholder as the name

It reads source, not the built Storybook, so it only needs `packages/tokens/dist`. The Storybook test runner (`@storybook/test-runner`) is not used: its support has ended and it cannot load its config file under Jest 30.

## Keyboard e2e (`pnpm test:e2e`)

* Specs live in `tests/e2e/`, one file per component, and open one story at a time through `iframe.html` (`openStory` in `helpers.ts`)
* They run against the built Storybook, which is the only place a production build problem shows up (for example a stylesheet dropped by tree shaking), so `expectFocusRing` checks the real ring colour
* Locally Playwright reuses whatever is already on port 6006. Stop `pnpm storybook` first, or the specs run against the dev server
* `openStory(page, id, { theme })` opens a story in a theme through the Storybook `globals` URL parameter. It waits for the story root to have content attached, not visible: some stories render nothing of their own (toasts)
* Positions that browsers settle a frame late (anchor positioning in Firefox) are checked with `expect.poll`
* `savePreferences(page, { density: "compact" })` from `helpers.ts` stores a preference before the page loads, the way `KerbProvider` saves it for Storybook
* A story used to test "Tab leaves the component" needs a focusable element after it. With nothing after, Firefox wraps focus back into the component
* Use `tab(page)` from `helpers.ts` instead of pressing Tab directly. Safari only stops at text fields with a plain Tab, so in WebKit it presses Option+Tab

## Docs checks (`pnpm test:docs`)

`playwright.docs.config.ts` runs `tests/docs/` against the built docs site (`pnpm --filter docs start`, so `pnpm build` first; stop `pnpm dev` first, or the checks reuse the dev server on port 3000). Chromium only: these check the pages, while the components are covered in three browsers by `test:e2e`.

For every route:

* axe (from `axe-core`, injected into the page) in light, dark and comfort, colour contrast included
* 400% zoom: 320 by 256 CSS pixels (1280 by 1024 at 400%), no sideways page scroll and no clipped text
* Text spacing: the WCAG 1.4.12 values injected (line height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em), no sideways scroll and no clipped text
* The comfort theme at 200% zoom (640 by 512): the passport's "Comfort theme" field

"Clipped text" is an element with text that hides its overflow and whose content is larger than its box. One pixel boxes (screen reader only text) are left out. Code blocks and tables scroll inside themselves, so they never make the page scroll.

`tests/docs/site.spec.ts` covers the site's own flows: skip link, current page in the nav, search (`/`, arrows, Enter, the announced count, Esc), the "Try it with" toggles, copying code, the Preferences side panel and sheet, and the phone menu.

## Counting for the passport

`pnpm passports` (`node scripts/passport-stats.ts`) runs after the tests and writes, per component, into `apps/docs/content/passports/<slug>.stats.json`:

```json
{ "keyboardTests": 19, "axeViolations": 0, "axeRuns": 24, "comfortZoom": "passed", "lastRun": "2026-10-14" }
```

and the totals, with the gzipped size of `packages/react/dist/index.js`, into `apps/docs/content/stats.json`. The docs read these. Never hand edit them.

It reads the JSON reports the runs write to `reports/` (outside `test-results/`, which every Playwright run empties):

| Number | Source | Counted as |
| --- | --- | --- |
| `keyboardTests` | `reports/e2e.json`, from `tests/e2e/<slug>.spec.ts` | Each test once (not once per browser), when it passed in every browser it ran in. The file name is the component |
| `axeViolations`, `axeRuns` | `reports/a11y.json`, from the stories in `packages/react/src/<slug>/` | Every story run in every theme is one run; a failed run counts as a violation. With every run passing it is exactly 0 |
| `comfortZoom` | `reports/docs.json` | The "comfort theme at 200% zoom" check of the component's docs page |
| `lastRun` | `reports/e2e.json` | The date the e2e run started |

CI runs `node scripts/passport-stats.ts --check` after the tests. It fails when the committed numbers (everything but the date and size) differ from that run, so the numbers on the site are the numbers CI saw. After a change that adds or removes tests: run `pnpm test:a11y`, `pnpm test:e2e` and `pnpm test:docs`, then `pnpm passports`, and commit the files.

## CI (`.github/workflows/ci.yml`)

On every pull request and push to `main`:

1. Install with pnpm (cache)
2. `pnpm lint` and `pnpm typecheck`
3. `pnpm build` (tokens, react, storybook, docs)
4. `pnpm test` (includes contrast test)
5. Install the Playwright browsers
6. `pnpm test:a11y` (Storybook Vitest addon with axe, all themes) and `pnpm test:e2e` (Playwright, Chromium, Firefox, WebKit)
7. `pnpm test:docs` (every docs page: axe in all themes, zoom, text spacing) and `node scripts/passport-stats.ts --check`
8. `pnpm size`
9. Upload Playwright report as an artifact on failure
10. On `main` only: Changesets release action publishes to npm and deploys Storybook

## Manual screen reader checklist (per component, before marking Stable)

* VoiceOver + Safari (macOS), VoiceOver + Safari (iOS), NVDA + Firefox (Windows), TalkBack + Chrome (Android)
* Name, role, state read correctly
* All actions possible without sight
* Record date and tester in `passports/<slug>.json`

# 07 · Testing and CI

## Layers

| Layer | Tool | What it proves |
| --- | --- | --- |
| Token contrast | Vitest | Every semantic colour pair meets its ratio in all themes |
| Unit | Vitest + Testing Library + `vitest-axe` | Roles, names, states, keyboard handlers, no axe violations in jsdom |
| Story a11y | Storybook test runner + axe | Every story, rendered in a real browser, in light, dark and comfort |
| Keyboard e2e | Playwright against built Storybook | Real focus order, Tab wrapping, Esc, focus return |
| Visual | Playwright screenshots | Focus ring and themes do not regress (one screenshot per state per theme) |
| Zoom and spacing | Playwright | Page at 400% zoom and with WCAG 1.4.12 text spacing CSS injected has no clipped text or horizontal scroll |
| Screen reader | Guidepup (optional) + manual | Transcript for the docs page; manual passes recorded in passports |
| Size | size-limit | `@kerb/react` stays under the budget (start at `[n] kB`, set after first build) |

## Rules

* Tests query by role and accessible name (`getByRole('button', { name: 'Delete' })`), never by class or test id unless there is no accessible handle
* Every keyboard row in a component spec becomes a test
* Theme loop helper: `forEachTheme((theme) => …)` sets `data-kerb-theme` before each run

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
5. `pnpm test:a11y` (Storybook test runner with axe, all themes)
6. `pnpm test:e2e` (Playwright, Chromium, Firefox, WebKit)
7. `pnpm size`
8. Upload Playwright report as an artifact on failure
9. On `main` only: Changesets release action publishes to npm and deploys Storybook

## Manual screen reader checklist (per component, before marking Stable)

* VoiceOver + Safari (macOS), VoiceOver + Safari (iOS), NVDA + Firefox (Windows), TalkBack + Chrome (Android)
* Name, role, state read correctly
* All actions possible without sight
* Record date and tester in `passports/<slug>.json`

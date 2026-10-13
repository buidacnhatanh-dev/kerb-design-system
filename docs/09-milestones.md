# 09 · Milestones

Work one milestone at a time. Each has a brief and an acceptance check. Review the result, run the app, then commit before the next one.

---

## M0 · Scaffold

**Brief**

> Read CONTRIBUTING.md and docs/01-architecture.md. Scaffold the monorepo exactly as described: pnpm workspaces, tsconfig base, ESLint flat config with jsx-a11y strict, Prettier, Changesets, empty packages `@kerb/tokens` and `@kerb/react`, `apps/storybook` (React Vite) and `apps/docs` (Next.js App Router), Vitest and Playwright configs, and the CI workflow from docs/07-testing-and-ci.md with steps that are not ready yet skipped. Make `pnpm install`, `pnpm lint`, `pnpm typecheck` and `pnpm build` pass. Do not build any components yet.

**Done when** all four commands pass on a clean clone and CI runs green.

---

## M1 · Tokens and themes

**Brief**

> Read docs/02-tokens.md and docs/03-themes-and-preferences.md (themes part only). Copy the JSON from /tokens into packages/tokens/src. Configure Style Dictionary to output dist/kerb.css with light on :root, dark and comfort on data-kerb-theme attributes, plus tokens.json and tokens.d.ts, including color-scheme per theme. Write the contrast test described in 02-tokens.md and make it pass. Add packages/react/src/styles/base.css with Fontsource fonts, the focus ring from docs/04-accessibility-rules.md, reduced motion rules and forced colours fixes. Add a Storybook decorator and toolbar to switch between the three themes.

**Done when** contrast test passes and Storybook shows a blank page that switches theme from the toolbar.

---

## M2 · Provider, Announcer, Button, TextField

**Brief**

> Read docs/03-themes-and-preferences.md, docs/05-components.md and the specs for announcer, button and text-field in docs/components. Build KerbProvider with the preferences store (useSyncExternalStore, localStorage with try catch, CSS variables on html, getKerbHeadScript), the Announcer, the shared internals listed in 05-components.md, then Button and TextField. For each: stories for every state, the Themes story, unit tests covering every bullet in the spec's Tests section, and a Playwright keyboard test. Set up the Storybook test runner with axe for all three themes. Compare visually against design/06-CompInputs.png.

**Done when** the Definition of done in CONTRIBUTING.md holds for Button and TextField.

---

## M3 · Remaining inputs

**Brief**

> Following the same pattern as Button and TextField, build Select, Checkbox and RadioGroup from their specs in docs/components. Match design/06-CompInputs.png. Meet the Definition of done in CONTRIBUTING.md for each.

---

## M4 · Overlays and feedback

**Brief**

> Build Tooltip, Toast, Dialog and Tabs from their specs in docs/components, in that order. Dialog is the most important component in the case study: implement focus remember, inert background, focus return with fallback exactly as specified, and write a Playwright test for every keyboard row. Match design/07-CompOverlays.png. Meet the Definition of done in CONTRIBUTING.md for each.

---

## M5 · DatePicker

**Brief**

> Build DatePicker from docs/components/date-picker.md using react-aria hooks and @internationalized/date only inside this component. Default locale from the html lang attribute, week starting Monday for de-DE. Match the date picker in design/07-CompOverlays.png. Meet the Definition of done.

---

## M6 · Kerb originals

**Brief**

> Build ComfortControls and Preferences from their specs, using the store from KerbProvider. Implement all five presets, export and import codes, reset with an Undo toast, the panel and sheet variants, and announcements for every change. Match design/09-DocsPreferences.png and the sheet in design/12-Mobile.png. Meet the Definition of done.

---

## M7 · Docs site

**Brief**

> Read docs/06-docs-site.md. Build apps/docs with the global layout, every route in the pages table, and the component page template including the accessibility passport, the Try it with toolbar and the screen reader transcript panel. Write scripts/passport-stats.ts from docs/07-testing-and-ci.md so passports show real test counts. Generate props tables from TypeScript. Match design/03-Main.png, design/08-DocsDialog.png, design/09-DocsPreferences.png and the phone layouts in design/12-Mobile.png. Run Playwright zoom and text spacing checks on the docs pages.

**Done when** every page passes axe in all themes, works at 400% zoom, and the passport numbers come from CI.

---

## M8 · Release and portfolio

**Brief**

> Prepare version 1.0.0: README for each package, size-limit budget set from the current build plus 10 percent, Changesets release workflow, Storybook deployment, Vercel config for apps/docs, og:image meta using design/02-Social.png. Then read docs/08-portfolio.md and build apps/portfolio-demo with the project modal using Dialog and Tabs from @kerb/react, with a Playwright test for open, tab switching and focus return.

**Done when** `npm install @kerb/react` works in a fresh Vite app and the demo modal passes its tests.

---

## After M8 (by hand)

* Manual screen reader passes, fill passports (`[date]`, testers)
* Optional: Guidepup recordings to replace transcript text
* Replace every `[placeholder]` in the case study with real numbers

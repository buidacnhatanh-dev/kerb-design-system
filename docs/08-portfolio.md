# 08 · Portfolio integration

Design: `design/10-CaseStudy.png`, `design/11-PortfolioModal.png`, `design/01-Cover.png`, `design/02-Social.png`, `design/12-Mobile.png`.

Kerb must be used in the author's portfolio so the case study can say "where it's used".

## Project modal

The portfolio's project card opens a Kerb `Dialog` with:

* Dark header: "DESIGN SYSTEM · 2026" (yellow small caps), title "Kerb", close button (44px, Kerb focus ring)
* Kerb `Tabs`: Overview, Process, Outcome
  * Overview: "Thirteen accessibility first React components with a documentation site, three themes and a Preferences panel, published on npm. Built because every team I worked with rebuilt the same broken dialogs and forms."
  * Process: "Token system first, then components one by one against the WAI-ARIA patterns, each tested with axe, keyboard tests and screen readers before it was marked stable."
  * Outcome: "[n] axe violations, [n] keyboard tests in CI, [n] kB gzipped. Used in this portfolio and [project]."
* Chips change per tab: Overview (React, TypeScript, Design tokens), Process (Storybook, WAI-ARIA, VoiceOver, NVDA), Outcome (Vitest, axe, npm)
* Footer: small Kerb logo note that the dialog is built with Kerb + "Read the case study" primary button
* Closing returns focus to the project card

## Case study page sections

1. Hero: title, summary, Role / Timeline / Stack / Links, the three theme dialog previews
2. 01 · Why: every team rebuilds the same button; thesis link; three audience cards
3. 02 · Design decisions: token layers, three themes, Overpass and the GOV.UK style ring
4. 03 · The hard problem: keeping focus inside the dialog, four steps, code, what I learned
5. 04 · Before and after: the text field after testing `[describe the test]`
6. 05 · Built for choice: Preferences, three layers (Device, Preset, Person), four preset previews, `[finding from testing presets]`
7. 06 · Results: `[0]` axe violations, `[n]` keyboard tests, `[n] kB`, `[n]` places in use, "Where it's used" link to the modal

## Images

* `design/01-Cover.png` 1600 × 1200: portfolio grid card
* `design/02-Social.png` 1200 × 630: `og:image` and `twitter:image` for the case study page
* Alt text for the cover: "Kerb design system: a dialog with a yellow focus ring around the Keep project button, two preference presets, and a screen reader transcript."

## Optional build task

If the portfolio is in this repo or a sibling, add `apps/portfolio-demo` that reproduces the modal with `@kerb/react` so it can be tested in CI.

## apps/portfolio-demo (M8)

A Vite app (no React plugin: the automatic JSX runtime is enough) with a portfolio page and the project card. The card is the Dialog's `trigger`, so focus returns to it on close. Tested in Chromium, Firefox and WebKit with `pnpm test:portfolio` (`playwright.portfolio.config.ts`): open from the card with focus on Close, arrow keys between the tabs with the chips changing, Esc and Close returning focus to the card, and axe on the open modal.

* The dark header is Dialog's own `headerTheme="dark"` with `eyebrow`, not a style override of Kerb's class names
* Focus starts on Close (`initialFocus="close"`), as on the board
* The modal keeps Dialog's 480px maximum width (`components/dialog.md`); the board shows it wider
* "Read the case study" is a link styled as a primary button, because it goes to a page. Its address is `CASE_STUDY_URL` in `src/ProjectModal.tsx` (`/work/kerb`): set it in the real portfolio
* The Outcome numbers come from `apps/docs/content/stats.json` (the last CI run). `[project]` stays a placeholder until there is a second place Kerb is used
* The cover image is `design/01-Cover.png` with the alt text above
* `og:image` is on the docs site (`apps/docs/public/og-image.png`). The case study page is part of the portfolio, not this repository: use the same image and alt text there


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

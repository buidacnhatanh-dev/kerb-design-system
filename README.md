# Kerb build spec

**Live:** docs at [kerb-docs.vercel.app](https://kerb-docs.vercel.app) · Storybook at [buidacnhatanh-dev.github.io/kerb-design-system](https://buidacnhatanh-dev.github.io/kerb-design-system/)

This folder is everything needed to build Kerb: an accessibility first React design system with three themes, a Preferences panel, a docs site and Storybook.

## How to use it

1. Read `CONTRIBUTING.md`: stack, conventions, accessibility rules and the Definition of done.
2. Build one milestone at a time from `docs/09-milestones.md`, and review each before moving on.

## What is in here

| Path | What it is |
| --- | --- |
| `CONTRIBUTING.md` | Rules for every change: stack, conventions, accessibility rules, definition of done |
| `docs/00-overview.md` | What Kerb is, who it is for, scope |
| `docs/01-architecture.md` | Tech stack, repo layout, scripts, package outputs |
| `docs/02-tokens.md` | Token model, every value, how Style Dictionary builds them |
| `docs/03-themes-and-preferences.md` | Light, dark and comfort themes, the preferences store, system settings |
| `docs/04-accessibility-rules.md` | Focus ring, contrast, target size, motion, announcements. Applies to every component |
| `docs/components/*.md` | One spec per component (13 total) with API, states, keyboard, ARIA and tests |
| `docs/06-docs-site.md` | Every page of the docs site, including the accessibility passport and screen reader transcript |
| `docs/07-testing-and-ci.md` | Unit, axe, keyboard, visual and screen reader testing, plus the CI pipeline |
| `docs/08-portfolio.md` | How Kerb plugs into the portfolio site, cover and social images |
| `docs/09-milestones.md` | Build order with a brief and acceptance criteria for each milestone |
| `tokens/*.json` | Real token values in W3C design token format. Copy into `packages/tokens/src` |
| `design/*.png` | The design boards. Treat them as the visual source of truth |

## Placeholders

Anything in square brackets, like `[n] passing` or `[date]`, is a real number to fill in after testing. Never invent these: compute them (test counts, bundle size) or leave the brackets.

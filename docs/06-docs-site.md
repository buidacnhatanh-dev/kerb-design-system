# 06 · Docs site (`apps/docs`)

Next.js App Router, statically exported where possible, deployed to Vercel. It imports the real `@kerb/react` from the workspace, so every example is the shipped component.

Design: `design/03-Main.png` (home), `design/08-DocsDialog.png` (component page), `design/09-DocsPreferences.png` (Preferences page), `design/12-Mobile.png` (phone layouts).

## Global layout

* Header: logo + "Kerb" (Overpass 700), search field with `/` shortcut hint, version, Preferences button (sliders icon, opens `<Preferences variant="sheet">` on small screens and a side panel on large), GitHub link
* Left nav groups: Get started (Install, Theming), Foundations (Tokens, Focus), Components (10), Kerb originals (Preferences, Comfort controls, Announcer). Current page: `aria-current="page"`, blue left bar, soft blue background
* Right rail "On this page" with anchor links (hidden below 1200px)
* Skip link "Skip to main content" as the first focusable element
* Head script from `getKerbHeadScript` so preferences apply before paint
* Mobile: nav collapses into a menu button (Dialog sheet), Preferences button stays visible in the header

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero ("Components that work for everyone, by default."), install snippet, three feature cards (Keyboard first, Screen reader tested, Three themes), component grid (13 tiles with pattern labels), "Tested on every change" stats bar with real numbers from CI |
| `/install` | npm install, CSS import, wrapping with `KerbProvider`, fonts |
| `/theming` | The three themes, live switcher, how to make a custom theme from semantic tokens |
| `/tokens` | Token tables generated from `@kerb/tokens/dist/tokens.json` (colour with contrast ratios computed at build time, type, space, radius) |
| `/focus` | The GOV.UK style ring, why, the CSS, forced colours behaviour |
| `/components/[slug]` | One page per component using the template below |
| `/originals/preferences` | Preferences page, see below |

## Component page template

1. Breadcrumb, H1, one line description, badges (Stable, WAI-ARIA pattern name, `axe: [n] violations` computed)
2. **Accessibility passport** card: dashed divider, rotated "TESTED [date]" stamp, grid of fields (Pattern, WCAG 2.2 criteria, Screen readers, Browsers, Keyboard tests `[n] passing`, Comfort theme checked at 200% zoom). Data comes from `apps/docs/content/passports/<slug>.json`, which CI updates with real test counts. Screen reader and date fields are filled manually after testing
3. **Live example** with a "Try it with" toolbar of toggle buttons (`aria-pressed`): Keyboard only (shows focus on click), 200% zoom (scales the example frame), Comfort (sets theme on the example only), Reduce motion. Next to the example, a dark panel "WHAT A SCREEN READER SAYS" showing the transcript lines for the current state (from the spec, later replaced with Guidepup recordings). The panel is `aria-hidden="true"` because it duplicates what assistive tech already says; a visually hidden note explains this
4. Code block for the example (copy button)
5. When to use it: green "Use for" and red "Avoid for" cards, each with icon and heading (not colour alone)
6. Accessibility notes list
7. Keyboard table (`<kbd>` keys, action)
8. Props table generated from TypeScript with `react-docgen-typescript`

## Preferences page

Same template, with the live example replaced by the full panel on the left and a preview page on the right (heading, two paragraphs with a link, email field, two buttons with one focused, a success status). Then: "What each preset changes" cards, "System settings come first" table, "Use it in your app" code, Accessibility notes.

## Search

Build time index of headings and component names (no third party service). Opens as a Dialog; results list is a listbox with arrow key navigation; result count announced through the Announcer.

## Content source

MDX files in `apps/docs/content/`, one per page, with frontmatter for passport and badges.

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

## How it is built (M7 decisions)

### Structure

* `lib/registry.ts` lists every page once. The left nav, the home grid, search, the static params and the props tables all read it
* Routes: `/`, `/install`, `/theming`, `/tokens`, `/focus`, `/components/[slug]` (the ten components) and `/originals/[slug]` (Preferences, Comfort controls, Announcer). The pages table names only `/originals/preferences`; the other two originals get the component template under `/originals/` because the nav lists them there. Every route is prerendered at build time
* Content: `content/components/<slug>.mdx` and `content/pages/<page>.mdx`, through `@next/mdx` with `remark-frontmatter` and `remark-mdx-frontmatter`. The frontmatter holds the structured parts of a component page (description, pattern, example caption, transcript, use and avoid lists, keyboard rows); the body holds the prose, starting with `## Accessibility`. Markdown renders through `mdx-components.tsx`: ids on headings, Kerb code blocks, focusable table regions
* Passport facts are in `content/passports/<slug>.json` (written by hand: pattern, WCAG criteria, the manual screen reader pass); the numbers are in `<slug>.stats.json` (generated, see `07-testing-and-ci.md`). Badges come from both
* Live examples are client components in `examples/<slug>.tsx`. The code block under each example is that file's own source, read at build time, so the code shown is the code running
* Props tables: `react-docgen-typescript` for components, the TypeScript compiler for option types (`ToastOptions`, `AnnounceOptions`, `TabProps`, since `Tabs.Tab` is a static), read from `packages/react/src` at build time. Only props Kerb declares are listed, not every native attribute; a union behind an alias is spelled out
* Code highlighting is a small tokenizer in `lib/highlight.ts` (TSX, CSS, shell). Code blocks and the transcript are dark islands (`data-kerb-theme="dark"`), like the toasts

### Choices that differ from the design boards

* **Header.** Every page has the global header from this spec (logo, search, version, Preferences, GitHub). The marketing nav and theme switch on `03-Main.png` are left out: the theme is in Preferences, and `/theming` has the live switcher
* **Version.** The real `@kerb/react` version is shown (`v0.0.0` until 1.0 ships), not the board's `v1.0.0`
* **Status badge.** "Beta" until the passport's manual screen reader pass is filled in, then "Stable" (`07-testing-and-ci.md`: the manual checklist comes before Stable)
* **Transcripts** are expected output, written from the component's roles and names, and labelled "Expected output, not a recording yet". Only Dialog's comes from its spec. Guidepup recordings replace them later
* **Passport fields.** Screen readers show `[manual pass pending]` until the manual pass. Browsers name the automated ones (Chromium, Firefox, WebKit). "Comfort theme: Checked at 200% zoom" is shown only when that docs check passed
* **Home stats.** "gzipped JavaScript" is `packages/react/dist/index.js` compressed with gzip (level 9) by the stats script. `pnpm size` reports brotli, so the two numbers differ
* **Preferences page.** The live example is the panel next to a preview page, with no toolbar or code (the code is under "Use it in your app"). The preview's buttons are not shown in a forced focus state: press Tab to see the ring

### Behaviour

* **Preferences button.** At 75em (1200px) and wider it opens a side panel: a non modal `<aside>`, focus moves to its Close button, Esc inside it closes it and returns focus to the button. Narrower, it opens `<Preferences variant="sheet">`
* **Menu.** Below 56em the left nav moves into a Dialog sheet (`placement="bottom"`, focus on Close) with Search and GitHub. Following a link closes it
* **Search.** A Dialog with a combobox field (`aria-activedescendant`) and a listbox of results; arrow keys move, Enter opens, a press on a result opens it. Every page and every heading is indexed at build time. The count is announced through the Announcer 500ms after typing rests. `/` opens it from anywhere but a text field. In a search field the browser's own Esc clears the text first; the next Esc closes the dialog
* **Try it with.** Each toggle sets a Kerb attribute on the example frame only: `data-kerb-focus-on-click`, `zoom: 2`, `data-kerb-theme="comfort"`, `data-kerb-motion="reduced"`. Overlays that leave the frame (a modal dialog, toasts) follow the page instead
* **Scrolling regions.** Code blocks and tables that can scroll sideways are focusable, named regions (`Code: <first line>`, `Props of Dialog`, `Table: Preset, Values`), so they can be scrolled from the keyboard
* **Skip link** is the first Tab stop. `main` is not given a `tabindex`: browsers move the Tab starting point to the anchor target
* Next.js adds its own route announcer (an `aria-live` region) for client side navigation. It is framework code, outside Kerb's Announcer rule, and is left in place because it is what announces the new page


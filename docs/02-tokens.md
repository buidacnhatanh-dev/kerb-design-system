# 02 · Tokens

See `design/04-Tokens.png`. Source files are in `/tokens` (W3C design token format). Copy them to `packages/tokens/src/`.

## Three layers

| Layer | Example | Rule |
| --- | --- | --- |
| Primitive | `palette.blue.700 = #1D4ED8` | The raw palette. Never used directly in a component |
| Semantic | `color.action-primary` | Named by purpose. Each theme points these at different primitives |
| Component | `button.primary.bg` | Optional, only when a component needs its own override. Always built from semantic tokens |

## CSS variable naming

Style Dictionary outputs kebab case with a `kerb` prefix:

* `color.action-primary` becomes `--kerb-color-action-primary`
* `font.size.body` becomes `--kerb-font-size-body`
* `space.4` becomes `--kerb-space-4`
* `font.lineHeight.body` becomes `--kerb-font-line-height-body`

The palette is the exception: `palette.*` is never written to CSS, so there is no `--kerb-palette-blue-700`. Components physically cannot reach a primitive colour. Code that needs a raw palette value (for example the focus colour choices in the preferences store) reads it from `tokens.json`.

## Colour (semantic)

Contrast ratios are against the theme background. Re-check every pair with the contrast test in `07-testing-and-ci.md` after any change.

| Token | Use | Light | Dark | Comfort |
| --- | --- | --- | --- | --- |
| `color.bg` | Page background | `#FFFFFF` | `#101318` | `#F5EFE1` |
| `color.surface` | Cards, code, menus | `#F4F5F7` | `#1A1E25` | `#EDE5D2` |
| `color.text` | Body text, headings | `#15181D` 17.8 : 1 | `#F2F4F7` 16.9 : 1 | `#1E1B16` 15.0 : 1 |
| `color.text-muted` | Hints, captions | `#4A5260` 7.9 : 1 | `#B4BCC8` 9.7 : 1 | `#4F4A40` 7.7 : 1 |
| `color.border-input` | Field and control edges | `#7B8494` 3.8 : 1 | `#7C8594` 5.0 : 1 | `#7E7663` 3.9 : 1 |
| `color.line` | Dividers (decorative, no contrast rule) | `#DDE1E7` | `#2C323C` | `#EDE5D2` |
| `color.action-primary` | Primary buttons, links | `#1D4ED8` 6.7 : 1 | `#8EB1FF` 8.8 : 1 | `#1D4ED8` 5.8 : 1 |
| `color.action-primary-hover` | Primary hover | `#1E3A8A` | `#E8EEFC` | `#1E3A8A` |
| `color.on-primary` | Text on primary | `#FFFFFF` | `#101318` | `#FFFFFF` |
| `color.danger` | Errors, destructive | `#B42318` 6.6 : 1 | `#FF8A7A` 8.1 : 1 | `#A3261A` 6.4 : 1 |
| `color.success` | Confirmation | `#1A7F3C` 5.1 : 1 | `#6FD38F` 10.1 : 1 | `#1A7340` 5.1 : 1 |
| `color.focus` | Outer focus ring | `#FFC21A` | `#FFC21A` 11.5 : 1 | `#FFC21A` |
| `color.focus-ink` | Inner focus ring | `#15181D` | `#101318` | `#15181D` |

The rest (`surface-raised`, hover states, disabled, soft fills, overlay) are in the JSON files.

## Type

Headings use Overpass, everything else Atkinson Hyperlegible, code JetBrains Mono. Sizes are in rem in the JSON (px shown here for reading).

| Token | Weight | Default size / line | Comfort size / line |
| --- | --- | --- | --- |
| `display` | 800 | 48 / 56 | 52 / 62 |
| `heading-1` | 800 | 36 / 44 | 40 / 52 |
| `heading-2` | 800 | 28 / 36 | 32 / 42 |
| `heading-3` | 700 | 22 / 30 | 24 / 34 |
| `body-large` | 400 | 18 / 28 | 20 / 34 |
| `body` | 400 | 16 / 26 | 18 / 31 |
| `small` | 400 | 14 / 22 | 16 / 27 |
| `code` | 400 | 14 / 22 | 16 / 26 |

Comfort also sets body letter spacing to `0.01em`.

## Spacing, radius, size

| Token | Value |
| --- | --- |
| `space.1` to `space.8` | 4, 8, 12, 16, 24, 32, 48, 64 px (as rem) |
| `radius.sm / md / lg / full` | 4, 8, 12, 999 px |
| `size.target.min` | 44 px |
| `size.target.compact / default / spacious` | 40, 48, 56 px (control heights per density preference) |
| `focus.width.standard / thick` | 6, 8 px (outer edge of the yellow ring) |
| `motion.duration.fast / base / slow` | 120, 200, 320 ms |

Compact density keeps a 44 px hit area with padding even when the visible control is 40 px.

## Style Dictionary config

* Source: `src/primitives.json` plus one semantic file per build
* `style-dictionary.config.mjs` exports three configs, one per theme. `build.mjs` runs them (`pnpm --filter @kerb/tokens build`) and writes `dist/`
* Each theme block uses the right selector:
  * light → `:root, [data-kerb-theme="light"]`
  * dark → `[data-kerb-theme="dark"]`
  * comfort → `[data-kerb-theme="comfort"]`
* A theme block contains only the tokens from that theme's semantic file (colour and type scale), with resolved values, no references
* Tokens from `primitives.json` other than the palette go once into a plain `:root` block, shared by all themes. Do not repeat them inside theme blocks: a nested `data-kerb-theme` element would then reset overrides made on `<html>`
* `dist/kerb.css` is the shared block followed by the three theme blocks. `light.css`, `dark.css` and `comfort.css` are the shared block plus one theme
* Also output `dist/tokens.json` (resolved values per theme, keyed `light`, `dark`, `comfort`, palette included) and `dist/tokens.d.ts`. The build fails if the themes do not define the same set of tokens
* A custom format writes `color-scheme: light` or `color-scheme: dark` into each theme block (comfort is `light`)

## Contrast test

`packages/tokens/test/contrast.test.ts` loads the built `dist/tokens.json` (so `pnpm build` must run first) and asserts, for each theme:

* `text`, `text-muted`, `danger`, `success`, `link` on `bg` and on `surface` ≥ 4.5
* `on-primary` on `action-primary` and on `action-primary-hover` ≥ 4.5
* `on-danger` on `danger` ≥ 4.5
* `border-input` on `bg` ≥ 3
* `focus` on `bg` ≥ 3 OR `focus-ink` on `bg` ≥ 3 (one of the two rings must contrast)

The test fails the build if any pair drops below.

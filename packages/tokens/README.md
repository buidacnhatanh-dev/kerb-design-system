# @kerb/tokens

The design tokens behind Kerb: CSS variables for the light, dark and comfort themes, and the same values as JSON.

> **Not on npm yet.** Version 1.0.0 is ready but not published. Until it is, build it from the [repository](https://github.com/buidacnhatanh-dev/kerb-design-system) and install the tarball (`pnpm --filter @kerb/tokens build`, then `pnpm pack` in `packages/tokens`).

Once it is published:

```sh
npm install @kerb/tokens
```

You do not need this package to use `@kerb/react`: its `kerb.css` already contains the tokens. Install it to use the same colours, type and spacing in your own CSS or code.

## CSS

```css
@import "@kerb/tokens/kerb.css";

.card {
  padding: var(--kerb-space-5);
  border-radius: var(--kerb-radius-lg);
  background: var(--kerb-color-surface);
  color: var(--kerb-color-text);
}
```

| File | Contains |
| --- | --- |
| `kerb.css` | All three themes: light on `:root`, dark on `[data-kerb-theme="dark"]`, comfort on `[data-kerb-theme="comfort"]` |
| `light.css`, `dark.css`, `comfort.css` | One theme each, usable on its own |

Set the theme with `data-kerb-theme` on `<html>`, or on any element to theme only that part of the page.

Only semantic tokens are CSS variables (`--kerb-color-action-primary`, `--kerb-font-size-body`, `--kerb-space-4`). The raw palette is not, so components can never reach a colour that has not been checked for contrast.

## JSON

```ts
import tokens from "@kerb/tokens";

tokens.dark.color["action-primary"]; // "#8EB1FF"
```

Types are included. Every theme has `color`, `font`, `space`, `radius`, `size`, `focus`, `motion` and `palette`.

## Contrast

Every text colour meets 4.5 : 1 and every control border and focus colour 3 : 1 against its theme's background. A test checks every pair on each build.

## Licence

MIT

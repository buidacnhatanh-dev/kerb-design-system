# @kerb/react

Accessibility first React components with light, dark and comfort themes. Every button, field and dialog is keyboard ready, checked with axe in every theme, and follows the reader's own settings for text size, spacing, focus and motion.

**Docs:** [kerb-docs.vercel.app](https://kerb-docs.vercel.app) · **Storybook:** [buidacnhatanh-dev.github.io/kerb-design-system](https://buidacnhatanh-dev.github.io/kerb-design-system/)

## Install

> **Not on npm yet.** Version 1.0.0 is ready but not published. Try it today in the [Storybook](https://buidacnhatanh-dev.github.io/kerb-design-system/), or build the packages from the [repository](https://github.com/buidacnhatanh-dev/kerb-design-system) and install the tarballs:
>
> ```sh
> pnpm install && pnpm --filter "@kerb/*" build
> (cd packages/tokens && pnpm pack) && (cd packages/react && pnpm pack)
> # then, in your app
> npm install path/to/kerb-tokens-1.0.0.tgz path/to/kerb-react-1.0.0.tgz
> ```

Once it is published:

```sh
npm install @kerb/react
```

React 18 and 19 are supported (`react` and `react-dom` 18 or later as peer dependencies).

## Use

Load the styles once and wrap your app in `KerbProvider`:

```tsx
import "@kerb/react/kerb.css";
import { Button, KerbProvider } from "@kerb/react";

export function App() {
  return (
    <KerbProvider storageKey="my-app">
      <Button>Save changes</Button>
    </KerbProvider>
  );
}
```

`KerbProvider` holds the person's preferences, writes them to `<html>` as CSS variables, and hosts the shared live regions and toasts. Put it at the root, once.

### Optional styles

```tsx
// Atkinson Hyperlegible, Overpass, Lexend and JetBrains Mono, served from your own site
import "@kerb/react/fonts.css";
// Applies the theme and the reader's settings to html and body, not only to Kerb components
import "@kerb/react/global.css";
```

### No flash on load (server rendering)

```tsx
import { getKerbHeadScript } from "@kerb/react/head-script";

<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: getKerbHeadScript("my-app") }} />
  </head>
```

Use the same storage key as `KerbProvider`. The entry has no `"use client"`, so a server component can call it.

## Components

| Group | Components |
| --- | --- |
| Actions and inputs | `Button`, `TextField`, `Select`, `Checkbox`, `RadioGroup` |
| Overlays and feedback | `Dialog`, `Tabs`, `Tooltip`, `useToast`, `DatePicker` |
| Kerb originals | `Preferences`, `ComfortControls`, `useAnnouncer` |

Hooks: `useKerbPreferences()` reads and changes the person's preferences, `useAnnouncer()` announces to screen readers through the one shared live region, `useToast()` shows toasts.

## What you get without extra props

* A visible focus ring on every control (a dark ink ring inside a yellow one), which people can recolour and thicken
* Targets of at least 44 by 44 pixels, also at compact density
* Errors and statuses with an icon and text, never colour alone
* Motion that follows `prefers-reduced-motion` and the person's own choice
* Three themes: light, dark, and comfort (a warm background, larger text and more spacing)
* Native elements first: `<button>`, `<input>`, `<select>`, `<dialog>`

## Bundle

ESM only, with `"use client"` on the main entry. CSS is one file, `kerb.css`, with the design tokens included. `react-aria`, `react-stately` and `@internationalized/date` are used by `DatePicker` alone.

## Licence

MIT

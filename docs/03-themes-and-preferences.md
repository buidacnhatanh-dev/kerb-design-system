# 03 · Themes and preferences

See `design/05-Themes.png` and `design/09-DocsPreferences.png`.

## Themes

| Theme | For | What changes |
| --- | --- | --- |
| Light | Default | Base palette |
| Dark | Low light, glare sensitivity | Lighter accents so colour still carries meaning on a dark ground |
| Comfort | Low vision, dyslexic readers, anyone tired | Cream background `#F5EFE1` to cut glare, body 18 px, line height 1.75, letter spacing 0.01em |

The theme is set with `data-kerb-theme` on `<html>`. Same components, only token values change.

## How a page gets its settings (three layers)

1. **Device:** on first visit, read system settings
2. **Preset:** one tap for common needs
3. **Person:** fine tune any value. Saved per device, exportable as a code

Later layers override earlier ones. A person's explicit choice always wins over the system.

How the layers are kept apart: the store saves only what the person chose (a preset counts as a choice). The app's own starting values come from the provider's `defaultPreferences` and `theme` props and are never saved. Device settings are not stored at all: they are read at the moment the values are written to `<html>`, and only fill what neither the person nor the app set.

### System settings Kerb reads

| Media query | Kerb behaviour |
| --- | --- |
| `prefers-color-scheme: dark` | Starts in the dark theme |
| `prefers-reduced-motion: reduce` | Motion = reduced. Nothing slides or zooms |
| `prefers-contrast: more` | Solid borders on every control (a media query in each component's CSS), thick focus ring (unless the person chose a focus width) |
| `forced-colors: active` | Hand colours to the system. Focus becomes a real `outline` using `Highlight` |
| Browser text size | All sizes are rem, so a bigger browser default makes everything bigger |

Listen to `matchMedia` change events so switching the OS setting updates the page live, unless the person has overridden that setting.

## Preferences model

```ts
export type KerbPreferences = {
  theme: 'system' | 'light' | 'dark' | 'comfort';
  textSize: number;          // px, 14 to 26, default 16
  lineHeight: number;        // 1.4 to 2.2, default 1.6
  wordSpacing: number;       // em, 0 to 0.24, default 0
  letterSpacing: number;     // em, 0 to 0.12, default 0
  font: 'atkinson' | 'lexend' | 'system';
  measure: 'narrow' | 'medium' | 'wide';   // max line length 52, 66, 84 ch
  focusColor: 'yellow' | 'blue' | 'magenta';
  focusWidth: 'standard' | 'thick';
  density: 'compact' | 'default' | 'spacious';
  motion: 'system' | 'reduced' | 'off';
  underlineLinks: boolean;
  focusOnClick: boolean;     // show focus ring after mouse clicks too
};
```

There is no separate background tint. The "Background" control in Preferences and ComfortControls (White, Warm, Dark) sets `theme` to `light`, `comfort` or `dark`.

Values are cleaned whenever they enter the store: numbers are rounded to their step (text size to 1, the others to 0.01) and clamped to their range, and unknown fields or values are dropped.

### Presets

| Preset | Values |
| --- | --- |
| Standard | All defaults above |
| Low vision | textSize 22, lineHeight 1.7, wordSpacing 0.04, measure wide, focusWidth thick, density spacious, underlineLinks, focusOnClick |
| Dyslexia friendly | theme comfort, font lexend, textSize 18, lineHeight 1.85, wordSpacing 0.16, measure narrow, motion reduced, underlineLinks |
| Tired eyes | theme dark, textSize 18, lineHeight 1.75, wordSpacing 0.02, motion off |
| Keyboard first | focusColor magenta, focusWidth thick, underlineLinks, focusOnClick |

Changing any single value after picking a preset sets the active preset to "Custom".

* Preset names in code: `standard`, `lowVision`, `dyslexia`, `tiredEyes`, `keyboard`
* Applying a preset replaces every earlier choice, so a preset always lands on the same values
* The active preset is worked out by comparing the current values with each preset, so it survives a reload and an import
* Standard means the app's own defaults when the provider was given `defaultPreferences`

### Focus colours

| Choice | On light and comfort | On dark |
| --- | --- | --- |
| Yellow | `#FFC21A` | `#FFC21A` |
| Blue | `#2563EB` | `#8EB1FF` |
| Magenta | `#C026D3` | `#F0ABFC` |

### CSS variables written on `<html>`

| Preference | Variable or attribute |
| --- | --- |
| theme | `data-kerb-theme` |
| textSize | `--kerb-pref-text-size` (rem) |
| lineHeight | `--kerb-pref-line-height` |
| wordSpacing, letterSpacing | `--kerb-pref-word-spacing`, `--kerb-pref-letter-spacing` |
| font | `--kerb-pref-font` |
| measure | `--kerb-pref-measure` (ch) |
| focusColor, focusWidth | `--kerb-focus-color`, `--kerb-focus-width` |
| density | `--kerb-pref-control-height`, `data-kerb-density` |
| motion | `data-kerb-motion="full|reduced|off"` (`system` is resolved from `prefers-reduced-motion` and followed live) |
| underlineLinks | `data-kerb-underline-links` |
| focusOnClick | `data-kerb-focus-on-click` (CSS then uses `:focus` instead of `:focus-visible`) |

Components never read `localStorage`. They only read these variables.

The attributes are always written. A variable is written only when the person or the app chose that value, and removed otherwise, so component CSS falls back to the theme tokens: the comfort theme keeps its 18 px body until someone picks a text size. Always read them with a fallback, for example `var(--kerb-pref-text-size, var(--kerb-font-size-body))`. `--kerb-focus-width` is the one exception: it is also written when `prefers-contrast: more` is set and no width was chosen.

`@kerb/react/global.css` (optional, see `01-architecture.md`) applies these variables to `html` and `body`. Without it only Kerb's components follow them.

## Store and provider

```tsx
<KerbProvider storageKey="kerb" defaultPreferences={...} theme="system">
  <App />
</KerbProvider>
```

* `KerbProvider` owns a small external store (`subscribe`, `getSnapshot`) read with `useSyncExternalStore`
* `theme` is shorthand for `defaultPreferences.theme`
* Persists to `localStorage` under `storageKey` as `{ "v": 1, "prefs": { …only what the person chose } }`, and removes the key when nothing is chosen. All reads and writes wrapped in try and catch (private mode, blocked storage)
* Listens to the `storage` event, so a change in one tab reaches the others
* Applies attributes and variables to `document.documentElement` in one place (`provider/applyPreferences.ts`)
* Hosts the single `Announcer` live regions and the `Toast` region
* `useKerbPreferences()` returns `{ prefs, set, setMany, applyPreset, reset, exportCode, importCode, activePreset }`. It throws a clear error outside `KerbProvider`
* SSR safe: renders nothing preference dependent on the server

### No flash on load

`getKerbHeadScript(storageKey, defaultPreferences?)` returns a tiny inline script string. The docs site puts it in `<head>` so saved preferences apply before first paint. Pass the same storage key and defaults as `KerbProvider`.

It is exported from its own entry, `@kerb/react/head-script`, which has no `"use client"` directive, so a server component can call it. The main entry does not export it. Next.js usage, in the root layout:

```tsx
import { getKerbHeadScript } from '@kerb/react/head-script';

<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: getKerbHeadScript('kerb') }} />
  </head>
```

`suppressHydrationWarning` is needed because the script changes attributes on `<html>` before React hydrates.

The script inlines `applyPreferences` with `toString()`, so the head script and the provider can never disagree. That function must stay self contained: no imports and nothing from outside its own body.

### Export code

`exportCode()` returns a short versioned string, for example `kerb1.18.185.16.0.C.L.N.Y.S.D.R.u` (the Dyslexia friendly preset). `importCode()` validates it and ignores unknown fields. Never throw on bad input: return `{ ok: false, reason }`.

The code is the version, then one field per preference, separated by dots, in this order:

| Position | Field | Written as |
| --- | --- | --- |
| 0 | version | `kerb1` |
| 1 | textSize | px, whole number |
| 2 | lineHeight | times 100 (`185` is 1.85) |
| 3 | wordSpacing | em times 100 |
| 4 | letterSpacing | em times 100 |
| 5 | theme | `S` system, `L` light, `D` dark, `C` comfort |
| 6 | font | `A` atkinson, `L` lexend, `S` system |
| 7 | measure | `N` narrow, `M` medium, `W` wide |
| 8 | focusColor | `Y` yellow, `B` blue, `M` magenta |
| 9 | focusWidth | `S` standard, `T` thick |
| 10 | density | `C` compact, `D` default, `S` spacious |
| 11 | motion | `S` system, `R` reduced, `O` off |
| 12 onwards | switches that are on | `u` underlineLinks, `k` focusOnClick |

A missing or out of range value in positions 1 to 11 makes the code invalid. Anything after position 11 that is not a known switch is ignored, which leaves room for new switches. A change to positions 1 to 11 needs a new version (`kerb2`). Importing a code counts as the person's choice for every field.

### Reset

`reset()` keeps the previous preferences in memory and shows a toast "Preferences reset" with an Undo action for 10 seconds.

The toast is an info toast with an explicit 10 second `duration` (an action toast would otherwise stay until dismissed); it pauses on hover and focus and does not close on its own at reduced or off motion. Undo calls the store's `undoReset()` and announces "Preferences restored". `undoReset()` is not part of the hook's return value.

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

### System settings Kerb reads

| Media query | Kerb behaviour |
| --- | --- |
| `prefers-color-scheme: dark` | Starts in the dark theme |
| `prefers-reduced-motion: reduce` | Motion = reduced. Nothing slides or zooms |
| `prefers-contrast: more` | Solid borders on every control, thick focus ring |
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
  tint: 'white' | 'warm' | 'dark';         // used by ComfortControls and presets
  focusColor: 'yellow' | 'blue' | 'magenta';
  focusWidth: 'standard' | 'thick';
  density: 'compact' | 'default' | 'spacious';
  motion: 'system' | 'reduced' | 'off';
  underlineLinks: boolean;
  focusOnClick: boolean;     // show focus ring after mouse clicks too
};
```

### Presets

| Preset | Values |
| --- | --- |
| Standard | All defaults above |
| Low vision | textSize 22, lineHeight 1.7, wordSpacing 0.04, measure wide, focusWidth thick, density spacious, underlineLinks, focusOnClick |
| Dyslexia friendly | font lexend, textSize 18, lineHeight 1.85, wordSpacing 0.16, measure narrow, tint warm, motion reduced, underlineLinks |
| Tired eyes | theme dark, textSize 18, lineHeight 1.75, wordSpacing 0.02, motion off |
| Keyboard first | focusColor magenta, focusWidth thick, underlineLinks, focusOnClick |

Changing any single value after picking a preset sets the active preset to "Custom".

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
| motion | `data-kerb-motion="full|reduced|off"` |
| underlineLinks | `data-kerb-underline-links` |
| focusOnClick | `data-kerb-focus-on-click` (CSS then uses `:focus` instead of `:focus-visible`) |

Components never read `localStorage`. They only read these variables.

## Store and provider

```tsx
<KerbProvider storageKey="kerb" defaultPreferences={...} theme="system">
  <App />
</KerbProvider>
```

* `KerbProvider` owns a small external store (`subscribe`, `getSnapshot`) read with `useSyncExternalStore`
* Persists to `localStorage` under `storageKey`. All reads and writes wrapped in try and catch (private mode, blocked storage)
* Applies attributes and variables to `document.documentElement` in one place
* Hosts the single `Announcer` live regions and the `Toast` region
* `useKerbPreferences()` returns `{ prefs, set, setMany, applyPreset, reset, exportCode, importCode, activePreset }`
* SSR safe: renders nothing preference dependent on the server

### No flash on load

Export `getKerbHeadScript(storageKey)` returning a tiny inline script string. The docs site puts it in `<head>` so saved preferences apply before first paint. Next.js usage:

```tsx
<script dangerouslySetInnerHTML={{ __html: getKerbHeadScript('kerb') }} />
```

### Export code

`exportCode()` returns a short versioned string, for example `kerb1.18.185.16.L.N.W.S.D.R.u.k`. `importCode()` validates it and ignores unknown fields. Never throw on bad input: return `{ ok: false, reason }`.

### Reset

`reset()` keeps the previous preferences in memory and shows a toast "Preferences reset" with an Undo action for 10 seconds.

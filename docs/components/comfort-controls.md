# ComfortControls (Kerb original)

Design: `design/07-CompOverlays.png` (Reading comfort demo).

A compact inline reading control: text size, line spacing, letter spacing and background, with a live preview. Think of it as the reading section of Preferences that a content page can drop next to an article.

## API

```tsx
<ComfortControls
  preview={<p>Kerb cuts were made for wheelchairs…</p>}  // optional
  controls={['textSize', 'lineHeight', 'letterSpacing', 'background']}
/>
```

* Other props: `title` (default "Reading comfort"), `headingLevel` (default 2). `ref` and remaining props go to the `<section>`, which is labelled by the title
* Reads and writes the same preferences store as `Preferences`. Changing it here changes the whole app
* Ranges: text size 16 to 24px step 1, line spacing 1.4 to 2.2 step 0.05, letter spacing 0 to 0.12em step 0.01
* Background: White, Warm, Dark (radio group of swatches, each with a visible text name). There is no separate tint: the three choices set the `theme` preference to `light`, `comfort` and `dark`, the same as the Background control in Preferences. While the theme is `system`, the swatch for the theme currently shown is the selected one

## Decisions

* Built from the same internal controls as Preferences (`internal/PreferenceControls.tsx`), with the same fixed sizes, value formats and announcements (see the Decisions in `preferences.md`)
* The controls keep fixed sizes; the preview follows the reader's settings (font, size, line height, letter and word spacing, line length) the same way `global.css` applies them to a page
* The background swatches are rounded options, each with a circle in that theme's own background (the circle carries `data-kerb-theme`) and a bold text name. The chosen one has an `action-primary` border and a soft fill, never a `box-shadow`, which is where the focus ring is drawn
* With no `preview`, only the controls are shown

## Accessibility

* Native `<input type="range">` with visible `<label>` and the current value shown next to the label and in `aria-valuetext` ("18 pixels")
* Changes announced politely, debounced 500ms ("Text size 18 pixels")

## Tests

* Arrow keys change ranges, value text correct
* Updates `--kerb-pref-*` variables on `<html>`
* Background sets `data-kerb-theme` on `<html>`
* axe clean

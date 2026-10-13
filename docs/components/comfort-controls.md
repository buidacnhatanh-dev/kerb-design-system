# ComfortControls (Kerb original)

Design: `design/07-CompOverlays.png` (Reading comfort demo).

A compact inline reading control: text size, line spacing, letter spacing and background tint, with a live preview. Think of it as the reading section of Preferences that a content page can drop next to an article.

## API

```tsx
<ComfortControls
  preview={<p>Kerb cuts were made for wheelchairs…</p>}  // optional
  controls={['textSize', 'lineHeight', 'letterSpacing', 'tint']}
/>
```

* Reads and writes the same preferences store as `Preferences`. Changing it here changes the whole app
* Ranges: text size 16 to 24px step 1, line spacing 1.4 to 2.2 step 0.05, letter spacing 0 to 0.12em step 0.01
* Tints: White `#FFFFFF`, Cream `#F5EFE1`, Blue `#E6EEF6`, Green `#EAF2E3` (radio group of swatches, each with a visible text name)

## Accessibility

* Native `<input type="range">` with visible `<label>` and the current value shown next to the label and in `aria-valuetext` ("18 pixels")
* Changes announced politely, debounced 500ms ("Text size 18 pixels")

## Tests

* Arrow keys change ranges, value text correct
* Updates `--kerb-pref-*` variables on `<html>`
* axe clean

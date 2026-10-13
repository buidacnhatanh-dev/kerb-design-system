# Preferences (Kerb original)

Design: `design/09-DocsPreferences.png` (desktop panel) and `design/12-Mobile.png` (bottom sheet).

The full panel where people set how the product looks and behaves for them. Data model, presets and CSS variables are defined in `docs/03-themes-and-preferences.md`.

## API

```tsx
<Preferences
  presets={['lowVision', 'dyslexia', 'tiredEyes', 'keyboard']}
  sections={['reading', 'focus', 'layout', 'motion', 'links']}
  variant="panel"        // 'panel' inline, or 'sheet' (bottom sheet dialog on mobile)
  onDone={() => void}
/>
```

## Layout (panel)

1. Header: "Your preferences" + "Reset" text button
2. **Start from a preset:** radio group of cards in a 2 column grid (Standard, Low vision, Dyslexia friendly, Tired eyes, Keyboard first). Each card: bold name + one line hint. Selected: `action-primary-soft` fill, 2px `action-primary` border
3. **Reading:** Text size, Line spacing, Word spacing (ranges with values); Font (Atkinson, Lexend, System), Line length (Narrow, Medium, Wide), Background (White, Warm, Dark) as segmented radio groups
4. **Focus, layout and motion:** Focus colour (Yellow, Blue, Magenta with swatches), Focus thickness (Standard, Thick), Spacing and target size (Compact, Default, Spacious), Motion (Follow system, Reduced, Off)
5. **Switches:** "Always underline links", "Show focus on click too", each with a one line hint
6. Footer: "Saved on this device" + export code + "Copy code" button (copies, then announces "Code copied")

`variant="sheet"`: same content inside a modal Dialog anchored to the bottom, drag handle (decorative), close button top right gets initial focus, sticky "Done" button at the bottom.

## Accessibility

* Presets and segmented controls are radio groups (`role="radiogroup"`, native radios visually styled) so arrows move within a group and Tab moves between groups
* Switches use `<button role="switch" aria-checked>`
* Each change announced politely through the Announcer, e.g. "Text size 22 pixels", "Preset Dyslexia friendly applied"
* The panel's own layout must not jump under the pointer when settings change. The panel uses fixed sizes from the default scale; only the rest of the app follows the preferences (the preview area excepted)
* Reset shows an Undo toast for 10 seconds

## Passport data

| Field | Value |
| --- | --- |
| Pattern | Radio groups and switches |
| WCAG 2.2 | 1.4.4, 1.4.8, 1.4.12, 2.3.3, 2.4.13 |
| Screen readers | VoiceOver, NVDA, TalkBack |
| Browsers | Safari, Chrome, Firefox |
| Keyboard tests | `[n]` passing |
| Saved in | localStorage, exportable code |

## Tests

* Picking a preset sets all its values and announces it
* Changing one value after a preset shows "Custom"
* Values persist across reload and survive blocked storage without crashing
* Export then import round trips; bad codes return an error without throwing
* System `prefers-color-scheme` change updates theme only when theme is `system`
* Playwright: full keyboard pass through every group
* axe clean in panel and sheet variants

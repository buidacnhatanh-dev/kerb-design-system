# Preferences (Kerb original)

Design: `design/09-DocsPreferences.png` (desktop panel) and `design/12-Mobile.png` (bottom sheet).

The full panel where people set how the product looks and behaves for them. Data model, presets and CSS variables are defined in `docs/03-themes-and-preferences.md`.

## API

```tsx
<Preferences
  presets={['lowVision', 'dyslexia', 'tiredEyes', 'keyboard']}  // after Standard, which is always first
  sections={['reading', 'focus', 'layout', 'motion', 'links']}
  variant="panel"        // 'panel' inline, or 'sheet' (bottom sheet dialog on mobile)
  title="Your preferences"
  headingLevel={2}       // panel only; the sheet's title is the Dialog's h2
  // sheet only: trigger, open, defaultOpen, onOpenChange, like Dialog
  onDone={() => void}    // sheet only: Done was pressed, before it closes
/>
```

What each section holds: `reading` is Text size, Line spacing, Word spacing, Font, Line length and Background. `focus` is Focus colour, Focus thickness and the "Show focus on click too" switch. `layout` is Spacing and target size. `motion` is Motion. `links` is the "Always underline links" switch. The "Focus, layout and motion" heading shows when any of the last four is there.

## Layout (panel)

1. Header: "Your preferences" + "Reset" text button
2. **Start from a preset:** radio group of cards in a 2 column grid (Standard, Low vision, Dyslexia friendly, Tired eyes, Keyboard first). Each card: bold name + one line hint. Selected: `action-primary-soft` fill, 2px `action-primary` border
3. **Reading:** Text size, Line spacing, Word spacing (ranges with values); Font (Atkinson, Lexend, System), Line length (Narrow, Medium, Wide), Background (White, Warm, Dark) as segmented radio groups. Background sets the `theme` preference: White is `light`, Warm is `comfort`, Dark is `dark`. There is no separate tint. While the theme is `system`, the option for the theme currently shown is the selected one, and Reset goes back to following the system
4. **Focus, layout and motion:** Focus colour (Yellow, Blue, Magenta with swatches), Focus thickness (Standard, Thick), Spacing and target size (Compact, Default, Spacious), Motion (Follow system, Reduced, Off)
5. **Switches:** "Always underline links", "Show focus on click too", each with a one line hint
6. Footer: "Saved on this device" + export code + "Copy code" button (copies, then announces "Code copied")

`variant="sheet"`: same content inside a modal Dialog anchored to the bottom, drag handle (decorative), close button top right gets initial focus, sticky "Done" button at the bottom.

## Decisions

* **Built on the store, not a copy of it.** Everything goes through `useKerbPreferences()`: presets, reset with its Undo toast, export and import. The components hold no preference state of their own
* **Fixed sizes.** The panel, the sheet's content and the ComfortControls controls use sizes from the default scale and reset the `--kerb-pref-*` variables in their own scope, so the Kerb components inside (buttons, the code field) keep their size too. Colours still follow the theme. People who need everything larger still have browser zoom, which scales the panel with the page
* **"Current settings" is always shown** under the preset cards ("Current settings: Dyslexia friendly", "…: Custom"). It names the preset when its card is not among `presets`, and shows "Custom" when no preset matches. It is always there rather than appearing only for Custom, so the controls below never move
* **Ranges** step by 1px, 0.05 (line spacing) and 0.01em (word and letter spacing). Text size runs 14 to 26px here (the model's range) and 16 to 24px in ComfortControls. A range's value is shown next to its label and is `aria-valuetext`; the visible copy is `aria-hidden` so it is not read twice
* **Announcements.** Every change goes through the Announcer, politely: ranges after 500ms of rest ("Text size 22 pixels"), choices at once ("Font Lexend", "Background Warm", "Motion Off"), switches ("Always underline links on"), presets ("Preset Dyslexia friendly applied"), "Code copied" (or "Could not copy. Select the code and copy it yourself"), "Preferences applied from the code". Reset is announced by its toast, Undo by the store ("Preferences restored")
* **Radio groups** are `role="radiogroup"` divs labelled by a visible text, around native radios with one `name`. The radio is invisible and covers its whole option, so a press anywhere on a card or segment chooses it; the ring is drawn on the face after it (`kerb-focus-proxy`). A preset card's name is the radio's `<label>`, its hint the description (`aria-describedby`), never inside the label
* **Switches** are `<button role="switch" aria-checked>` with a `<label for>` (buttons are labelable, so a press on the text toggles too) and the hint as the description. Off is a hollow track with the thumb at the start, on a filled track with the thumb at the end: not colour alone. The thumb slides only at the full motion level
* **Card and option borders** use `border-input` (3 : 1), not the lighter grey on the board, which would fail the control border rule
* **Focus colour swatches** use `focusColorValues` from the store module (palette values; a test checks them against `tokens.json` and `applyPreferences`), the dark variant on the dark theme. Background swatches in ComfortControls are circles with `data-kerb-theme` set to their theme, so they take that theme's `color.bg` token: no hex values in components
* **Import.** Under the code, a `<details>` "Use a code from another device" holds a TextField and "Apply code". A bad code shows the store's reason as the field's error and focus stays on the field; a good one clears the field and is announced
* **Sheet.** A Dialog with `placement="bottom"` and `initialFocus="close"`, Done as `Dialog.Confirm` (sticky at the bottom). Reset sits at the top right of the content. A modal dialog makes everything outside it inert, toasts included, so Reset in the sheet closes the sheet first (focus goes back to the trigger) and then resets: the Undo toast can then be reached with F6

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
| Keyboard tests | `[n]` passing (filled by `scripts/passport-stats.ts`, M7) |
| Saved in | localStorage, exportable code |

## Tests

* Picking a preset sets all its values and announces it
* Changing one value after a preset shows "Custom"
* Values persist across reload and survive blocked storage without crashing
* Export then import round trips; bad codes return an error without throwing
* System `prefers-color-scheme` change updates theme only when theme is `system`
* Playwright: full keyboard pass through every group (Chromium, Firefox, WebKit), the focus colour changing the ring itself, the panel not moving when the text size changes, Reset then Undo with F6, a reload, and the sheet (focus on Close, Tab wraps, Esc and Done return focus)
* axe clean in panel and sheet variants (unit, every theme; every story in `pnpm test:a11y`) The ring is checked after every arrow key in all three browsers (radios use `:focus`, see `04-accessibility-rules.md`).

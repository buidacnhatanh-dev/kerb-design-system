# DatePicker

Design: `design/07-CompOverlays.png` (Date picker, workshop date example).

The only component allowed to use React Aria and `@internationalized/date`. It uses `useCalendar`, `useCalendarGrid` and `useCalendarCell` from `react-aria`, `useCalendarState` from `react-stately`, and `@internationalized/date` for dates. Styling and markup are Kerb's.

## API

```ts
type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'size' | 'min' | 'max'> & {
  label: string;
  hint?: string;               // default shows the format, e.g. "Format DD.MM.YYYY"
  error?: string;              // wins over the picker's own checks
  optional?: boolean;
  value?: string | null;       // ISO date, controlled
  defaultValue?: string;       // ISO date, uncontrolled
  onChange?: (iso: string | null) => void;
  minValue?: string;
  maxValue?: string;
  locale?: string;             // default from <html lang>, docs example de-DE
  isDateUnavailable?: (iso: string) => boolean;
  defaultOpen?: boolean;       // calendar shown from the start, for demos and docs. Takes no focus
  messages?: Partial<DatePickerMessages>; // every string Kerb writes, for other languages
};
```

Like the other fields, `ref` and remaining props go to the `<input>`, and `className` goes to the outer wrapper. With `name`, a hidden input submits the ISO date; the visible input has no `name`, so the form never gets "18.11.2026".

`onChange` gets an ISO date when the text is a usable date (real, inside the limits, not unavailable), and `null` when it is empty or not usable.

## Anatomy

A typeable field plus a calendar button (44px, icon, `aria-label="Choose date"`, `aria-haspopup="dialog"`, `aria-expanded`) that opens a popover with a month grid: previous month button, month heading (`h2`), next month button, then the grid.

## Decisions

* **One native text input, not spinbutton segments.** React Aria's `useDateField` renders day, month and year as separate `role="spinbutton"` elements. Kerb uses one `<input type="text">` in `FieldShell` instead, matching the design board. It follows the native first rule, `getByLabelText` works, paste works, and the label, hint and error wiring is the same as every other field. The "segments" are the day, month and year in the locale's order, with the locale's separators: `DD.MM.YYYY` in de-DE, `MM/DD/YYYY` in en-US, `DD/MM/YYYY` in en-GB
* **`useDatePicker` is not used.** Its `fieldProps` are for the segmented field, and its label and description wiring would duplicate `FieldShell`. The popover, its button and focus handling are Kerb's own
* **Parsing.** Any separators are accepted (`18.11.2026`, `18/11/2026`, `18 11 2026`), plus ISO (`2026-11-18`) for paste. The year needs four digits, the day must exist (no 31.02), and month names are not parsed. On blur and on Enter a usable date is tidied into the locale's format (`1.2.2027` becomes `01.02.2027`)
* **Errors appear on blur or Enter, never while typing.** Once a date is fixed, the error clears at once. Messages: "Enter a real date in the format DD.MM.YYYY", "Enter a date on or after 02.11.2026", "Enter a date on or before 27.11.2026", "20.11.2026 is not available. Choose another date". A consumer `error` wins
* **Locale.** `locale`, else `<html lang>` (watched with a `MutationObserver`, so changing the page language updates the field), else `navigator.language`, else `en-US`. On the server it is `en-US` until hydration, so server rendered apps that know the language should pass `locale` to avoid the text changing after load. The week start comes from the locale (Monday in de-DE and en-GB, Sunday in en-US). React Aria's day names are in the locale's language, for example "Mittwoch, 18. November 2026 ausgewählt"
* **Gregorian only.** Every locale gets the Gregorian calendar with Latin digits, so the grid, the field and the ISO value always agree
* **Kerb's Announcer only.** `useCalendar` announces month and selection changes through React Aria's own live region, which the one Announcer rule forbids. The hooks get a view of the calendar state with `isFocused: true` and `value: null`, so those announcements never fire; selection is still read through `state.isSelected`, which sees the real value. The month heading is announced by Kerb through `useAnnouncer`. A unit test checks no extra `aria-live` region appears. This depends on React Aria internals, so `react-aria` and `react-stately` are pinned to exact versions
* **Home and End** go to the start and end of the week, as the spec says. React Aria's own go to the start and end of the month, so the grid handles these two keys in the capture phase first
* **Day buttons** are native `<button>`s with React Aria's props. Days outside the limits or unavailable get `aria-disabled`, a line through and `tabIndex=-1`. Blank cells before the 1st and after the last day are `gridcell`s like the rest of the row
* **Targets.** Days are at least 40px tall with 4px between them, a 44px pitch (`04-accessibility-rules.md`). Columns share the width of the calendar, which is as wide as the field, at least `min(20rem, 100vw - 1rem)`
* **Positioning.** The calendar is `popover="manual"` in the top layer, placed with `getBoundingClientRect()` below the field (above when there is no room), checked every frame while open. No anchor positioning: the calendar is as wide as the field, which measured placement does in every browser

## Behaviour

* People can always type the date; the calendar is optional
* Grid: `role="grid"` named "Workshop date, November 2026", week starts Monday in de-DE, today has a 2px `border-input` ring and bold text, selected day filled `action-primary` with Kerb focus ring
* Popover is a non modal dialog (`role="dialog"`, named by the label, no `aria-modal`)
  * Opening it with the button moves focus to the selected day, or today, or the nearest allowed day
  * Choosing a day (click, Enter or Space) sets the value, closes it and moves focus to the field, which reads the new date
  * Esc closes it and returns focus to the button. Esc is caught on `window` in the capture phase and stopped, so a Dialog around the picker stays open
  * Tab out of it, or a press outside, closes it without moving focus
* Month heading is announced (polite) when it changes, through the shared Announcer. Not when the calendar opens: focus on the day says enough
* Disabled: native `disabled` on the input, `aria-disabled` on the calendar button (it stays focusable and does nothing). `readOnly` also locks the button

## Keyboard (grid)

| Key | Action |
| --- | --- |
| Arrow left and right | Previous and next day |
| Arrow up and down | Same day previous and next week |
| Page Up and Page Down | Same day previous and next month |
| Shift + Page Up and Page Down | Same day previous and next year |
| Home and End | Start and end of the week |
| Enter or Space | Select the day, close, focus the field |
| Esc | Close, focus the calendar button |
| Tab | Previous month, next month, grid (one stop), then out (closes) |

## Tests

* Typing a valid date sets the value; invalid shows the error pattern (unit and Playwright)
* Grid keyboard navigation as above (unit and Playwright, Chromium, Firefox, WebKit)
* Esc closes the popover and returns focus (unit and Playwright), and does not close a Dialog around it (unit)
* Locale from `<html lang>`, Monday start in de-DE and Sunday in en-US
* No React Aria live region; month heading announced through the Announcer (unit and Playwright)
* axe clean with popover open (unit in every theme; `Open`, `Limits` and `UnitedStates` stories in `pnpm test:a11y`)

## Screen reader transcript (used on the docs page)

Not recorded yet: `[to be filled after the manual VoiceOver and NVDA passes]`.

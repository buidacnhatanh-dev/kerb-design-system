# DatePicker

Design: `design/07-CompOverlays.png` (Date picker, workshop date example).

The only component allowed to use React Aria (`useDatePicker`, `useCalendar`, `useCalendarGrid`, `useCalendarCell`) and `@internationalized/date`. Styling and markup are Kerb's.

## API

```ts
type DatePickerProps = {
  label: string;
  hint?: string;               // default shows the format, e.g. "Format DD.MM.YYYY"
  error?: string;
  value?: string;              // ISO date
  defaultValue?: string;
  onChange?: (iso: string | null) => void;
  minValue?: string;
  maxValue?: string;
  locale?: string;             // default from <html lang>, docs example de-DE
  isDateUnavailable?: (iso: string) => boolean;
};
```

## Anatomy

A typeable field (segments for day, month, year) plus a calendar button (44px, icon, `aria-label="Choose date"`) that opens a popover with a month grid.

## Behaviour

* People can always type the date; the calendar is optional
* Grid: `role="grid"`, week starts Monday in de-DE, today has a 2px `border-input` ring, selected day filled `action-primary` with Kerb focus ring
* Popover is a non modal dialog: Esc closes and returns focus to the button
* Month heading is announced when it changes

## Keyboard (grid)

Arrows move by day and week, Page Up and Page Down by month, Shift + Page Up and Down by year, Home and End to start and end of week, Enter selects.

## Tests

* Typing a valid date sets the value; invalid shows the error pattern
* Grid keyboard navigation as above
* Esc closes the popover and returns focus
* axe clean with popover open

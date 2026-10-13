# Select

Design: `design/06-CompInputs.png` (Select).

Native `<select>` styled to match. No custom listbox in 1.0: native selects work with every screen reader, on mobile they open the system picker, and they cost nothing.

## API

```ts
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;  // or pass <option> children
  placeholder?: string;     // rendered as a disabled first option, only when no value
};
```

## Styling

* `appearance: none`, custom chevron icon (inline SVG, `aria-hidden`) positioned right, padding right 44px
* Same states and tokens as TextField, built on the same `FieldShell`
* Hit area: 44 px tall at every density, as for TextField. `FieldShell` provides the padding at compact density; a press there must reach the select (focus it and open the picker)
* In `forced-colors` mode, restore `appearance: auto`

## Tests

* Label associated, options rendered, value changes with keyboard
* Error state matches TextField behaviour
* Playwright: at compact density, a click 1 px above and below the 40 px select still reaches it
* axe clean

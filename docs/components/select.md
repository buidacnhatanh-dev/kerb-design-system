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

`ref` and remaining props go to the `<select>`. `className` goes to the outer wrapper.

* `multiple` and `size` are not accepted: a list box needs a different design, and is out of scope for 1.0
* `options` and `<option>` children can be combined; `options` come first
* Placeholder: a disabled first option with an empty value. Because Select cannot know the value of an uncontrolled native select, the option is always rendered when `placeholder` is set, and an uncontrolled select with no `defaultValue` starts on it. Being disabled, it cannot be chosen again. The label, never the placeholder, names the field
* An empty `error` string counts as no error

## Styling

* `appearance: none`, custom chevron icon (inline SVG, `aria-hidden`) positioned right, padding right 44px. The chevron has `pointer-events: none`, so a press on it opens the select
* Same states and tokens as TextField, built on the same `FieldShell`
* Hit area: 44 px tall at every density, as for TextField. `FieldShell` provides the padding at compact density; a press there must reach the select (focus it and open the picker). The picker is opened with `showPicker()`; where the browser refuses or lacks it, the select is still focused
* In `forced-colors` mode, restore `appearance: auto` and hide the chevron

## Tests

* Label associated, options rendered, value changes with keyboard
* The keyboard test is a Playwright test (type a letter, the value changes): jsdom has no native select keyboard behaviour. It uses type ahead rather than the arrow keys because on macOS an arrow key opens the system menu
* Error state matches TextField behaviour
* Playwright: at compact density, a click 1 px above and below the 40 px select still reaches it
* axe clean

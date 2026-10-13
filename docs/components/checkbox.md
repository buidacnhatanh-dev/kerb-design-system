# Checkbox

Design: `design/06-CompInputs.png` (Checkbox).

## API

```ts
type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  hint?: string;
  indeterminate?: boolean;   // "mixed" state
};
```

## Implementation

* Native `<input type="checkbox">` visually hidden but focusable, with a styled box next to it. The whole row is the `<label>` so the hit area is at least 44px high
* `indeterminate` is set through the ref (`input.indeterminate = true`), which exposes `aria-checked="mixed"`
* Box: 22px, radius 5px, 2px `border-input`; checked and mixed fill `action-primary` with a white check or dash icon
* Focus ring goes on the box, triggered by `input:focus-visible + .box`

## States

Unchecked, checked, mixed, focused, disabled (`disabled-border`, `surface`).

## Tests

* Space toggles, label click toggles
* Mixed exposes `checked: 'mixed'` in the accessibility tree
* axe clean

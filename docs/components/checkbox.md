# Checkbox

Design: `design/06-CompInputs.png` (Checkbox).

## API

```ts
type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  hint?: string;
  error?: string;            // when set: aria-invalid, red box, icon and text
  indeterminate?: boolean;   // "mixed" state
};
```

`ref` and remaining props go to the `<input>`. `className` goes to the outer wrapper. Controlled (`checked`) and uncontrolled (`defaultChecked`) both work, as on the native input.

## Implementation

* Native `<input type="checkbox">` visually hidden but focusable, with a styled box next to it. The whole row is the `<label>` so the hit area is at least 44px high
* The input is hidden with `opacity: 0` and laid exactly over the box, not with the clip pattern, so touch exploration and screen magnifiers find it where the box is
* The hint sits under the label, outside the `<label>` element, and is linked with `aria-describedby`. It is the description, not part of the name, and a click on it does not toggle
* `indeterminate` is set through the ref (`input.indeterminate = true`), which exposes `aria-checked="mixed"`
* Box: 22px, radius 5px, 2px `border-input`; checked and mixed fill `action-primary` with a white check or dash icon
* Focus ring goes on the box, triggered by `input:focus-visible + .box`. The rule itself stays in `base.css`: the input has the `kerb-focus-proxy` class (see `04-accessibility-rules.md`)
* Mixed wins over checked visually: an indeterminate checkbox shows the dash whatever `checked` is
* Error, for a single checkbox that must be ticked (a required terms checkbox): same pattern as TextField. `aria-invalid="true"` on the input, a `danger` border on the box, and an error row with the alert icon and text under the label (after the hint), outside the `<label>`. The description lists the hint, then the error. It is not a live region: the form announces a summary on submit. An empty string counts as no error
* A group of checkboxes shows its error at group level, not on each checkbox
* Forced colours: checked and mixed use `Highlight` and `HighlightText`

## States

Unchecked, checked, mixed, focused, error, disabled (`disabled-border`, `surface`). Disabled and checked: `disabled-bg` fill with a `disabled-text` icon. Disabled uses the native `disabled` attribute, so it is skipped by Tab.

## Tests

* Space toggles, label click toggles
* Mixed exposes `checked: 'mixed'` in the accessibility tree
* `aria-invalid` only when `error` is set; hint and error are in the description in that order; the error has an icon and text and is not a live region
* axe clean

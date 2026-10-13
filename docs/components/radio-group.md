# RadioGroup

Design: `design/06-CompInputs.png` (Radio group, delivery example).

## API

```ts
type RadioGroupProps = {
  legend: string;
  name: string;
  options: Array<{ value: string; label: string; hint?: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
};
```

The type also accepts the other `<fieldset>` attributes. `ref`, `className` and remaining props go to the `<fieldset>`. `disabled` on the group disables every option.

`name` must be unique on the page: native radios with the same name are one group, whichever fieldset they are in.

## Implementation

* `<fieldset>` with `<legend>`, native `<input type="radio">` per option sharing `name`. Native radios already give the correct arrow key and Tab behaviour
* Each option: circle 22px, 2px border, selected border and dot `action-primary`; label bold, hint muted below
* Error: shown under the legend, linked to the fieldset with `aria-describedby`, with the alert icon. It is not a live region. The fieldset gets no `aria-invalid`: the attribute is not allowed on a group
* The role stays the fieldset's native `group`. `role="radiogroup"` is not added
* Each option's hint sits under its label, outside the `<label>` element, and is linked to that radio with `aria-describedby`
* Radios are hidden and focus is drawn as for Checkbox (`opacity: 0` over the circle, `kerb-focus-proxy`). Each option row is a `<label>` at least 44px high
* The fieldset has no border or padding of its own. The bordered card with the legend on its edge on the design board is the board's card, not part of the component
* Controlled (`value`) and uncontrolled (`defaultValue`) both work; `onChange` fires in both

## Keyboard (native)

* Tab enters the group on the selected option (or first if none)
* Arrow keys move and select
* Tab leaves the group
* A disabled option is skipped. What happens at a disabled last option is the browser's own: Chromium and Firefox wrap to the first option, WebKit stays where it is

## Tests

* Arrow keys change selection, Tab leaves the group in one step
* Legend is the group name
* axe clean

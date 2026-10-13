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

## Implementation

* `<fieldset>` with `<legend>`, native `<input type="radio">` per option sharing `name`. Native radios already give the correct arrow key and Tab behaviour
* Each option: circle 22px, 2px border, selected border and dot `action-primary`; label bold, hint muted below
* Error: shown under the legend, linked to the fieldset with `aria-describedby`

## Keyboard (native)

* Tab enters the group on the selected option (or first if none)
* Arrow keys move and select
* Tab leaves the group

## Tests

* Arrow keys change selection, Tab leaves the group in one step
* Legend is the group name
* axe clean

# TextField

Design: `design/06-CompInputs.png` (Text field row) and the case study before and after section.

## API

```ts
type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;              // required, always visible
  hint?: string;
  error?: string;             // when set: aria-invalid, red border, icon, text
  optional?: boolean;         // shows "(optional)" after the label; required is the default assumption
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  showPasswordLabel?: string; // name of the toggle in a password field, default "Show password"
};
```

`ref` and remaining props go to the `<input>`. `className` goes to the outer wrapper, where layout classes belong.

## Anatomy

Label (bold) → hint (muted, small) → input → error row (icon + text, danger colour).

## States

| State | Border | Notes |
| --- | --- | --- |
| Empty | 2px `border-input` | |
| Focus | 2px `text` + Kerb ring | |
| Filled | 2px `border-input` | |
| Error | 2px `danger` | Icon + message, `aria-invalid="true"` |
| Disabled | 2px `disabled-border`, bg `surface`, text `disabled-text` | |

## Behaviour

* `id` generated with `useId` unless passed
* `aria-describedby` lists hint id then error id (only those that exist)
* Error message is NOT a live region. The form announces a summary on submit via Announcer, and screen readers read the error when the field is focused
* Password type gets a "Show password" toggle button (`aria-pressed`) inside the field. Its name stays the same in both states (the pressed state says the rest), it is the next Tab stop after the input, and it has `aria-controls` pointing at the input
* Height follows density preference, as a minimum height
* Hit area: 44 px tall at every density. At compact density the input is 40 px, so `FieldShell` pads its wrapper by 2 px above and below and a press there focuses the input. The password toggle has its own 44 px `::before` hit area
* Placeholder text uses `text-muted`, not a lighter grey, so it meets 4.5 : 1
* An empty `error` string counts as no error
* `required` is passed through to the input. Nothing is added for it automatically

## Tests

* Label is associated (getByLabelText works)
* Hint and error are in the accessible description in the right order
* `aria-invalid` only when `error` is set
* Placeholder is never used as the label (lint rule in stories)
* A press on the hit area padding focuses the input
* Playwright: at compact density, a click 1 px above and below the 40 px input still focuses it
* axe clean in every state and theme

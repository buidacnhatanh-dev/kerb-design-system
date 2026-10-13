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
};
```

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
* Password type gets a "Show password" toggle button (`aria-pressed`) inside the field
* Height follows density preference

## Tests

* Label is associated (getByLabelText works)
* Hint and error are in the accessible description in the right order
* `aria-invalid` only when `error` is set
* Placeholder is never used as the label (lint rule in stories)
* axe clean in every state and theme

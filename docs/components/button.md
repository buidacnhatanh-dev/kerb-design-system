# Button

Design: `design/06-CompInputs.png` (Button row).

## API

```ts
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';  // default 'primary'
  size?: 'default' | 'small';                                // small = 40px, still 44px hit area
  loading?: boolean;          // sets aria-busy, keeps label, shows spinner
  loadingLabel?: string;      // announced when loading starts, default "Loading"
  disabledReason?: string;    // shown in a tooltip and linked with aria-describedby
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
};
```

Renders a native `<button type="button">` by default (consumers pass `type="submit"` for forms).

## Variants (light values, all from tokens)

| Variant | Background | Hover | Text | Border |
| --- | --- | --- | --- | --- |
| primary | `action-primary` | `action-primary-hover` | `on-primary` | none |
| secondary | `bg` | `action-secondary-hover` | `text` | 2px `border-input` |
| ghost | transparent | `action-ghost-hover` | `action-primary` | none |
| danger | `danger` | `danger-hover` | `on-danger` | none |

## States

Default, hover, focus (Kerb ring), active (translateY 1px, only when motion is full), loading, disabled.

* **Loading:** spinner before the label, label stays visible and in the accessible name, `aria-busy="true"`, clicks ignored, `announce(loadingLabel)` politely
* **Disabled:** `aria-disabled="true"` (not native `disabled`), colours `disabled-bg` and `disabled-text`, stays in the Tab order, `onClick` is not called. If `disabledReason` is set, it is shown on hover and focus and linked with `aria-describedby`

## Layout

* Height `var(--kerb-pref-control-height, 3rem)`, padding inline `space.5`, radius `md`, weight 700
* Icon only buttons must have `aria-label`; TypeScript overload enforces it when `children` is absent

## Keyboard

Enter and Space activate (native).

## Tests

* Renders as `button` with the label as accessible name
* `aria-disabled` button is focusable and does not fire `onClick`
* Loading keeps the name, sets `aria-busy`, ignores clicks
* Icon only without `aria-label` is a type error (tsd or `// @ts-expect-error` test)
* axe clean in all variants and themes

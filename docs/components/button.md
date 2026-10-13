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

Passing `disabled` (or `aria-disabled="true"`) sets `aria-disabled="true"`. The native `disabled` attribute is never written.

## Variants (light values, all from tokens)

| Variant | Background | Hover | Text | Border |
| --- | --- | --- | --- | --- |
| primary | `action-primary` | `action-primary-hover` | `on-primary` | none |
| secondary | `bg` | `action-secondary-hover` | `text` | 2px `border-input` |
| ghost | transparent | `action-ghost-hover` | `action-primary` | none |
| danger | `danger` | `danger-hover` | `on-danger` | none |

## States

Default, hover, focus (Kerb ring), active (translateY 1px, only when motion is full), loading, disabled.

* **Loading:** spinner before the label (in place of `iconStart`), label stays visible and in the accessible name, `aria-busy="true"`, clicks ignored, `announce(loadingLabel)` politely. The spinner turns only at the full motion level: at reduced and off it is a still arc, and `aria-busy` and the announcement carry the state
* **Disabled:** `aria-disabled="true"` (not native `disabled`), colours `disabled-bg` and `disabled-text`, stays in the Tab order, `onClick` is not called. If `disabledReason` is set, it is shown on hover and focus and linked with `aria-describedby`
* A disabled or loading button calls `preventDefault()` and `stopPropagation()` on the click, so a submit button does not submit its form and handlers on ancestors do not fire, as with a native disabled button
* **Disabled reason:** until Tooltip exists (M4) Button renders its own small `role="tooltip"`. It is only rendered while the button is disabled. It shows on hover (of the button or the reason itself) and on focus, Esc hides it without moving focus, and it is lined up with the button's start edge. With a reason, the button is wrapped in a `span`; `ref`, `className` and other props still go to the `<button>`. Swap it for Tooltip in M4
* Hover and active styles apply only while the button can be used (not disabled, not loading)
* `prefers-contrast: more` gives every variant a solid `text` colour border

## Layout

* Height `var(--kerb-pref-control-height, 3rem)` as a minimum height, so larger text and wrapped labels are never clipped. Padding inline `space.5`, radius `md`, weight 700
* Hit area: a `::before` on the button is at least 44 px tall, so the small size and compact density (40 px visible) keep a 44 px target. Minimum width 44 px
* Icon only buttons must have `aria-label`; TypeScript overload enforces it when `children` is absent

## Keyboard

Enter and Space activate (native).

## Tests

* Renders as `button` with the label as accessible name
* `aria-disabled` button is focusable and does not fire `onClick`
* Loading keeps the name, sets `aria-busy`, ignores clicks
* Icon only without `aria-label` is a type error (tsd or `// @ts-expect-error` test)
* axe clean in all variants and themes

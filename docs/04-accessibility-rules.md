# 04 · Accessibility rules

These apply to every component. Target: WCAG 2.2 AA, plus the AAA items noted.

## Focus ring (GOV.UK style)

A dark ink ring inside a thick yellow ring. Ink carries the contrast on light backgrounds, yellow on dark ones, so focus is clear in every theme.

```css
/* packages/react/src/styles/base.css */
:where(.kerb-focusable):focus-visible,
[data-kerb-focus-on-click] :where(.kerb-focusable):focus {
  outline: 2px solid transparent;          /* becomes visible in forced colours */
  outline-offset: 2px;
  box-shadow:
    0 0 0 2px var(--kerb-color-focus-ink),
    0 0 0 var(--kerb-focus-width, 6px) var(--kerb-focus-color, var(--kerb-color-focus));
}
@media (forced-colors: active) {
  :where(.kerb-focusable):focus-visible { outline: 3px solid Highlight; box-shadow: none; }
}
```

* Never hide the ring. Never animate it
* Meets WCAG 2.4.7 Focus visible, 2.4.11 Focus not obscured, 2.4.13 Focus appearance (AAA)
* Sticky headers must use `scroll-padding-top` so focused elements are never covered

## Contrast

* Text 4.5 : 1 (large text 3 : 1). Controls, borders and icons that carry meaning 3 : 1
* Enforced by the token contrast test and axe

## Targets

* 44 by 44 px minimum for buttons, inputs, switches, tabs, links in navigation
* Calendar day cells may be 40 px if spaced so the 44 px hit areas do not overlap

## Colour is never alone

* Errors: red border AND icon AND text, linked with `aria-describedby`
* Statuses (toast, badges): icon plus text
* Links: underlined by default inside body text. The `underlineLinks` preference extends this everywhere

## Motion

* `data-kerb-motion="full"`: transitions up to `motion.duration.slow`
* `reduced`: fades only, max 120 ms, no movement or scale
* `off`: no transitions or animations at all
* Default follows `prefers-reduced-motion`

## Announcements

* One `Announcer` with two hidden live regions: `aria-live="polite"` and `aria-live="assertive"`
* Components call `announce(message, { urgency })` instead of creating their own regions
* Duplicate messages within 1 second are dropped. Same message later is re-announced by clearing and re-setting the region

## Forms

* Every input has a visible `<label>`. Placeholder is never the label
* Hint and error text linked with `aria-describedby`. `aria-invalid="true"` on error
* Errors appear on blur or submit, never on every keystroke
* On submit with errors, focus moves to the first invalid field

## Disabled

* Buttons: `aria-disabled="true"`, stay focusable, click handler is blocked, tooltip or hint explains why when possible
* Inputs: native `disabled` is acceptable, but prefer `readOnly` when the value must stay readable

## Zoom and reflow

* Works at 400% zoom at 1280 px wide (WCAG 1.4.10): no sideways scrolling except code blocks and tables
* Text spacing overrides (WCAG 1.4.12) must not clip text: no fixed heights on text containers

## Testing tools to run

* axe in unit tests and every story (see `07-testing-and-ci.md`)
* Keyboard only pass for every component
* VoiceOver on macOS and iOS, NVDA on Windows, TalkBack on Android (manual, recorded in the passport)

# Tooltip

Design: `design/07-CompOverlays.png` (Tooltip on the "Copy link" icon button).

## API

```tsx
<Tooltip content="Copy link to clipboard">
  <Button aria-label="Copy link" iconStart={<LinkIcon />} variant="secondary" />
</Tooltip>
```

`content` is a string, so nothing interactive can go in. `defaultOpen` shows it from the start (until the pointer leaves, focus leaves or Esc), for demos and docs. The child must take a ref and focus, such as a Button; its own ref, `aria-describedby` and handlers are kept.

## Behaviour (WCAG 1.4.13 content on hover or focus)

* Shows on hover (after 300ms) and immediately on keyboard focus
  * Hover means a mouse pointer (`pointerType: "mouse"`). Touch does not open it
  * Focus means `:focus-visible`: a mouse click already showed it through hover
* Dismissable: Esc hides it without moving focus. The Esc listener is on `window` in the capture phase and stops the event, so a dialog around the trigger does not close as well
* Hoverable: pointer can move onto the tooltip without it closing. Leaving starts a 150ms grace period, long enough to cross the 8px gap
* Persistent: stays until pointer leaves both, focus leaves, or Esc
* `role="tooltip"`, linked to the trigger with `aria-describedby`. Never put interactive content inside. The tooltip element is always rendered (hidden), so the description is there before it shows
* Rendered right after the trigger in the DOM and shown in the top layer with `popover="manual"`, so no ancestor's `overflow` can clip it
* Positioned with CSS anchor positioning when supported, fallback to a small measured placement (top, flip to bottom). No positioning library
  * Anchor positioning: `position-area: block-start span-all` with `justify-self: anchor-center`, so near the edge of the page it shifts inside instead of being cut off, and `position-try-fallbacks: flip-block`
  * Measured fallback: placed with `getBoundingClientRect()`, kept 8px from the viewport edges, and checked every frame while open so it follows the trigger when the page scrolls or the layout shifts
  * The small pointer is placed on each frame so it aims at the trigger even when the tooltip has been shifted, and faces the right way after a flip
* Dark surface `text` colour background with `bg` text, radius `sm`, max width 240px. The surface inverts with the theme: light on the dark theme
* Button's `disabledReason` is shown through this Tooltip

## Tests

* Appears on focus, Esc hides, trigger keeps focus
* Esc does not reach anything else while it is open
* Hover shows it after 300ms, a quick pass does not; moving onto it keeps it open, leaving both hides it
* Playwright: it ends up above the trigger and inside the page
* Description is exposed on the trigger
* axe clean

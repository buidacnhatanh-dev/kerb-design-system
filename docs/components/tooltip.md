# Tooltip

Design: `design/07-CompOverlays.png` (Tooltip on the "Copy link" icon button).

## API

```tsx
<Tooltip content="Copy link to clipboard">
  <Button aria-label="Copy link" iconStart={<LinkIcon />} variant="secondary" />
</Tooltip>
```

## Behaviour (WCAG 1.4.13 content on hover or focus)

* Shows on hover (after 300ms) and immediately on keyboard focus
* Dismissable: Esc hides it without moving focus
* Hoverable: pointer can move onto the tooltip without it closing
* Persistent: stays until pointer leaves both, focus leaves, or Esc
* `role="tooltip"`, linked to the trigger with `aria-describedby`. Never put interactive content inside
* Positioned with CSS anchor positioning when supported, fallback to a small measured placement (top, flip to bottom). No positioning library
* Dark surface `text` colour background with `bg` text, radius `sm`, max width 240px

## Tests

* Appears on focus, Esc hides, trigger keeps focus
* Description is exposed on the trigger
* axe clean

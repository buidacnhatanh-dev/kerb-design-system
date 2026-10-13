# Dialog

Design: `design/07-CompOverlays.png` (Dialog) and `design/08-DocsDialog.png` (full docs page).

## API

```tsx
<Dialog
  title="Delete “Portfolio 2026”?"
  description="This removes the project and its 12 pages."
  trigger={<Button variant="danger">Delete project</Button>}
  initialFocus="cancel"          // 'first' | 'cancel' | React.RefObject
  open={open} onOpenChange={setOpen}
  tone="default"                 // 'default' | 'danger'
>
  <Dialog.Body>…</Dialog.Body>    {/* optional extra content */}
  <Dialog.Cancel>Keep project</Dialog.Cancel>
  <Dialog.Confirm variant="danger" onClick={remove}>Delete</Dialog.Confirm>
</Dialog>
```

Props table for the docs page:

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Required. Becomes the accessible name |
| `description` | `string` | Read after the title by screen readers |
| `trigger` | `ReactElement` | Element that opens the dialog. Focus returns here |
| `initialFocus` | `"first" \| "cancel" \| ref` | Where focus goes on open. Defaults to "cancel" for danger dialogs |
| `open` | `boolean` | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | Called on open, close and Escape |

## Implementation

* Native `<dialog>` opened with `showModal()`. This gives top layer, `::backdrop` and makes the rest of the page inert in modern browsers
* Additionally set `inert` on the app root sibling (`document.querySelector('[data-kerb-app-root]')`) for older browsers and to stop virtual cursor escape in VoiceOver
* `aria-labelledby` → title, `aria-describedby` → description
* Remember `document.activeElement` on open. On close, focus it again if still connected, otherwise focus a fallback (`trigger` ref or `document.body` with a polite announcement)
* `tone="danger"` never focuses the destructive button first
* Escape closes (native `cancel` event, call `onOpenChange(false)`)
* Click on backdrop closes only when `dismissable` is true (default false for danger)
* Body scroll locked while open (`overflow: hidden` on `<html>` with scrollbar gutter kept)
* Layout: max width 480px, padding `space.5`, radius `lg`, actions right aligned, wrap on narrow screens with primary action last in DOM order
* Motion: full = fade + 8px rise 200ms, reduced = fade 120ms, off = none

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Next focusable element inside the dialog, wraps from last to first |
| Shift + Tab | Previous element, wraps from first to last |
| Esc | Closes and returns focus to the trigger |
| Enter | Activates the focused button |

## Screen reader transcript (used on the docs page)

Expected VoiceOver output when opening with the keyboard:

1. "Delete project, button, has popup dialog"
2. "Delete “Portfolio 2026”?, dialog"
3. "This removes the project and its 12 pages. You can’t undo this."
4. "Keep project, button"

After closing: "Delete project, button, has popup dialog"

## Tests

* Opens on trigger, focus lands on Cancel for danger tone
* Tab and Shift Tab wrap inside
* Esc closes and focus returns to trigger
* If the trigger was removed while open, focus goes to the fallback
* Content outside is inert while open
* Playwright: full keyboard flow in all three themes
* axe clean while open

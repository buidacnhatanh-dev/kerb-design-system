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

The dialog also has a close button in its top corner (as on the design board), named "Close" (`closeLabel`). `defaultOpen` opens it on mount. `Dialog.Cancel` and `Dialog.Confirm` are Buttons that forward refs; Cancel is `secondary` by default.

Props table for the docs page:

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Required. Becomes the accessible name |
| `description` | `string` | Read after the title by screen readers |
| `trigger` | `ReactElement` | Element that opens the dialog. Focus returns here |
| `initialFocus` | `"first" \| "cancel" \| ref` | Where focus goes on open. Defaults to "cancel" for danger dialogs |
| `open` | `boolean` | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | Called on open, close and Escape |
| `defaultOpen` | `boolean` | Open on mount, uncontrolled |
| `tone` | `"default" \| "danger"` | Danger dialogs start on Cancel and ignore backdrop clicks |
| `dismissable` | `boolean` | Close on a backdrop click. Default true, false for danger |
| `closeLabel` | `string` | Name of the close button. Default "Close" |
| `closedMessage` | `string` | Announced when focus cannot go back. Default "Dialog closed" |
| `placement` | `"center" \| "bottom"` | `bottom` is a sheet along the bottom edge for small screens. Default `center` |

`initialFocus` also takes `"close"`: the close button in the corner, as the Preferences sheet does.

### Sheet (`placement="bottom"`)

* Full width up to 40rem, at the bottom edge, top corners rounded, at most the viewport height minus `space.6`, rising in by `2rem × --kerb-motion-move`
* A decorative drag handle on top (`aria-hidden`, it does not drag: Close, Esc, a backdrop click and the actions close it)
* The actions row is sticky at the bottom with a line above it, and its buttons share the width, so the main action stays in view while the content scrolls. Padding respects `env(safe-area-inset-bottom)`
* Everything else (focus, inert page, Esc, focus return) is the same as the centred dialog

## Implementation

* Native `<dialog>` opened with `showModal()`. This gives top layer, `::backdrop` and makes the rest of the page inert in modern browsers
  * The `<dialog>` is rendered through a portal into `document.body`, outside the app root, and only while open. Where `showModal` is missing it gets the `open` attribute instead
* Additionally set `inert` on the app root sibling (`document.querySelector('[data-kerb-app-root]')`) for older browsers and to stop virtual cursor escape in VoiceOver
  * `KerbProvider` renders that app root: a `display: contents` wrapper around the app. A count of open dialogs makes sure it is set once and removed once
* The trigger gets `aria-haspopup="dialog"` (read as "has popup dialog") and its own `onClick` runs first; `preventDefault()` there keeps the dialog shut
* Tab and Shift+Tab wrap in script: native modal dialogs let Tab move on to the browser's own controls
* `aria-labelledby` → title, `aria-describedby` → description
* Remember `document.activeElement` on open. On close, focus it again if still connected, otherwise focus a fallback (`trigger` ref or `document.body` with a polite announcement)
  * The element is read while rendering the opening, before anything inside can take focus with `autoFocus` or a ref
  * Focus goes back in an effect body, not a cleanup: React puts focus back after a commit and would undo a cleanup's `focus()`
  * The same fallback runs when the dialog unmounts while open, which is common when the trigger goes with it (deleting the row that holds both). That runs in a microtask after the commit, once it is clear what is still in the document
  * "Focus `document.body`" is done by blurring the active element; the announcement is `closedMessage`
* Initial focus: `"first"` is the first focusable element after the close button (so a form starts on its first field); `"cancel"` is `Dialog.Cancel`; a ref is that element. With no match it falls back to Cancel, then the close button
* `tone="danger"` never focuses the destructive button first, even when `initialFocus` points at it
* Escape closes (native `cancel` event, call `onOpenChange(false)`)
  * The `cancel` event is prevented and the close goes through `onOpenChange`, so React's open state and the element never disagree. If the browser closes it anyway (a second Esc), the `close` event is followed
* Click on backdrop closes only when `dismissable` is true (default false for danger). The padding is on an inner panel, so a click whose target is the `<dialog>` element itself is a click on the backdrop
* `Dialog.Cancel` and `Dialog.Confirm` run their own `onClick`, then close, unless `onClick` called `preventDefault()` (to keep the dialog open, for example to show an error). Actions are collected into the footer with Cancel before Confirm, whatever their order in the JSX; everything else goes into the body
* Body scroll locked while open (`overflow: hidden` on `<html>` with scrollbar gutter kept)
* Layout: max width 480px, padding `space.5`, radius `lg`, actions right aligned, wrap on narrow screens with primary action last in DOM order
* Motion: full = fade + 8px rise 200ms, reduced = fade 120ms, off = none. The backdrop fades with it. There is no exit animation
* Surface: `surface-raised`, title in the heading font at `heading-3`, description in `text-muted`

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
* Backdrop click closes a default dialog, not a danger dialog
* The page scroll is locked while open and unlocked on close or unmount
* Playwright: full keyboard flow in all three themes
* axe clean while open

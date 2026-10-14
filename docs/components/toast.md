# Toast

Design: `design/07-CompOverlays.png` (Toast message).

## API

```ts
const toast = useToast();
toast.show({
  tone: 'success' | 'info' | 'error',
  title: 'Project saved',
  body?: 'Your changes are live.',
  action?: { label: 'Undo', onAction: () => void },
  duration?: number,   // ms, default 6000; error toasts and toasts with actions never auto dismiss
});
```

`useToast()` returns `{ show, dismiss }`. `show()` returns the toast's id. Outside `KerbProvider` it does nothing and warns once in development.

## Behaviour

* Rendered in one region owned by `KerbProvider`, bottom left, stacked, max 3 visible
  * The region is a `<section aria-label="Notifications">` with a list of toasts, and is only in the DOM while there are toasts
  * The three newest are shown, newest last. Older ones wait and come back when one of the visible ones goes
* Announced through the Announcer: success and info polite, error assertive. The toast element itself is not a live region (avoids double announcements)
  * The announcement is the title and body as sentences. With an action it adds "Press F6 to reach Undo." (with the action's label), so the shortcut is discoverable without sight
  * The design board's note "Errors use role=alert" is not followed: an alert role would be a second live region and read the error twice
* Never steals focus. If it has an action, the action is also reachable with a documented shortcut: F6 moves focus to the toast region and back
  * F6 is only taken while there are toasts; otherwise browsers keep it (it moves focus to the address bar). It goes to the newest toast's first button (its action, or Dismiss), and F6 again goes back to where focus was
  * When the toast holding focus is dismissed, focus moves to the next toast; when the last one goes, focus goes back to where it was before F6
* Timer pauses on hover and focus, and is disabled entirely when motion is off or `prefers-reduced-motion` is set, because people need time to read
  * Also disabled when the person chose the reduced motion level. The system setting counts even when the person chose full motion
  * After a pause the timer resumes with the time that was left
  * A toast with an action stays until dismissed by default, but an explicit `duration` makes it close on its own (Preferences reset uses 10 seconds). Error toasts always stay
* Each toast has a close button ("Dismiss notification")
* Icon plus text per tone: success check, info "i", error cross. Dark surface (`#15181D`) in light and comfort themes, raised surface in dark
  * Built as a dark island: the list has `data-kerb-theme="dark"`, so text, icons, buttons and the focus ring inside use the dark tokens and keep their contrast in every theme. The surface is the dark theme's `surface-raised` (`#1A1E25`) in all themes, a close match for `#15181D` that also stands apart from the dark page (`#101318`). A 1px `line` border and a shadow separate it from the page
  * The text size and line height are read on the region, outside the island, so comfort's larger type still reaches the toasts
  * The action is a small secondary Button, Dismiss a small ghost icon Button
* Motion: fade in with a rise of `0.5rem × --kerb-motion-move`, at `motion.duration.base`. No exit animation
* While a modal dialog is open the toasts are under its backdrop and inert (`showModal()` makes everything outside the dialog inert). They are still announced

## Tests

* Success announces politely, error assertively, exactly once
* Focus does not move on show
* Auto dismiss pauses on hover and focus; errors persist
* No auto dismiss when motion is off or reduced
* F6 goes to the toast and back; F6 is left alone when there are no toasts
* Playwright: showing a toast leaves focus where it was; F6 there and back; Dismiss from the keyboard
* axe clean

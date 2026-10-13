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

## Behaviour

* Rendered in one region owned by `KerbProvider`, bottom left, stacked, max 3 visible
* Announced through the Announcer: success and info polite, error assertive. The toast element itself is not a live region (avoids double announcements)
* Never steals focus. If it has an action, the action is also reachable with a documented shortcut: F6 moves focus to the toast region and back
* Timer pauses on hover and focus, and is disabled entirely when motion is off or `prefers-reduced-motion` is set, because people need time to read
* Each toast has a close button ("Dismiss notification")
* Icon plus text per tone: success check, info "i", error cross. Dark surface (`#15181D`) in light and comfort themes, raised surface in dark

## Tests

* Success announces politely, error assertively, exactly once
* Focus does not move on show
* Auto dismiss pauses on hover and focus; errors persist
* axe clean

# Announcer (Kerb original)

Design: `design/07-CompOverlays.png` (Announcer demo).

One shared place for screen reader announcements, so the app never has competing live regions.

## API

```ts
const { announce } = useAnnouncer();
announce('12 results for “dialog”');                       // polite
announce('Upload failed. The file is over 5 MB.', { urgency: 'assertive' });
```

## Implementation

* `KerbProvider` renders two visually hidden regions once: `<div aria-live="polite" aria-atomic="true">` and `<div aria-live="assertive" aria-atomic="true">`
* Regions exist in the DOM from first render (empty) so screen readers register them
* To announce: clear the region, then set text on the next animation frame. This makes repeated identical messages announce again
* Drop an identical message if the same text was announced less than 1000ms ago
* Clear regions after 7 seconds so stale text is not read by virtual cursor users
* Dev mode: if a component outside Kerb sets `aria-live`, log a one time console warning suggesting `useAnnouncer`. Kerb's own regions carry `data-kerb-announcer`, and `aria-live="off"` is ignored
* The duplicate check compares the text only, whatever the urgency
* Two different messages to the same region in one frame: the later one wins
* The regions are written through refs, not React state, so an announcement never re-renders the app
* `useAnnouncer()` outside `KerbProvider` returns an `announce` that does nothing and warns once in dev mode. Components such as Button therefore still work without the provider, only silently

## Docs demo

Three buttons ("Run a search", "Save a draft", "Fail an upload") and a dark panel listing what was announced with its urgency.

## Tests

* Polite and assertive go to the right region
* Duplicate within 1s is dropped, same text after 1s is re announced
* Regions are present before the first announce
* Regions are cleared after 7 seconds

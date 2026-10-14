# Tabs

Design: `design/07-CompOverlays.png` (Tabs) and `design/11-PortfolioModal.png` (Overview, Process, Outcome tabs).

## API

```tsx
<Tabs defaultValue="overview" activation="manual" label="Project details">
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="process">Process</Tabs.Tab>
    <Tabs.Tab value="outcome">Outcome</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">…</Tabs.Panel>
</Tabs>
```

* Root props: `value` / `defaultValue` / `onValueChange` (controlled or not), `activation`, `label` (required, names the tab list). The root's `ref` and remaining props go to its `<div>`
* `Tabs.Tab` is a native `<button>`; a `disabled` tab is skipped by the arrow keys. Ids are built from `value` (spaces become dashes)
* `activation`: `'manual'` (arrow keys move focus, Enter or Space selects) or `'automatic'` (arrow keys select). Default `'automatic'`, docs explain when to use manual (panels that load data)

## ARIA

* `role="tablist"` with `aria-label`, `role="tab"` with `aria-selected`, `aria-controls`, roving `tabindex` (selected 0, others -1)
* `role="tabpanel"` with `aria-labelledby` and `tabindex="0"` when the panel has no focusable content

## Keyboard

| Keys | Action |
| --- | --- |
| Left / Right | Previous / next tab, wrapping |
| Home / End | First / last tab |
| Enter / Space | Select (manual mode) |
| Tab | Moves from the tab list into the panel |

## Styling

Selected tab: text colour `text`, weight 700, 3px underline `action-primary`. Others `text-muted`. Min height 44px.

* The underline is a pseudo element, not a box shadow, so it never collides with the focus ring
* Each tab reserves the width of its bold label, so selecting a tab does not shift its neighbours (string labels only)
* The tab list wraps on narrow screens. It is deliberately not a scroll box: Firefox makes a scrollable element a Tab stop of its own
* Enter and Space select through the button's native click, in both activation modes
* A panel gets `tabindex="0"` only while it has nothing focusable inside; this is checked after every render. Hidden panels stay in the DOM with `hidden`

## Tests

* Roving tabindex correct, arrows wrap, Home and End work
* Manual mode does not change panel on arrow alone
* Tab moves from the tab list into the panel, or into its first control
* Playwright: every keyboard row
* axe clean

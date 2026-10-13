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

## Tests

* Roving tabindex correct, arrows wrap, Home and End work
* Manual mode does not change panel on arrow alone
* axe clean

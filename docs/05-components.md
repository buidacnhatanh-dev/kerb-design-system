# 05 · Components index

Every component has its own spec in `docs/components/`. Build them in this order (later ones depend on earlier ones):

| Order | Component | Spec | Depends on |
| --- | --- | --- | --- |
| 1 | KerbProvider + Announcer | `components/announcer.md`, `03-themes-and-preferences.md` | tokens |
| 2 | Button | `components/button.md` | provider |
| 3 | TextField | `components/text-field.md` | |
| 4 | Select | `components/select.md` | TextField styles |
| 5 | Checkbox | `components/checkbox.md` | |
| 6 | RadioGroup | `components/radio-group.md` | |
| 7 | Tooltip | `components/tooltip.md` | Button |
| 8 | Toast | `components/toast.md` | Announcer, Button |
| 9 | Dialog | `components/dialog.md` | Button |
| 10 | Tabs | `components/tabs.md` | |
| 11 | DatePicker | `components/date-picker.md` | TextField, Button, React Aria |
| 12 | ComfortControls | `components/comfort-controls.md` | preferences store, RadioGroup |
| 13 | Preferences | `components/preferences.md` | everything above |

## Shared internals (`packages/react/src/internal/`)

* `VisuallyHidden`: the standard clip pattern, used for live regions and hidden native inputs
* `useFocusReturn(open)`: remembers and restores focus
* `mergeRefs`, `composeEventHandlers`
* `Icon`: inline SVG set (check, info, cross, alert, chevron, calendar, link, eye, eye off, sliders, menu), always `aria-hidden` and `focusable="false"`
* `FieldShell`: label, hint, error and description id wiring shared by TextField, Select, DatePicker

## Story requirements

For every component: one story per state in its spec, plus a "Themes" story that renders the default state in light, dark and comfort side by side (as on `design/05-Themes.png`).

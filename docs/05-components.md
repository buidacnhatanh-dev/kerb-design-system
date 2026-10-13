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
* `useFocusReturn(open)`: remembers and restores focus. It reads the focused element while rendering, before opened content can take focus through `autoFocus` or a ref, and gives focus back in an effect body, not a cleanup (React restores the previously focused element after a commit, which undoes a cleanup's `focus()`)
* `mergeRefs`, `composeEventHandlers` (the consumer's handler runs first, Kerb's is skipped if it called `preventDefault()`)
* `cx` (joins class names), `isDev` (dev only warnings), `useIsomorphicLayoutEffect`
* `Icon`: inline SVG set (check, info, cross, alert, chevron, calendar, link, eye, eye off, sliders, menu), always `aria-hidden` and `focusable="false"`
* `FieldShell`: label, hint, error and description id wiring shared by TextField, Select, DatePicker. Takes a render function and passes it `id`, `aria-describedby` and `aria-invalid` for the native control. It also owns the 44 px hit area: when the control is shorter than 44 px (compact density) it pads the control's wrapper to 44 px and passes a press on that padding through to the control
* `stories/helpers`: `ThemeColumns` (the Themes story layout), `forced()` and shared story layout styles. Not part of the published package

## Story requirements

For every component: one story per state in its spec, plus a "Themes" story that renders the default state in light, dark and comfort side by side (as on `design/05-Themes.png`).

* Hover, focus and active stories spread `forced("hover")`, `forced("focus-visible")` and so on onto the element. `apps/storybook/.storybook/pseudo-states.ts` copies every `:hover`, `:focus`, `:focus-visible` and `:active` rule to match that attribute, so the states render without interaction, sit side by side and are checked by axe. Component CSS gets no test only selectors
* An "AllStates" story lays the states out like the design board, for visual comparison
* Themes stories use `ThemeColumns`
* Every story runs inside `KerbProvider` (a decorator in `preview.ts`). The toolbar theme is passed as the provider's `theme` prop
* Stories are typed `const meta: Meta<typeof X>` and `StoryObj<typeof X>` (an annotation, not `satisfies`, because the project emits declarations)

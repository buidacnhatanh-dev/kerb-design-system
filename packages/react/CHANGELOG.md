# @kerb/react

## 1.0.0

### Major Changes

- Kerb 1.0: thirteen components, three themes and the Preferences panel, stable API. `Dialog` gets `eyebrow` (a line above the title) and `headerTheme` (the header as a band in a theme of its own).

### Minor Changes

- 3e502f6: Add an `error` prop to `Checkbox`, for a single checkbox that must be ticked.
- 39f3d83: Add `Preferences` (panel and bottom sheet) and `ComfortControls`, both on the `KerbProvider` store: five presets, reading, focus, layout and motion settings, export and import codes, reset with Undo, and every change announced. `Dialog` gets `placement="bottom"` for sheets and `initialFocus="close"`.
- 6890cf4: Add `DatePicker`: a typeable date field in the locale's format with a calendar button. The calendar grid is built on React Aria's hooks, the week start and month names follow the locale (from `<html lang>` by default), and month changes are announced through the shared Announcer.
- 28c505e: Add `KerbProvider` with the preferences store (`useKerbPreferences`, `getKerbHeadScript`), the shared Announcer (`useAnnouncer`), `Button` and `TextField`.
- 3f18e7d: Add `Select`, `Checkbox` and `RadioGroup`.
- 2c6cee1: Add `Tooltip`, `useToast`, `Dialog` and `Tabs`. Button's `disabledReason` is now shown through Tooltip, and resetting preferences shows a toast with Undo for 10 seconds.

### Patch Changes

- Updated dependencies
  - @kerb/tokens@1.0.0

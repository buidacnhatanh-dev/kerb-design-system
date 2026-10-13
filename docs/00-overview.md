# 00 · Overview

## One line

Kerb is a set of accessibility first React components with a documentation site and a Preferences panel, published as a package anyone can install.

## Why it exists

Every team the author worked with rebuilt the same buttons, forms and dialogs from scratch, and most of them failed quietly: dialogs that let focus escape, errors shown only in red, custom selects a screen reader could not open.

The author's master's thesis, "The Curb Cut Effect in Web Typography", looked at typography changes made for disabled people that end up helping everyone. Kerb applies that idea to components. The name is the British spelling of the kerb that gets cut so a wheelchair, a pram and a suitcase can all cross.

## Who it is for

* **Product teams** who need forms and dialogs that work without researching ARIA every time
* **Designers** who need tokens and states that match what gets built
* **People using assistive tech:** keyboards, screen readers, zoom, switch devices and low vision settings

## Scope of version 1.0

### Packages

* `@kerb/tokens`: CSS variables and JSON for three themes
* `@kerb/react`: 13 components and the `KerbProvider`

### Components

| Group | Components |
| --- | --- |
| Actions and inputs | Button, TextField, Select, Checkbox, RadioGroup |
| Overlays and feedback | Dialog, Tabs, Tooltip, Toast, DatePicker |
| Kerb originals | Preferences, ComfortControls, Announcer |

### Apps

* `apps/docs`: Next.js docs site (see `06-docs-site.md`)
* `apps/storybook`: component workshop and test target

### Out of scope for 1.0

Combobox, menu, data table, accordion, Vue or Angular versions, a Figma plugin.

## Brand

| Element | Value |
| --- | --- |
| Logo | Blue rounded square with a white kerb line: `<rect rx="8" fill="#1D4ED8"/>` plus path `M6 22h7l6-8h7`, stroke 3.2, round caps, on a 32 by 32 viewBox |
| Headings | Overpass 700 and 800 (based on road sign lettering) |
| Body | Atkinson Hyperlegible 400 and 700 (designed by the Braille Institute for low vision readers) |
| Code | JetBrains Mono 400 and 500 |
| Primary colour | `#1D4ED8` |
| Focus colour | `#FFC21A` around a dark ink ring (GOV.UK style) |

## Success measures (fill with real numbers)

* `[0]` axe violations across all stories and themes
* `[n]` keyboard tests running in CI
* `[n] kB` package size, minified and gzipped
* `[n]` places in use

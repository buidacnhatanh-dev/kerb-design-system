/*
 * Every page of the docs site in one place: the left nav, the home page grid,
 * search, static params and the props tables all read this list.
 */

export type ComponentSlug =
  | "button"
  | "text-field"
  | "select"
  | "checkbox"
  | "radio-group"
  | "dialog"
  | "tabs"
  | "tooltip"
  | "toast"
  | "date-picker"
  | "preferences"
  | "comfort-controls"
  | "announcer";

/** Where the props table comes from: a component (react-docgen-typescript) or a type (TypeScript) */
export type PropsSource =
  | { file: string; component: string }
  | { file: string; type: string };

export type ComponentEntry = {
  slug: ComponentSlug;
  title: string;
  group: "components" | "originals";
  href: string;
  /** Home page tile: one line, then the pattern or element it is built on */
  tile: { summary: string; label: string };
  /** Relative to packages/react/src */
  props: PropsSource[];
};

export const components: ComponentEntry[] = [
  {
    slug: "button",
    title: "Button",
    group: "components",
    href: "/components/button",
    tile: { summary: "Actions, with loading and disabled states", label: "<button>" },
    props: [{ file: "button/Button.tsx", component: "Button" }],
  },
  {
    slug: "text-field",
    title: "Text field",
    group: "components",
    href: "/components/text-field",
    tile: { summary: "Label, hint and error built in", label: "<input> + <label>" },
    props: [{ file: "text-field/TextField.tsx", component: "TextField" }],
  },
  {
    slug: "select",
    title: "Select",
    group: "components",
    href: "/components/select",
    tile: { summary: "Native first, styled to match", label: "<select>" },
    props: [{ file: "select/Select.tsx", component: "Select" }],
  },
  {
    slug: "checkbox",
    title: "Checkbox",
    group: "components",
    href: "/components/checkbox",
    tile: { summary: "Including the mixed state", label: "role=checkbox" },
    props: [{ file: "checkbox/Checkbox.tsx", component: "Checkbox" }],
  },
  {
    slug: "radio-group",
    title: "Radio group",
    group: "components",
    href: "/components/radio-group",
    tile: { summary: "Arrow keys move between options", label: "role=radiogroup" },
    props: [{ file: "radio-group/RadioGroup.tsx", component: "RadioGroup" }],
  },
  {
    slug: "dialog",
    title: "Dialog",
    group: "components",
    href: "/components/dialog",
    tile: { summary: "Focus trap and return, Escape to close", label: "role=dialog" },
    props: [{ file: "dialog/Dialog.tsx", component: "Dialog" }],
  },
  {
    slug: "tabs",
    title: "Tabs",
    group: "components",
    href: "/components/tabs",
    tile: { summary: "Manual or automatic activation", label: "role=tablist" },
    props: [
      { file: "tabs/Tabs.tsx", component: "Tabs" },
      // Tabs.Tab is a static on Tabs, so its table comes from its props type
      { file: "tabs/Tabs.tsx", type: "TabProps" },
    ],
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    group: "components",
    href: "/components/tooltip",
    tile: { summary: "Shows on hover and focus", label: "role=tooltip" },
    props: [{ file: "tooltip/Tooltip.tsx", component: "Tooltip" }],
  },
  {
    slug: "toast",
    title: "Toast",
    group: "components",
    href: "/components/toast",
    tile: { summary: "Announced politely, never steals focus", label: "aria-live" },
    props: [{ file: "toast/Toast.tsx", type: "ToastOptions" }],
  },
  {
    slug: "date-picker",
    title: "Date picker",
    group: "components",
    href: "/components/date-picker",
    tile: { summary: "Typeable field plus grid calendar", label: "role=grid" },
    props: [{ file: "date-picker/DatePicker.tsx", component: "DatePicker" }],
  },
  {
    slug: "preferences",
    title: "Preferences",
    group: "originals",
    href: "/originals/preferences",
    tile: {
      summary: "Presets and settings people choose for themselves",
      label: "Kerb original",
    },
    props: [{ file: "preferences/Preferences.tsx", component: "Preferences" }],
  },
  {
    slug: "comfort-controls",
    title: "Comfort controls",
    group: "originals",
    href: "/originals/comfort-controls",
    tile: {
      summary: "Text size, spacing and background, saved per person",
      label: "Kerb original",
    },
    props: [
      { file: "comfort-controls/ComfortControls.tsx", component: "ComfortControls" },
    ],
  },
  {
    slug: "announcer",
    title: "Announcer",
    group: "originals",
    href: "/originals/announcer",
    tile: { summary: "One shared live region for the whole app", label: "Kerb original" },
    props: [{ file: "announcer/Announcer.tsx", type: "AnnounceOptions" }],
  },
];

export type NavGroup = {
  label: string;
  links: Array<{ title: string; href: string }>;
};

export const nav: NavGroup[] = [
  {
    label: "Get started",
    links: [
      { title: "Install", href: "/install" },
      { title: "Theming", href: "/theming" },
    ],
  },
  {
    label: "Foundations",
    links: [
      { title: "Tokens", href: "/tokens" },
      { title: "Focus", href: "/focus" },
    ],
  },
  {
    label: "Components",
    links: components
      .filter((entry) => entry.group === "components")
      .map(({ title, href }) => ({ title, href })),
  },
  {
    label: "Kerb originals",
    links: components
      .filter((entry) => entry.group === "originals")
      .map(({ title, href }) => ({ title, href })),
  },
];

export function componentBySlug(slug: string): ComponentEntry | undefined {
  return components.find((entry) => entry.slug === slug);
}

export const repositoryUrl =
  "https://github.com/buidacnhatanh-dev/kerb-design-system";

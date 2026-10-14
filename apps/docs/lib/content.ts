import type { ComponentType } from "react";
import type { ComponentSlug } from "./registry";

/* Static imports of every MDX file, so the bundler sees them all */

export type MdxModule = {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter: Record<string, unknown>;
};

export const componentContent: Record<ComponentSlug, () => Promise<MdxModule>> = {
  button: () => import("../content/components/button.mdx"),
  "text-field": () => import("../content/components/text-field.mdx"),
  select: () => import("../content/components/select.mdx"),
  checkbox: () => import("../content/components/checkbox.mdx"),
  "radio-group": () => import("../content/components/radio-group.mdx"),
  dialog: () => import("../content/components/dialog.mdx"),
  tabs: () => import("../content/components/tabs.mdx"),
  tooltip: () => import("../content/components/tooltip.mdx"),
  toast: () => import("../content/components/toast.mdx"),
  "date-picker": () => import("../content/components/date-picker.mdx"),
  preferences: () => import("../content/components/preferences.mdx"),
  "comfort-controls": () => import("../content/components/comfort-controls.mdx"),
  announcer: () => import("../content/components/announcer.mdx"),
};

/** The frontmatter every component page has */
export type ComponentFrontmatter = {
  description: string;
  pattern: string;
  exampleCaption?: string;
  transcript: string[];
  use: string[];
  avoid: string[];
  keyboard: Array<{ keys: string[]; action: string }>;
};

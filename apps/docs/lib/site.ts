import { readFileSync } from "node:fs";
import path from "node:path";
import { components, nav } from "./registry";

/** The real package version, read at build time */
export function getVersion(): string {
  const file = path.join(process.cwd(), "..", "..", "packages", "react", "package.json");
  return (JSON.parse(readFileSync(file, "utf8")) as { version: string }).version;
}

export type SearchEntry = {
  /** What matched: a page or a heading on it */
  title: string;
  /** The page it is on, shown under the title */
  page: string;
  href: string;
};

/** Headings shown on every component page by the template */
/** The template's own; the MDX body adds its headings (Accessibility and any others) */
export const componentSections = [
  { id: "live-example", title: "Live example" },
  { id: "when-to-use", title: "When to use it" },
  { id: "keyboard", title: "Keyboard" },
  { id: "props", title: "Props" },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Second and third level headings written in an MDX file */
export function mdxHeadings(file: string): Array<{ id: string; title: string; level: 2 | 3 }> {
  const source = readFileSync(path.join(process.cwd(), "content", file), "utf8");
  const body = source.replace(/^---[\s\S]*?---/, "");
  return [...body.matchAll(/^(##|###) (.+)$/gm)].map((match) => ({
    level: match[1] === "##" ? 2 : 3,
    title: (match[2] ?? "").trim(),
    id: slugify(match[2] ?? ""),
  }));
}

const pageFiles: Record<string, string> = {
  "/install": "pages/install.mdx",
  "/theming": "pages/theming.mdx",
  "/tokens": "pages/tokens.mdx",
  "/focus": "pages/focus.mdx",
};

/** Built once at build time: every page, and every heading on it. No third party service */
export function getSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [{ title: "Home", page: "Kerb", href: "/" }];
  for (const group of nav) {
    for (const link of group.links) {
      entries.push({ title: link.title, page: group.label, href: link.href });
      const file = pageFiles[link.href];
      const component = components.find((entry) => entry.href === link.href);
      const headings = file
        ? mdxHeadings(file)
        : component
          ? [
              ...componentSections,
              ...mdxHeadings(`components/${component.slug}.mdx`),
            ]
          : [];
      for (const heading of headings) {
        entries.push({
          title: heading.title,
          page: link.title,
          href: `${link.href}#${heading.id}`,
        });
      }
    }
  }
  return entries;
}

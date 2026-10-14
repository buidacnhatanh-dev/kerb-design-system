import { createRequire } from "node:module";
import type { Page } from "@playwright/test";
import { components } from "../../apps/docs/lib/registry";

export const routes = [
  "/",
  "/install",
  "/theming",
  "/tokens",
  "/focus",
  ...components.map((entry) => entry.href),
];

export type Theme = "light" | "dark" | "comfort";

/** Saves a preference the way the docs' KerbProvider does, before the page loads */
export async function useTheme(page: Page, theme: Theme) {
  const saved = JSON.stringify({ v: 1, prefs: { theme } });
  await page.addInitScript({
    content: `localStorage.setItem("kerb", ${JSON.stringify(saved)})`,
  });
}

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

export type AxeViolation = { id: string; help: string; nodes: Array<{ target: string[] }> };

/** axe on the whole page in a real browser, colour contrast included */
export async function runAxe(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: axePath });
  return (await page.evaluate(
    "axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target })) })))",
  )) as AxeViolation[];
}

/** WCAG 1.4.12 text spacing, as the bookmarklets used in audits apply it */
export const textSpacingCss = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-block-end: 2em !important; }
`;

/** True when the page scrolls sideways. Code blocks and tables scroll inside themselves */
export function pageScrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(
    "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1",
  ) as Promise<boolean>;
}

/**
 * Elements whose text is cut off: content larger than a box that hides its
 * overflow. Screen reader only text (1px boxes) and boxes made to scroll are left out.
 */
export function clippedText(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const found = [];
    for (const element of document.querySelectorAll("body *")) {
      const style = getComputedStyle(element);
      const hides = ["hidden", "clip"];
      const hidesX = hides.includes(style.overflowX);
      const hidesY = hides.includes(style.overflowY);
      if (!hidesX && !hidesY) continue;
      if (element.clientWidth <= 1 || element.clientHeight <= 1) continue;
      if (!element.textContent || !element.textContent.trim()) continue;
      const cutX = hidesX && element.scrollWidth > element.clientWidth + 1;
      const cutY = hidesY && element.scrollHeight > element.clientHeight + 1;
      if (cutX || cutY) {
        found.push(element.tagName.toLowerCase() + (element.className ? "." + String(element.className).split(" ").join(".") : ""));
      }
    }
    return found;
  })()`) as Promise<string[]>;
}

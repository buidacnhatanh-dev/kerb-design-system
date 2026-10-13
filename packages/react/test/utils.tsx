import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe } from "vitest";
import { configureAxe } from "vitest-axe";
import { KerbProvider } from "../src/provider";

export const themes = ["light", "dark", "comfort"] as const;
export type Theme = (typeof themes)[number];

/** Runs a block of tests once per theme, with `data-kerb-theme` set on `<html>`. */
export function forEachTheme(run: (theme: Theme) => void) {
  describe.each(themes)("in the %s theme", (theme) => {
    beforeEach(() => {
      document.documentElement.setAttribute("data-kerb-theme", theme);
    });
    afterEach(() => {
      document.documentElement.removeAttribute("data-kerb-theme");
    });
    run(theme);
  });
}

/** Renders inside `KerbProvider`, as components are used in an app. */
export function renderWithKerb(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  return render(ui, { wrapper: KerbProvider, ...options });
}

export function liveRegion(urgency: "polite" | "assertive"): HTMLElement {
  const region = document.querySelector<HTMLElement>(
    `[aria-live="${urgency}"]`,
  );
  if (!region) throw new Error(`No ${urgency} live region in the document`);
  return region;
}

/**
 * A stand in for `window.matchMedia` (jsdom has none). `set` changes whether a
 * query matches and fires its change listeners, like switching an OS setting.
 */
export function mockMatchMedia(initial: Record<string, boolean> = {}) {
  const state = new Map(Object.entries(initial));
  const listeners = new Map<string, Set<() => void>>();

  const matchMedia = (query: string) => ({
    media: query,
    get matches() {
      return state.get(query) ?? false;
    },
    addEventListener: (_type: string, listener: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)?.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
  });

  const original = window.matchMedia;
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

  return {
    set(query: string, matches: boolean) {
      state.set(query, matches);
      listeners.get(query)?.forEach((listener) => listener());
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

/**
 * axe for jsdom. Colour contrast needs real rendering, so it is left to the
 * story tests (`pnpm test:a11y`), which check every story in a browser in all three themes.
 */
export const axe: ReturnType<typeof configureAxe> = configureAxe({
  rules: { "color-contrast": { enabled: false } },
});

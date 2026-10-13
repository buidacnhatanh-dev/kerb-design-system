import type { KerbPreferences } from "./preferences";

/**
 * Writes preferences to an element (in practice `<html>`) as `data-kerb-*`
 * attributes and `--kerb-pref-*` variables. This is the only place that does.
 *
 * `explicit` holds only the values someone chose: the person, or the app
 * through `defaultPreferences`. A value that is missing removes its variable,
 * so component CSS falls back to the theme tokens (comfort keeps its 18px body
 * until the person picks a text size). Device settings fill the gaps for theme,
 * motion and focus width.
 *
 * `getKerbHeadScript` (src/head-script.ts) inlines this function with `toString()`, so it must stay
 * self contained: no imports, no references to anything outside its body.
 * The focus colours are palette values, checked against tokens.json in the tests.
 */
export function applyPreferences(
  root: HTMLElement,
  explicit: Partial<KerbPreferences>,
): void {
  const matches = (query: string) => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const setVariable = (name: string, value: string | null) => {
    if (value === null) root.style.removeProperty(name);
    else root.style.setProperty(name, value);
  };
  const setAttribute = (name: string, value: string | null) => {
    if (value === null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  };
  const pick = (
    map: Record<string, string>,
    key: string | undefined,
  ): string | null =>
    typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key)
      ? (map[key] as string)
      : null;
  const number = (value: number | undefined, unit: string, divisor: number) =>
    typeof value === "number" && isFinite(value)
      ? value / divisor + unit
      : null;

  const theme =
    pick(
      { light: "light", dark: "dark", comfort: "comfort" },
      explicit.theme,
    ) || (matches("(prefers-color-scheme: dark)") ? "dark" : "light");
  setAttribute("data-kerb-theme", theme);

  setVariable("--kerb-pref-text-size", number(explicit.textSize, "rem", 16));
  setVariable("--kerb-pref-line-height", number(explicit.lineHeight, "", 1));
  setVariable(
    "--kerb-pref-word-spacing",
    number(explicit.wordSpacing, "em", 1),
  );
  setVariable(
    "--kerb-pref-letter-spacing",
    number(explicit.letterSpacing, "em", 1),
  );
  setVariable(
    "--kerb-pref-font",
    pick(
      {
        atkinson: "var(--kerb-font-family-body)",
        lexend: "var(--kerb-font-family-dyslexia)",
        system: "var(--kerb-font-family-system)",
      },
      explicit.font,
    ),
  );
  setVariable(
    "--kerb-pref-measure",
    pick({ narrow: "52ch", medium: "66ch", wide: "84ch" }, explicit.measure),
  );

  setVariable(
    "--kerb-focus-color",
    pick(
      theme === "dark"
        ? { yellow: "#FFC21A", blue: "#8EB1FF", magenta: "#F0ABFC" }
        : { yellow: "#FFC21A", blue: "#2563EB", magenta: "#C026D3" },
      explicit.focusColor,
    ),
  );
  setVariable(
    "--kerb-focus-width",
    pick(
      {
        standard: "var(--kerb-focus-width-standard)",
        thick: "var(--kerb-focus-width-thick)",
      },
      explicit.focusWidth,
    ) ||
      (matches("(prefers-contrast: more)")
        ? "var(--kerb-focus-width-thick)"
        : null),
  );

  const density = pick(
    { compact: "compact", default: "default", spacious: "spacious" },
    explicit.density,
  );
  setAttribute("data-kerb-density", density || "default");
  setVariable(
    "--kerb-pref-control-height",
    density ? "var(--kerb-size-target-" + density + ")" : null,
  );

  setAttribute(
    "data-kerb-motion",
    pick({ reduced: "reduced", off: "off" }, explicit.motion) ||
      (matches("(prefers-reduced-motion: reduce)") ? "reduced" : "full"),
  );
  setAttribute(
    "data-kerb-underline-links",
    explicit.underlineLinks === true ? "" : null,
  );
  setAttribute(
    "data-kerb-focus-on-click",
    explicit.focusOnClick === true ? "" : null,
  );
}

/** The media queries `applyPreferences` reads. The provider re-applies when one changes. */
export const systemQueries = [
  "(prefers-color-scheme: dark)",
  "(prefers-reduced-motion: reduce)",
  "(prefers-contrast: more)",
];

import type { KerbPreferences, KerbPresetName } from "../provider";

/* Names, hints and value formats shared by Preferences and ComfortControls */

export const presetLabels: Record<
  KerbPresetName,
  { label: string; hint: string }
> = {
  standard: { label: "Standard", hint: "Kerb defaults" },
  lowVision: { label: "Low vision", hint: "Bigger and bolder" },
  dyslexia: { label: "Dyslexia friendly", hint: "Space and shorter lines" },
  tiredEyes: { label: "Tired eyes", hint: "Dark and calm" },
  keyboard: { label: "Keyboard first", hint: "Focus you can’t miss" },
};

type RangeKey = "textSize" | "lineHeight" | "wordSpacing" | "letterSpacing";

export type RangeSpec = {
  label: string;
  min: number;
  max: number;
  step: number;
  display: (value: number) => string;
  valueText: (value: number) => string;
};

const em = (value: number) => value.toFixed(2);

export const rangeSpecs: Record<RangeKey, RangeSpec> = {
  textSize: {
    label: "Text size",
    min: 14,
    max: 26,
    step: 1,
    display: (value) => `${value}px`,
    valueText: (value) => `${value} pixels`,
  },
  lineHeight: {
    label: "Line spacing",
    min: 1.4,
    max: 2.2,
    step: 0.05,
    display: (value) => value.toFixed(2),
    valueText: (value) => value.toFixed(2),
  },
  wordSpacing: {
    label: "Word spacing",
    min: 0,
    max: 0.24,
    step: 0.01,
    display: (value) => `+${em(value)}em`,
    valueText: (value) => `${em(value)} em`,
  },
  letterSpacing: {
    label: "Letter spacing",
    min: 0,
    max: 0.12,
    step: 0.01,
    display: (value) => `${em(value)}em`,
    valueText: (value) => `${em(value)} em`,
  },
};

/** White, Warm and Dark set the theme. There is no separate background tint */
export const backgroundOptions: Array<{
  value: Exclude<KerbPreferences["theme"], "system">;
  label: string;
}> = [
  { value: "light", label: "White" },
  { value: "comfort", label: "Warm" },
  { value: "dark", label: "Dark" },
];

export const choiceLabels = {
  font: { atkinson: "Atkinson", lexend: "Lexend", system: "System" },
  measure: { narrow: "Narrow", medium: "Medium", wide: "Wide" },
  focusColor: { yellow: "Yellow", blue: "Blue", magenta: "Magenta" },
  focusWidth: { standard: "Standard", thick: "Thick" },
  density: { compact: "Compact", default: "Default", spacious: "Spacious" },
  motion: { system: "Follow system", reduced: "Reduced", off: "Off" },
} satisfies {
  [
    K in "font" | "measure" | "focusColor" | "focusWidth" | "density" | "motion"
  ]: Record<KerbPreferences[K], string>;
};

/** The options of a choice, in the order they are listed above */
export function choiceOptions<K extends keyof typeof choiceLabels>(key: K) {
  return Object.entries(choiceLabels[key]).map(([value, label]) => ({
    value: value as KerbPreferences[K],
    label,
  }));
}

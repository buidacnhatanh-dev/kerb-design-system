export type KerbPreferences = {
  theme: "system" | "light" | "dark" | "comfort";
  /** px, 14 to 26 */
  textSize: number;
  /** 1.4 to 2.2 */
  lineHeight: number;
  /** em, 0 to 0.24 */
  wordSpacing: number;
  /** em, 0 to 0.12 */
  letterSpacing: number;
  font: "atkinson" | "lexend" | "system";
  /** Max line length: 52, 66 or 84 ch */
  measure: "narrow" | "medium" | "wide";
  focusColor: "yellow" | "blue" | "magenta";
  focusWidth: "standard" | "thick";
  density: "compact" | "default" | "spacious";
  motion: "system" | "reduced" | "off";
  underlineLinks: boolean;
  /** Show the focus ring after mouse clicks too */
  focusOnClick: boolean;
};

export type KerbPresetName =
  "standard" | "lowVision" | "dyslexia" | "tiredEyes" | "keyboard";

export const defaultPreferences: Readonly<KerbPreferences> = {
  theme: "system",
  textSize: 16,
  lineHeight: 1.6,
  wordSpacing: 0,
  letterSpacing: 0,
  font: "atkinson",
  measure: "medium",
  focusColor: "yellow",
  focusWidth: "standard",
  density: "default",
  motion: "system",
  underlineLinks: false,
  focusOnClick: false,
};

/** What each preset changes, on top of the defaults. */
export const presets: Readonly<
  Record<KerbPresetName, Readonly<Partial<KerbPreferences>>>
> = {
  standard: {},
  lowVision: {
    textSize: 22,
    lineHeight: 1.7,
    wordSpacing: 0.04,
    measure: "wide",
    focusWidth: "thick",
    density: "spacious",
    underlineLinks: true,
    focusOnClick: true,
  },
  dyslexia: {
    font: "lexend",
    textSize: 18,
    lineHeight: 1.85,
    wordSpacing: 0.16,
    theme: "comfort",
    measure: "narrow",
    motion: "reduced",
    underlineLinks: true,
  },
  tiredEyes: {
    theme: "dark",
    textSize: 18,
    lineHeight: 1.75,
    wordSpacing: 0.02,
    motion: "off",
  },
  keyboard: {
    focusColor: "magenta",
    focusWidth: "thick",
    underlineLinks: true,
    focusOnClick: true,
  },
};

export const presetNames = Object.keys(presets) as KerbPresetName[];

/**
 * The colour behind each focus colour choice, for swatches. Palette values
 * from tokens.json: `light` is used on the light and comfort themes, `dark`
 * on dark. applyPreferences keeps its own copy (it must stay self contained);
 * a test checks the two against the palette.
 */
export const focusColorValues: Readonly<
  Record<KerbPreferences["focusColor"], { light: string; dark: string }>
> = {
  yellow: { light: "#FFC21A", dark: "#FFC21A" },
  blue: { light: "#2563EB", dark: "#8EB1FF" },
  magenta: { light: "#C026D3", dark: "#F0ABFC" },
};

type NumberKey = "textSize" | "lineHeight" | "wordSpacing" | "letterSpacing";
type BooleanKey = "underlineLinks" | "focusOnClick";
type ChoiceKey = Exclude<keyof KerbPreferences, NumberKey | BooleanKey>;

/** min, max and how many units of the value make one step (also the scale used in export codes) */
const ranges: Record<NumberKey, { min: number; max: number; scale: number }> = {
  textSize: { min: 14, max: 26, scale: 1 },
  lineHeight: { min: 1.4, max: 2.2, scale: 100 },
  wordSpacing: { min: 0, max: 0.24, scale: 100 },
  letterSpacing: { min: 0, max: 0.12, scale: 100 },
};

/** Allowed values, each with the letter that stands for it in an export code */
const choices: {
  [K in ChoiceKey]: Record<KerbPreferences[K], string>;
} = {
  theme: { system: "S", light: "L", dark: "D", comfort: "C" },
  font: { atkinson: "A", lexend: "L", system: "S" },
  measure: { narrow: "N", medium: "M", wide: "W" },
  focusColor: { yellow: "Y", blue: "B", magenta: "M" },
  focusWidth: { standard: "S", thick: "T" },
  density: { compact: "C", default: "D", spacious: "S" },
  motion: { system: "S", reduced: "R", off: "O" },
};

const numberKeys = Object.keys(ranges) as NumberKey[];
const choiceKeys = Object.keys(choices) as ChoiceKey[];
const booleanKeys: BooleanKey[] = ["underlineLinks", "focusOnClick"];
const flags: Record<BooleanKey, string> = {
  underlineLinks: "u",
  focusOnClick: "k",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(key: NumberKey, value: number): number {
  const { min, max, scale } = ranges[key];
  const stepped = Math.round(value * scale) / scale;
  return Math.min(max, Math.max(min, stepped));
}

/**
 * Keeps the known fields with valid values and drops everything else.
 * Numbers are clamped to their range. Never throws.
 */
export function sanitizePreferences(input: unknown): Partial<KerbPreferences> {
  const result: Partial<KerbPreferences> = {};
  if (!isRecord(input)) return result;

  for (const key of numberKeys) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = clamp(key, value);
    }
  }
  for (const key of choiceKeys) {
    const value = input[key];
    if (typeof value === "string" && Object.hasOwn(choices[key], value)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  for (const key of booleanKeys) {
    const value = input[key];
    if (typeof value === "boolean") {
      result[key] = value;
    }
  }
  return result;
}

export function preferencesEqual(a: KerbPreferences, b: KerbPreferences) {
  return (
    Object.keys(defaultPreferences) as Array<keyof KerbPreferences>
  ).every((key) => a[key] === b[key]);
}

const CODE_VERSION = "kerb1";

/**
 * A short versioned string holding every preference, for example
 * `kerb1.18.185.16.0.C.L.N.Y.S.D.R.u`: the four numbers, one letter per
 * choice, then a flag for each switch that is on.
 */
export function encodePreferences(prefs: KerbPreferences): string {
  const parts = [
    CODE_VERSION,
    ...numberKeys.map((key) =>
      String(Math.round(prefs[key] * ranges[key].scale)),
    ),
    ...choiceKeys.map(
      (key) => (choices[key] as Record<string, string>)[prefs[key]] ?? "",
    ),
    ...booleanKeys.filter((key) => prefs[key]).map((key) => flags[key]),
  ];
  return parts.join(".");
}

export type DecodeResult =
  { ok: true; prefs: KerbPreferences } | { ok: false; reason: string };

/** Reads an export code. Unknown trailing fields are ignored. Never throws. */
export function decodePreferences(code: unknown): DecodeResult {
  if (typeof code !== "string" || code.trim() === "") {
    return { ok: false, reason: "Enter a preferences code." };
  }
  const [version, ...fields] = code.trim().split(".");
  if (version !== CODE_VERSION) {
    return /^kerb\d+$/.test(version ?? "")
      ? { ok: false, reason: "This code is from a different version of Kerb." }
      : { ok: false, reason: "This is not a Kerb preferences code." };
  }
  if (fields.length < numberKeys.length + choiceKeys.length) {
    return { ok: false, reason: "The code is incomplete." };
  }

  const prefs: KerbPreferences = {
    ...defaultPreferences,
    underlineLinks: false,
    focusOnClick: false,
  };

  for (const key of numberKeys) {
    const field = fields.shift() ?? "";
    const { min, max, scale } = ranges[key];
    const value = Number(field) / scale;
    if (!/^\d+$/.test(field) || value < min || value > max) {
      return { ok: false, reason: `The code has an invalid value for ${key}.` };
    }
    prefs[key] = value;
  }
  for (const key of choiceKeys) {
    const field = fields.shift();
    const match = Object.entries(choices[key]).find(
      ([, letter]) => letter === field,
    );
    if (!match) {
      return { ok: false, reason: `The code has an invalid value for ${key}.` };
    }
    (prefs as Record<string, unknown>)[key] = match[0];
  }
  // Whatever is left is flags. Ones this version does not know are ignored
  for (const key of booleanKeys) {
    prefs[key] = fields.includes(flags[key]);
  }
  return { ok: true, prefs };
}

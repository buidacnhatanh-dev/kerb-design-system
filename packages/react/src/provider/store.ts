import {
  decodePreferences,
  defaultPreferences,
  encodePreferences,
  preferencesEqual,
  presetNames,
  presets,
  sanitizePreferences,
} from "./preferences";
import type { KerbPreferences, KerbPresetName } from "./preferences";

export type PreferencesSnapshot = {
  /** Every preference with its current value */
  prefs: KerbPreferences;
  /** Only the values chosen by the person or by the app's defaults. Drives what is written to `<html>` */
  explicit: Partial<KerbPreferences>;
  activePreset: KerbPresetName | "custom";
};

export type ImportResult = { ok: true } | { ok: false; reason: string };

export type PreferencesStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PreferencesSnapshot;
  getServerSnapshot: () => PreferencesSnapshot;
  set: <K extends keyof KerbPreferences>(
    key: K,
    value: KerbPreferences[K],
  ) => void;
  setMany: (values: Partial<KerbPreferences>) => void;
  applyPreset: (name: KerbPresetName) => void;
  /** Back to the defaults. The previous choices are kept in memory for `undoReset` */
  reset: () => void;
  /** Restores what `reset` removed. Returns false when there is nothing to restore */
  undoReset: () => boolean;
  exportCode: () => string;
  importCode: (code: string) => ImportResult;
  /** Replaces the app level defaults (the provider's `defaultPreferences` and `theme` props) */
  setDefaults: (defaults: Partial<KerbPreferences>) => void;
  /** Reads storage again, for example after another tab saved */
  reload: () => void;
};

const STORAGE_VERSION = 1;

function readStorage(storageKey: string): Partial<KerbPreferences> {
  // Storage can be missing or blocked (private mode, sandboxed frames, server rendering)
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    );
    if (
      typeof saved === "object" &&
      saved !== null &&
      "v" in saved &&
      saved.v === STORAGE_VERSION &&
      "prefs" in saved
    ) {
      return sanitizePreferences(saved.prefs);
    }
  } catch {
    // Fall through to no saved preferences
  }
  return {};
}

function writeStorage(storageKey: string, chosen: Partial<KerbPreferences>) {
  try {
    if (Object.keys(chosen).length === 0) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ v: STORAGE_VERSION, prefs: chosen }),
      );
    }
  } catch {
    // The preferences still apply for this visit
  }
}

/**
 * The preferences store behind `KerbProvider`, shaped for `useSyncExternalStore`.
 *
 * Three layers, later ones win: the app's defaults, then what the person chose
 * (`chosen`, the only part that is saved). Device settings are read when the
 * values are applied to `<html>`, and only fill what neither layer set.
 */
export function createPreferencesStore(options: {
  storageKey: string;
  defaults?: Partial<KerbPreferences>;
}): PreferencesStore {
  const { storageKey } = options;
  const listeners = new Set<() => void>();
  let defaults = sanitizePreferences(options.defaults);
  let chosen = readStorage(storageKey);
  let beforeReset: Partial<KerbPreferences> | null = null;

  const build = (
    chosenValues: Partial<KerbPreferences>,
  ): PreferencesSnapshot => {
    const base = { ...defaultPreferences, ...defaults };
    const prefs = { ...base, ...chosenValues };
    const activePreset =
      presetNames.find((name) =>
        preferencesEqual(prefs, { ...base, ...presets[name] }),
      ) ?? "custom";
    return { prefs, explicit: { ...defaults, ...chosenValues }, activePreset };
  };

  let snapshot = build(chosen);
  let serverSnapshot = build({});

  const commit = (next: Partial<KerbPreferences>, save = true) => {
    chosen = next;
    snapshot = build(chosen);
    if (save) writeStorage(storageKey, chosen);
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    set(key, value) {
      commit({ ...chosen, ...sanitizePreferences({ [key]: value }) });
    },
    setMany(values) {
      commit({ ...chosen, ...sanitizePreferences(values) });
    },
    applyPreset(name) {
      // A preset replaces every earlier choice, so it always lands on the same values
      commit({ ...presets[name] });
    },
    reset() {
      beforeReset = chosen;
      commit({});
    },
    undoReset() {
      if (!beforeReset) return false;
      const restored = beforeReset;
      beforeReset = null;
      commit(restored);
      return true;
    },
    exportCode: () => encodePreferences(snapshot.prefs),
    importCode(code) {
      const result = decodePreferences(code);
      if (!result.ok) return result;
      commit(result.prefs);
      return { ok: true };
    },
    setDefaults(next) {
      const sanitized = sanitizePreferences(next);
      if (JSON.stringify(sanitized) === JSON.stringify(defaults)) return;
      defaults = sanitized;
      serverSnapshot = build({});
      commit(chosen, false);
    },
    reload() {
      commit(readStorage(storageKey), false);
    },
  };
}

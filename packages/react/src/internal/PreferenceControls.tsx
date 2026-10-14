import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAnnouncer } from "../announcer";
import type { KerbPreferences } from "../provider";
import { cx } from "./cx";
import styles from "./PreferenceControls.module.css";

/*
 * The controls shared by Preferences and ComfortControls: a range with its
 * value, a segmented radio group, preset cards and a switch. Not public.
 */

export type ShownTheme = Exclude<KerbPreferences["theme"], "system">;

const darkQuery = "(prefers-color-scheme: dark)";

function subscribeToScheme(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(darkQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const systemIsDark = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(darkQuery).matches;

/**
 * The theme actually shown: the chosen one, or the one the system picks while
 * the theme is `system`. Follows the system setting live.
 */
export function useShownTheme(theme: KerbPreferences["theme"]): ShownTheme {
  const dark = useSyncExternalStore(
    subscribeToScheme,
    systemIsDark,
    () => false,
  );
  if (theme !== "system") return theme;
  return dark ? "dark" : "light";
}

/** How long a range has to rest before its new value is announced */
const ANNOUNCE_DEBOUNCE_MS = 500;

/**
 * Announces through the shared Announcer. With a `key`, the message waits
 * until that key has been quiet for 500ms, so dragging a range or holding an
 * arrow key says only where it ended up.
 */
export function usePreferenceAnnouncer() {
  const { announce } = useAnnouncer();
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return useCallback(
    (message: string, key?: string) => {
      if (!key) {
        announce(message);
        return;
      }
      clearTimeout(timers.current.get(key));
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          announce(message);
        }, ANNOUNCE_DEBOUNCE_MS),
      );
    },
    [announce],
  );
}

export type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Shown next to the label, such as "18px" */
  display: (value: number) => string;
  /** Read by screen readers, such as "18 pixels" */
  valueText: (value: number) => string;
  onChange: (value: number) => void;
};

/** A native range with a visible label and its current value. */
export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  valueText,
  onChange,
}: RangeControlProps) {
  const id = useId();
  const shown = Math.min(max, Math.max(min, value));
  const fill = ((shown - min) / (max - min)) * 100;

  return (
    <div className={styles.range}>
      <div className={styles.rangeHeader}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {/* The same value as aria-valuetext, so it is not read twice */}
        <span className={styles.rangeValue} aria-hidden="true">
          {display(shown)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        aria-valuetext={valueText(shown)}
        className={cx("kerb-focusable", styles.rangeInput)}
        style={{ "--kerb-range-fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Shown before the label, decorative */
  swatch?: ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  label: string;
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** `pills`: separate rounded options with room for a swatch (ComfortControls' background) */
  appearance?: "segments" | "pills";
};

/**
 * A radio group drawn as segments: native radios, one Tab stop, arrow keys
 * move and select.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  appearance = "segments",
}: SegmentedControlProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <div className={styles.segmented}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={cx(styles.segments, appearance === "pills" && styles.pills)}
      >
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={cx("kerb-focus-proxy", styles.coveringInput)}
            />
            <span className={styles.segmentFace}>
              {option.swatch}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export type PresetCardOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type PresetCardsProps<T extends string> = {
  label: string;
  options: Array<PresetCardOption<T>>;
  /** No card is selected when nothing matches */
  value: T | null;
  onChange: (value: T) => void;
};

/**
 * Preset cards: a radio group of native radios, each card a name (its label)
 * and a hint (its description).
 */
export function PresetCards<T extends string>({
  label,
  options,
  value,
  onChange,
}: PresetCardsProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <div className={styles.presets}>
      <p id={labelId} className={styles.sectionLabel}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.cards}>
        {options.map((option) => {
          const inputId = `${id}-${option.value}`;
          const hintId = `${inputId}-hint`;
          return (
            <div key={option.value} className={styles.card}>
              {/* On top of the whole card, so a press anywhere on it chooses */}
              <input
                id={inputId}
                type="radio"
                name={id}
                value={option.value}
                checked={option.value === value}
                aria-describedby={hintId}
                onChange={() => onChange(option.value)}
                className={cx("kerb-focus-proxy", styles.coveringInput)}
              />
              <span className={styles.cardFace}>
                <label htmlFor={inputId} className={styles.cardName}>
                  {option.label}
                </label>
                <span id={hintId} className={styles.cardHint}>
                  {option.hint}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type SwitchControlProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** An on and off setting: `<button role="switch">` with a visible label and hint. */
export function SwitchControl({
  label,
  hint,
  checked,
  onChange,
}: SwitchControlProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hintId}
        className={cx("kerb-focusable", styles.switch)}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  );
}

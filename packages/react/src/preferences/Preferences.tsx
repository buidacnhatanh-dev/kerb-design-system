import { useId, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactElement } from "react";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { cx } from "../internal/cx";
import {
  PresetCards,
  RangeControl,
  SegmentedControl,
  SwitchControl,
  usePreferenceAnnouncer,
  useShownTheme,
} from "../internal/PreferenceControls";
import type { SegmentOption } from "../internal/PreferenceControls";
import controls from "../internal/PreferenceControls.module.css";
import {
  backgroundOptions,
  choiceLabels,
  choiceOptions,
  presetLabels,
  rangeSpecs,
} from "../internal/preferenceLabels";
import { useControllableState } from "../internal/useControllableState";
import { useKerbPreferences } from "../provider";
import type { KerbPreferences, KerbPresetName } from "../provider";
import { focusColorValues } from "../provider/preferences";
import { TextField } from "../text-field";
import styles from "./Preferences.module.css";

export type PreferencesSection =
  "reading" | "focus" | "layout" | "motion" | "links";

export type PreferencesProps = {
  /** Preset cards after Standard, which is always first. Default all four */
  presets?: Array<Exclude<KerbPresetName, "standard">>;
  /** Which groups of settings to show. Default all five */
  sections?: PreferencesSection[];
  /** `panel` sits in the page. `sheet` is a modal Dialog along the bottom edge, for small screens. Default `panel` */
  variant?: "panel" | "sheet";
  /** Default "Your preferences" */
  title?: string;
  /** Level of the panel's title (the sheet's is the Dialog's h2). Default 2 */
  headingLevel?: 2 | 3 | 4 | 5;
  /** Sheet: the element that opens it. Focus returns here */
  trigger?: ReactElement;
  /** Sheet: controlled open state */
  open?: boolean;
  /** Sheet: open from the start, uncontrolled */
  defaultOpen?: boolean;
  /** Sheet: called on open and on every close */
  onOpenChange?: (open: boolean) => void;
  /** Sheet: called when the person presses Done, before it closes */
  onDone?: () => void;
  className?: string;
};

const allPresets: Array<Exclude<KerbPresetName, "standard">> = [
  "lowVision",
  "dyslexia",
  "tiredEyes",
  "keyboard",
];

const allSections: PreferencesSection[] = [
  "reading",
  "focus",
  "layout",
  "motion",
  "links",
];

/**
 * Where people set how the product looks and behaves for them: presets,
 * reading, focus, layout and motion. Every change is saved on the device,
 * written to `<html>` and announced.
 */
export function Preferences({
  presets = allPresets,
  sections = allSections,
  variant = "panel",
  title = "Your preferences",
  headingLevel = 2,
  trigger,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onDone,
  className,
}: PreferencesProps) {
  const { reset } = useKerbPreferences();
  const [open, setOpen] = useControllableState(
    openProp,
    defaultOpen,
    onOpenChange,
  );
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  if (variant === "sheet") {
    return (
      <Dialog
        title={title}
        placement="bottom"
        initialFocus="close"
        trigger={trigger}
        open={open}
        onOpenChange={setOpen}
      >
        <div className={cx(styles.fixed, styles.sheetContent, className)}>
          <PreferencesContent
            presets={presets}
            sections={sections}
            sectionLevel={3}
            onReset={() => {
              // The Undo toast cannot be reached under a modal sheet, so the
              // sheet closes first and focus goes back to its trigger
              setOpen(false);
              reset();
            }}
          />
        </div>
        <Dialog.Confirm onClick={() => onDone?.()}>Done</Dialog.Confirm>
      </Dialog>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cx(styles.fixed, styles.panel, className)}
    >
      <div className={styles.header}>
        <Heading id={titleId} className={styles.title}>
          {title}
        </Heading>
        <Button
          variant="ghost"
          size="small"
          className={styles.reset}
          onClick={reset}
        >
          Reset
        </Button>
      </div>
      <PreferencesContent
        presets={presets}
        sections={sections}
        sectionLevel={(headingLevel + 1) as 3 | 4 | 5 | 6}
      />
    </section>
  );
}

type ContentProps = {
  presets: Array<Exclude<KerbPresetName, "standard">>;
  sections: PreferencesSection[];
  sectionLevel: 3 | 4 | 5 | 6;
  /** The sheet has its Reset here; the panel has it in its header */
  onReset?: () => void;
};

function PreferencesContent({
  presets,
  sections,
  sectionLevel,
  onReset,
}: ContentProps) {
  const { prefs, set, applyPreset, activePreset } = useKerbPreferences();
  const announce = usePreferenceAnnouncer();
  const theme = useShownTheme(prefs.theme);
  const SectionHeading = `h${sectionLevel}` as const;
  const has = (section: PreferencesSection) => sections.includes(section);

  const cards = (["standard", ...presets] as KerbPresetName[]).map((name) => ({
    value: name,
    ...presetLabels[name],
  }));
  const shownPreset = cards.some((card) => card.value === activePreset)
    ? (activePreset as KerbPresetName)
    : null;
  const currentName =
    activePreset === "custom" ? "Custom" : presetLabels[activePreset].label;

  const range = (key: keyof typeof rangeSpecs) => {
    const spec = rangeSpecs[key];
    return (
      <RangeControl
        {...spec}
        value={prefs[key]}
        onChange={(value) => {
          set(key, value);
          announce(`${spec.label} ${spec.valueText(value)}`, key);
        }}
      />
    );
  };

  const choice = <K extends keyof typeof choiceLabels>(
    key: K,
    label: string,
    options: Array<SegmentOption<KerbPreferences[K]>> = choiceOptions(key),
  ) => (
    <SegmentedControl
      label={label}
      options={options}
      value={prefs[key]}
      onChange={(value) => {
        set(key, value);
        announce(
          `${label} ${(choiceLabels[key] as Record<string, string>)[value]}`,
        );
      }}
    />
  );

  const toggle = (
    key: "underlineLinks" | "focusOnClick",
    label: string,
    hint: string,
  ) => (
    <SwitchControl
      label={label}
      hint={hint}
      checked={prefs[key]}
      onChange={(checked) => {
        set(key, checked);
        announce(`${label} ${checked ? "on" : "off"}`);
      }}
    />
  );

  const dotsOn = theme === "dark" ? "dark" : "light";
  const showsFocusGroup =
    has("focus") || has("layout") || has("motion") || has("links");

  return (
    <div className={styles.content}>
      {onReset && (
        <div className={styles.sheetTools}>
          <Button
            variant="ghost"
            size="small"
            className={styles.reset}
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      )}

      <div className={styles.group}>
        <PresetCards
          label="Start from a preset"
          options={cards}
          value={shownPreset}
          onChange={(name) => {
            applyPreset(name);
            announce(`Preset ${presetLabels[name].label} applied`);
          }}
        />
        {/* Always there, so nothing below moves when it changes to Custom */}
        <p className={controls.hint}>
          Current settings: <strong>{currentName}</strong>
        </p>
      </div>

      {has("reading") && (
        <div className={styles.group}>
          <SectionHeading className={controls.sectionLabel}>
            Reading
          </SectionHeading>
          {range("textSize")}
          {range("lineHeight")}
          {range("wordSpacing")}
          {choice("font", "Font")}
          {choice("measure", "Line length")}
          <SegmentedControl
            label="Background"
            options={backgroundOptions}
            value={theme}
            onChange={(value) => {
              set("theme", value);
              const label = backgroundOptions.find(
                (option) => option.value === value,
              )?.label;
              announce(`Background ${label}`);
            }}
          />
        </div>
      )}

      {showsFocusGroup && (
        <div className={styles.group}>
          <SectionHeading className={controls.sectionLabel}>
            Focus, layout and motion
          </SectionHeading>
          {has("focus") &&
            choice(
              "focusColor",
              "Focus colour",
              choiceOptions("focusColor").map((option) => ({
                ...option,
                swatch: (
                  <span
                    className={controls.dot}
                    style={
                      {
                        "--kerb-swatch": focusColorValues[option.value][dotsOn],
                      } as CSSProperties
                    }
                  />
                ),
              })),
            )}
          {has("focus") && choice("focusWidth", "Focus thickness")}
          {has("layout") && choice("density", "Spacing and target size")}
          {has("motion") && choice("motion", "Motion")}
          {has("links") &&
            toggle(
              "underlineLinks",
              "Always underline links",
              "Links stand out without relying on colour.",
            )}
          {has("focus") &&
            toggle(
              "focusOnClick",
              "Show focus on click too",
              "Helpful with a switch device or when you lose your place.",
            )}
        </div>
      )}

      <CodeFooter />
    </div>
  );
}

/** "Saved on this device", the export code with Copy, and a way to use a code */
function CodeFooter() {
  const { exportCode, importCode } = useKerbPreferences();
  const announce = usePreferenceAnnouncer();
  const [error, setError] = useState<string>();
  const fieldRef = useRef<HTMLInputElement>(null);
  const code = exportCode();
  const codeId = useId();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      announce("Code copied");
    } catch {
      announce("Could not copy. Select the code and copy it yourself");
    }
  };

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const field = fieldRef.current;
    const result = importCode(field?.value ?? "");
    if (result.ok) {
      setError(undefined);
      if (field) field.value = "";
      announce("Preferences applied from the code");
    } else {
      setError(result.reason);
      field?.focus();
    }
  };

  return (
    <div className={styles.footer}>
      <div className={styles.saved}>
        <div className={styles.savedText}>
          <p className={controls.label}>Saved on this device</p>
          <code id={codeId} className={styles.code}>
            {code}
          </code>
        </div>
        <Button
          variant="secondary"
          size="small"
          aria-describedby={codeId}
          onClick={() => void copy()}
        >
          Copy code
        </Button>
      </div>
      <details className={styles.importDetails}>
        <summary className={cx("kerb-focusable", styles.summary)}>
          Use a code from another device
        </summary>
        <form className={styles.importForm} onSubmit={apply} noValidate>
          <TextField
            ref={fieldRef}
            label="Preferences code"
            hint="Starts with kerb1"
            error={error}
            autoComplete="off"
            spellCheck={false}
            onChange={() => setError(undefined)}
          />
          <Button type="submit" variant="secondary">
            Apply code
          </Button>
        </form>
      </details>
    </div>
  );
}

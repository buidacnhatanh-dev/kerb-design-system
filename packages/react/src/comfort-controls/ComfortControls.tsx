import { forwardRef, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../internal/cx";
import {
  RangeControl,
  SegmentedControl,
  usePreferenceAnnouncer,
  useShownTheme,
} from "../internal/PreferenceControls";
import controls from "../internal/PreferenceControls.module.css";
import { backgroundOptions, rangeSpecs } from "../internal/preferenceLabels";
import { useKerbPreferences } from "../provider";
import styles from "./ComfortControls.module.css";

export type ComfortControl =
  "textSize" | "lineHeight" | "letterSpacing" | "background";

export type ComfortControlsProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  /** Content shown next to the controls, in the reader's settings. Optional */
  preview?: ReactNode;
  /** Which controls to show, in this order. Default all four */
  controls?: ComfortControl[];
  /** Default "Reading comfort" */
  title?: string;
  /** Level of the title. Default 2 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

const allControls: ComfortControl[] = [
  "textSize",
  "lineHeight",
  "letterSpacing",
  "background",
];

/** ComfortControls has a narrower text size range than Preferences */
const comfortRanges = {
  textSize: { ...rangeSpecs.textSize, min: 16, max: 24 },
  lineHeight: rangeSpecs.lineHeight,
  letterSpacing: rangeSpecs.letterSpacing,
};

/**
 * The reading part of Preferences, to put next to an article: text size, line
 * spacing, letter spacing and background. It changes the whole app, through
 * the same store as Preferences. `ref` and remaining props go to the `<section>`.
 */
export const ComfortControls = forwardRef<HTMLElement, ComfortControlsProps>(
  function ComfortControls(
    {
      preview,
      controls: shown = allControls,
      title = "Reading comfort",
      headingLevel = 2,
      className,
      ...rest
    },
    ref,
  ) {
    const { prefs, set } = useKerbPreferences();
    const announce = usePreferenceAnnouncer();
    const theme = useShownTheme(prefs.theme);
    const titleId = useId();
    const Heading = `h${headingLevel}` as const;

    const range = (key: keyof typeof comfortRanges) => {
      const spec = comfortRanges[key];
      return (
        <RangeControl
          key={key}
          {...spec}
          value={prefs[key]}
          onChange={(value) => {
            set(key, value);
            announce(`${spec.label} ${spec.valueText(value)}`, key);
          }}
        />
      );
    };

    return (
      <section
        {...rest}
        ref={ref}
        aria-labelledby={titleId}
        className={cx(styles.root, className)}
      >
        <div className={styles.controls}>
          <Heading id={titleId} className={styles.title}>
            {title}
          </Heading>
          {shown.map((control) =>
            control === "background" ? (
              <SegmentedControl
                key={control}
                label="Background (sets the theme)"
                appearance="pills"
                options={backgroundOptions.map((option) => ({
                  ...option,
                  swatch: (
                    <span
                      className={controls.themeSwatch}
                      data-kerb-theme={option.value}
                    />
                  ),
                }))}
                value={theme}
                onChange={(value) => {
                  set("theme", value);
                  const label = backgroundOptions.find(
                    (option) => option.value === value,
                  )?.label;
                  announce(`Background ${label}`);
                }}
              />
            ) : (
              range(control)
            ),
          )}
        </div>
        {preview != null && (
          <div className={styles.preview}>
            <p className={controls.sectionLabel}>Preview</p>
            <div className={styles.previewContent}>{preview}</div>
          </div>
        )}
      </section>
    );
  },
);

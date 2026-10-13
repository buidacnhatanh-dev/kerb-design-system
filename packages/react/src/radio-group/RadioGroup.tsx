import { forwardRef, useId } from "react";
import type { FieldsetHTMLAttributes } from "react";
import choice from "../internal/Choice.module.css";
import { cx } from "../internal/cx";
import { Icon } from "../internal/Icon";
import { useControllableState } from "../internal/useControllableState";
import styles from "./RadioGroup.module.css";

export type RadioOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export type RadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "onChange" | "defaultValue" | "name"
> & {
  /** The group's name, always visible */
  legend: string;
  /** Shared by the radios, and the key the value is submitted under */
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown under the legend with an icon, and read as the group's description */
  error?: string;
  /** Default `vertical` */
  orientation?: "vertical" | "horizontal";
};

/**
 * A fieldset of native radios: one Tab stop, arrow keys move and select.
 * `ref` and remaining props go to the `<fieldset>`.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      legend,
      name,
      options,
      value,
      defaultValue,
      onChange,
      error,
      orientation = "vertical",
      className,
      disabled,
      "aria-describedby": describedBy,
      ...rest
    },
    ref,
  ) {
    const groupId = useId();
    const errorId = error ? `${groupId}-error` : undefined;
    const [selected, select] = useControllableState(
      value,
      defaultValue ?? "",
      onChange,
    );

    return (
      <fieldset
        {...rest}
        ref={ref}
        disabled={disabled}
        className={cx(choice.root, styles.group, className)}
        aria-describedby={
          [describedBy, errorId].filter(Boolean).join(" ") || undefined
        }
      >
        <legend className={styles.legend}>{legend}</legend>
        {/* Not a live region: the form announces a summary on submit */}
        {error && (
          <p className={styles.error} id={errorId}>
            <Icon name="alert" className={styles.errorIcon} />
            <span>{error}</span>
          </p>
        )}
        <div
          className={cx(
            styles.options,
            orientation === "horizontal" && styles.horizontal,
          )}
        >
          {options.map((option, index) => {
            const optionDisabled = disabled || option.disabled;
            const hintId = option.hint ? `${groupId}-hint-${index}` : undefined;
            return (
              <div key={option.value}>
                <label
                  className={cx(
                    choice.row,
                    optionDisabled && choice.rowDisabled,
                  )}
                >
                  <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={selected === option.value}
                    disabled={option.disabled}
                    onChange={() => select(option.value)}
                    className={cx("kerb-focus-proxy", choice.input)}
                    aria-describedby={hintId}
                  />
                  <span className={cx(choice.mark, styles.circle)} />
                  <span className={styles.optionLabel}>{option.label}</span>
                </label>
                {option.hint && (
                  <p className={choice.hint} id={hintId}>
                    {option.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  },
);

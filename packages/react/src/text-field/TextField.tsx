import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "../internal/cx";
import { FieldShell } from "../internal/FieldShell";
import { Icon } from "../internal/Icon";
import styles from "./TextField.module.css";

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> & {
  /** Required and always visible. The placeholder is never the label */
  label: string;
  hint?: string;
  /** When set: `aria-invalid`, a red border, an icon and this text */
  error?: string;
  /** Shows "(optional)" after the label. Required is the default assumption */
  optional?: boolean;
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
  /** Name of the toggle inside a password field. Default "Show password" */
  showPasswordLabel?: string;
};

/**
 * A labelled native input. `ref` and remaining props go to the `<input>`;
 * `className` goes to the outer wrapper, for layout.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      optional,
      type = "text",
      showPasswordLabel = "Show password",
      id,
      className,
      disabled,
      "aria-describedby": describedBy,
      ...rest
    },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";

    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        optional={optional}
        disabled={disabled}
        describedBy={describedBy}
        className={className}
      >
        {(control) => (
          <span className={styles.wrapper}>
            <input
              {...rest}
              {...control}
              ref={ref}
              type={isPassword && revealed ? "text" : type}
              disabled={disabled}
              className={cx(
                "kerb-focusable",
                styles.input,
                isPassword && styles.withToggle,
              )}
            />
            {isPassword && (
              <button
                type="button"
                className={cx("kerb-focusable", styles.toggle)}
                aria-label={showPasswordLabel}
                aria-pressed={revealed}
                aria-controls={control.id}
                aria-disabled={disabled || undefined}
                onClick={() => {
                  if (!disabled) setRevealed((value) => !value);
                }}
              >
                <Icon name={revealed ? "eye-off" : "eye"} />
              </button>
            )}
          </span>
        )}
      </FieldShell>
    );
  },
);

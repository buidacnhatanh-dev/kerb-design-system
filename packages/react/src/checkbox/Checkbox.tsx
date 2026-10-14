import { forwardRef, useEffect, useId, useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import choice from "../internal/Choice.module.css";
import field from "../internal/FieldShell.module.css";
import { cx } from "../internal/cx";
import { Icon } from "../internal/Icon";
import { mergeRefs } from "../internal/mergeRefs";
import styles from "./Checkbox.module.css";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Visible, and clickable: the whole row is the label */
  label: ReactNode;
  hint?: string;
  /** When set: `aria-invalid`, a red box, an icon and this text. For example a required terms checkbox */
  error?: string;
  /** The "mixed" state, for a "select all" that covers some selected items */
  indeterminate?: boolean;
};

/**
 * A native checkbox under a styled box. `ref` and remaining props go to the
 * `<input>`; `className` goes to the outer wrapper, for layout.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      hint,
      error,
      indeterminate = false,
      id,
      className,
      disabled,
      "aria-describedby": describedBy,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    // There is no HTML attribute for it. Set on the element, the browser
    // exposes it to assistive tech as "mixed"
    useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <div className={cx(choice.root, className)}>
        <label className={cx(choice.row, disabled && choice.rowDisabled)}>
          <input
            {...rest}
            ref={mergeRefs(ref, inputRef)}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={cx("kerb-focus-proxy", choice.input)}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [describedBy, hintId, errorId].filter(Boolean).join(" ") ||
              undefined
            }
          />
          <span className={cx(choice.mark, styles.box)}>
            <Icon name="check" className={cx(styles.icon, styles.check)} />
            <Icon name="minus" className={cx(styles.icon, styles.dash)} />
          </span>
          <span>{label}</span>
        </label>
        {hint && (
          <p className={choice.hint} id={hintId}>
            {hint}
          </p>
        )}
        {/* Not a live region: the form announces a summary on submit */}
        {error && (
          <p className={cx(field.error, choice.error)} id={errorId}>
            <Icon name="alert" className={field.errorIcon} />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
);

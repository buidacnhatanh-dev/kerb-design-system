import { useId } from "react";
import type { ReactNode } from "react";
import { cx } from "./cx";
import styles from "./FieldShell.module.css";
import { Icon } from "./Icon";

/** Spread onto the native control so it is wired to the label, hint and error. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

export type FieldShellProps = {
  /** Id for the control. Generated when omitted */
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  /** Extra description ids from the consumer, listed before the hint and error */
  describedBy?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label, hint, control and error row with their id wiring.
 * Shared by TextField, Select and DatePicker.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  disabled,
  describedBy,
  className,
  children,
}: FieldShellProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const description = [describedBy, hintId, errorId].filter(Boolean).join(" ");

  return (
    <div className={cx(styles.field, disabled && styles.disabled, className)}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      {/* Pointer only: a press on the hit area padding around the control counts
          as a press on the control. Keyboard and screen reader users reach the
          control itself, so the wrapper needs no role or key handling */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className={styles.control}
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget || disabled) return;
          // Keep the press from moving focus to the page instead
          event.preventDefault();
          document.getElementById(controlId)?.focus();
        }}
      >
        {children({
          id: controlId,
          "aria-describedby": description || undefined,
          "aria-invalid": error ? true : undefined,
        })}
      </div>
      {/* Not a live region: the form announces a summary on submit */}
      {error && (
        <p className={styles.error} id={errorId}>
          <Icon name="alert" className={styles.errorIcon} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cx } from "../internal/cx";
import { FieldShell } from "../internal/FieldShell";
import { Icon } from "../internal/Icon";
import controlStyles from "../internal/NativeControl.module.css";
import styles from "./Select.module.css";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "multiple" | "size"
> & {
  /** Required and always visible */
  label: string;
  hint?: string;
  /** When set: `aria-invalid`, a red border, an icon and this text */
  error?: string;
  /** The choices. Or pass `<option>` children */
  options?: SelectOption[];
  /** A disabled first option, selected until the person chooses */
  placeholder?: string;
};

/**
 * A labelled native select, so mobile pickers and screen readers work as
 * expected. `ref` and remaining props go to the `<select>`; `className` goes
 * to the outer wrapper, for layout.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      hint,
      error,
      options,
      placeholder,
      id,
      className,
      disabled,
      value,
      defaultValue,
      children,
      "aria-describedby": describedBy,
      ...rest
    },
    ref,
  ) {
    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        disabled={disabled}
        describedBy={describedBy}
        className={className}
      >
        {(field) => (
          <span className={styles.wrapper}>
            <select
              {...rest}
              {...field}
              ref={ref}
              disabled={disabled}
              value={value}
              // Uncontrolled with a placeholder: start on the placeholder
              defaultValue={
                defaultValue ??
                (placeholder && value === undefined ? "" : undefined)
              }
              className={cx(
                "kerb-focusable",
                controlStyles.nativeControl,
                styles.select,
              )}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
              {children}
            </select>
            <Icon name="chevron" className={styles.chevron} />
          </span>
        )}
      </FieldShell>
    );
  },
);

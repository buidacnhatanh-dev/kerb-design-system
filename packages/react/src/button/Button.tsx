import { forwardRef, useEffect } from "react";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useAnnouncer } from "../announcer";
import { cx } from "../internal/cx";
import { Tooltip } from "../tooltip";
import styles from "./Button.module.css";

type ButtonOwnProps = {
  /** Default `primary` */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** `small` is 40px tall and keeps a 44px hit area. Default `default` */
  size?: "default" | "small";
  /** Sets `aria-busy`, keeps the label, shows a spinner and ignores clicks */
  loading?: boolean;
  /** Announced when loading starts. Default "Loading" */
  loadingLabel?: string;
  /** Why the button is disabled. Shown on hover and focus and linked with `aria-describedby` */
  disabledReason?: string;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
};

type LabelledProps = { children: ReactNode };

/** A button with no text needs a name from `aria-label` or `aria-labelledby` */
type IconOnlyProps = { children?: never } & (
  { "aria-label": string } | { "aria-labelledby": string }
);

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> &
  ButtonOwnProps &
  (LabelledProps | IconOnlyProps);

/**
 * A native button. `disabled` becomes `aria-disabled`, so the button stays in
 * the Tab order and people can find out why it cannot be used.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "default",
      loading = false,
      loadingLabel = "Loading",
      disabledReason,
      iconStart,
      iconEnd,
      disabled,
      "aria-disabled": ariaDisabled,
      "aria-describedby": describedBy,
      className,
      children,
      onClick,
      ...rest
    },
    ref,
  ) {
    const { announce } = useAnnouncer();

    const isDisabled =
      disabled === true || ariaDisabled === true || ariaDisabled === "true";
    const reason = isDisabled ? disabledReason : undefined;

    useEffect(() => {
      if (loading) announce(loadingLabel);
    }, [loading, loadingLabel, announce]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || loading) {
        // Also stops a submit button from submitting its form
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    const button = (
      <button
        type="button"
        {...rest}
        ref={ref}
        className={cx(
          "kerb-focusable",
          styles.button,
          styles[variant],
          size === "small" && styles.small,
          children == null && styles.iconOnly,
          className,
        )}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        aria-describedby={describedBy}
        onClick={handleClick}
      >
        {loading ? (
          <svg
            className={styles.spinner}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        ) : (
          iconStart && <span className={styles.icon}>{iconStart}</span>
        )}
        {children != null && <span className={styles.label}>{children}</span>}
        {iconEnd && <span className={styles.icon}>{iconEnd}</span>}
      </button>
    );

    // Shown on hover and focus, and linked as the description
    return reason ? <Tooltip content={reason}>{button}</Tooltip> : button;
  },
);

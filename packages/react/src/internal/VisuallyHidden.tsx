import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./VisuallyHidden.module.css";

export type VisuallyHiddenProps = HTMLAttributes<HTMLElement> & {
  as?: "span" | "div";
};

/** Content for screen readers only. Used for live regions and hidden native inputs. */
export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  function VisuallyHidden({ as: Tag = "span", className, ...rest }, ref) {
    return (
      <Tag
        {...rest}
        ref={ref as never}
        className={cx(styles.visuallyHidden, className)}
      />
    );
  },
);

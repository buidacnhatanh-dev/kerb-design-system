import type { ReactNode } from "react";

/**
 * A table that may scroll sideways on a narrow screen. The wrapper is a named,
 * focusable region, so the table can be scrolled from the keyboard.
 */
export function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-scroll kerb-focusable" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

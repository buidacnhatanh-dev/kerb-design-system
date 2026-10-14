import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from "react";
import { cx } from "../internal/cx";
import { mergeRefs } from "../internal/mergeRefs";
import { useControllableState } from "../internal/useControllableState";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import styles from "./Tabs.module.css";

type TabsContextValue = {
  baseId: string;
  value: string;
  select: (value: string) => void;
  activation: "automatic" | "manual";
  label: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`<${part}> must be used inside <Tabs>.`);
  return context;
}

/** Ids are built from values, which may contain spaces */
const idPart = (value: string) => value.replace(/\s+/g, "-");

export type TabsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * `automatic`: arrow keys select. `manual`: arrow keys only move focus and
   * Enter or Space selects (for panels that load data). Default `automatic`
   */
  activation?: "automatic" | "manual";
  /** Names the tab list */
  label: string;
};

/** Tabs with a roving tabindex: one Tab stop for the list, arrow keys inside. */
const TabsRoot = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value,
    defaultValue = "",
    onValueChange,
    activation = "automatic",
    label,
    className,
    children,
    ...rest
  },
  ref,
) {
  const baseId = useId();
  const [selected, select] = useControllableState(
    value,
    defaultValue,
    onValueChange,
  );

  return (
    <TabsContext.Provider
      value={{ baseId, value: selected, select, activation, label }}
    >
      <div {...rest} ref={ref} className={cx(styles.tabs, className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

function TabList({
  className,
  onKeyDown,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "role">) {
  const { label, select, activation } = useTabs("Tabs.List");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    tab.focus();
    if (activation === "automatic") select(tab.dataset.value ?? "");
  };

  return (
    // The tabs inside are the interactive elements; arrow keys move between them
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      {...rest}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      className={cx(styles.list, className)}
      onKeyDown={handleKeyDown}
    />
  );
}

export type TabProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "role"
> & {
  value: string;
  children: ReactNode;
};

function Tab({ value, className, children, onClick, ...rest }: TabProps) {
  const { baseId, value: selected, select } = useTabs("Tabs.Tab");
  const isSelected = value === selected;

  return (
    <button
      type="button"
      {...rest}
      role="tab"
      id={`${baseId}-tab-${idPart(value)}`}
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${idPart(value)}`}
      // Roving tabindex: only the selected tab is a Tab stop
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      data-label={typeof children === "string" ? children : undefined}
      className={cx("kerb-focusable", styles.tab, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) select(value);
      }}
      // Enter and Space select through the native click in both modes
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
}

export type TabPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  value: string;
};

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, className, ...rest },
  ref,
) {
  const { baseId, value: selected } = useTabs("Tabs.Panel");
  const panelRef = useRef<HTMLDivElement>(null);
  const [hasFocusable, setHasFocusable] = useState(false);
  const isSelected = value === selected;

  // A panel with nothing focusable inside is itself the next Tab stop
  useIsomorphicLayoutEffect(() => {
    const found = !!panelRef.current?.querySelector(focusableSelector);
    if (found !== hasFocusable) setHasFocusable(found);
  });

  return (
    <div
      {...rest}
      ref={mergeRefs(ref, panelRef)}
      role="tabpanel"
      id={`${baseId}-panel-${idPart(value)}`}
      aria-labelledby={`${baseId}-tab-${idPart(value)}`}
      tabIndex={hasFocusable ? undefined : 0}
      hidden={!isSelected}
      className={cx("kerb-focusable", styles.panel, className)}
    />
  );
});

export const Tabs = Object.assign(TabsRoot, {
  List: TabList,
  Tab,
  Panel: TabPanel,
});

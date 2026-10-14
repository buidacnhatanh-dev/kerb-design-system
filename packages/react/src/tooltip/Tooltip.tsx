import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent,
  PointerEvent,
  ReactElement,
  Ref,
} from "react";
import { cx } from "../internal/cx";
import { mergeRefs } from "../internal/mergeRefs";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import styles from "./Tooltip.module.css";

/** Hover has to rest this long before the tooltip shows. Focus shows it at once */
const HOVER_DELAY_MS = 300;
/** Time to cross the gap between trigger and tooltip without it closing */
const LEAVE_GRACE_MS = 150;
/** Gap between trigger and tooltip, and the closest it gets to the viewport edge */
const GAP_PX = 8;

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  "aria-describedby"?: string;
  style?: CSSProperties;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

export type TooltipProps = {
  /** Plain text only. A tooltip is for extra hints, never essential or interactive content */
  content: string;
  /** One element that takes a ref and focus, such as a Button */
  children: ReactElement;
  /** Shown from the start, until the pointer leaves, focus leaves or Esc. For demos and docs */
  defaultOpen?: boolean;
};

const supportsAnchor = () =>
  typeof CSS !== "undefined" && CSS.supports("anchor-name: --a");

function childRef(child: ReactElement): Ref<HTMLElement> | undefined {
  // React 19 passes ref as a prop. React 18 keeps it on the element
  const props = child.props as { ref?: Ref<HTMLElement> };
  if ("ref" in props) return props.ref;
  return (child as unknown as { ref?: Ref<HTMLElement> }).ref;
}

/**
 * A short text hint for a control, shown on hover and keyboard focus (WCAG
 * 1.4.13: dismissable with Esc, hoverable, persistent). Linked to the trigger
 * with `aria-describedby`.
 */
export function Tooltip({
  content,
  children,
  defaultOpen = false,
}: TooltipProps) {
  const id = useId();
  const anchorName = `--kerb-tooltip-${id.replace(/[^\w-]/g, "")}`;
  const triggerRef = useRef<HTMLElement | null>(null);
  const setTrigger = useCallback((element: HTMLElement | null) => {
    triggerRef.current = element;
  }, []);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(defaultOpen);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [anchored] = useState(supportsAnchor);

  const show = useCallback((delay: number) => {
    clearTimeout(timer.current);
    if (delay === 0) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  }, []);

  const hide = useCallback((delay: number) => {
    clearTimeout(timer.current);
    if (delay === 0) setOpen(false);
    else timer.current = setTimeout(() => setOpen(false), delay);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Into the top layer, and placed: above the trigger, below when there is no room
  useIsomorphicLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    if (!open || !tooltip || !trigger) return;

    try {
      tooltip.showPopover();
    } catch {
      // No popover support: the fixed position below still shows it
    }

    let last = "";
    const place = () => {
      const target = trigger.getBoundingClientRect();
      // Only when the trigger moved (scroll, resize, fonts loading, layout changes)
      const key = `${target.top},${target.left},${target.width},${target.height}`;
      if (key === last) return;
      last = key;

      if (!anchored) {
        const own = tooltip.getBoundingClientRect();
        const above = target.top - own.height - GAP_PX;
        const top = above >= GAP_PX ? above : target.bottom + GAP_PX;
        const left = Math.min(
          Math.max(GAP_PX, target.left + target.width / 2 - own.width / 2),
          window.innerWidth - own.width - GAP_PX,
        );
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }
      // Where it ended up decides which way the pointer faces, and where along the edge
      const own = tooltip.getBoundingClientRect();
      setPlacement(own.top < target.top ? "top" : "bottom");
      const arrow = target.left + target.width / 2 - own.left;
      tooltip.style.setProperty(
        "--kerb-tooltip-arrow",
        `${Math.min(Math.max(arrow, 8), own.width - 8)}px`,
      );
    };

    // Checked every frame while open: a tooltip is open briefly, and this is
    // one rectangle read per frame
    let frame = 0;
    const loop = () => {
      place();
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      try {
        tooltip.hidePopover();
      } catch {
        // Not shown as a popover
      }
    };
  }, [open, anchored]);

  // Esc hides it without moving focus, wherever focus is. It is caught first,
  // so a dialog around the trigger does not close as well
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      hide(0);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, hide]);

  if (!isValidElement<TriggerProps>(children)) return children;
  const own = children.props;

  const trigger = cloneElement(children, {
    ref: mergeRefs(childRef(children), setTrigger),
    "aria-describedby":
      [own["aria-describedby"], id].filter(Boolean).join(" ") || undefined,
    style: anchored
      ? ({ ...own.style, anchorName } as CSSProperties)
      : own.style,
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      own.onPointerEnter?.(event);
      if (event.pointerType === "mouse") show(open ? 0 : HOVER_DELAY_MS);
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      own.onPointerLeave?.(event);
      if (event.pointerType === "mouse" && !triggerHasFocus()) {
        hide(LEAVE_GRACE_MS);
      }
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      own.onFocus?.(event);
      // Keyboard focus only. A click already showed it through hover
      if (event.currentTarget.matches(":focus-visible")) show(0);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      own.onBlur?.(event);
      hide(0);
    },
  });

  function triggerHasFocus() {
    const trigger = triggerRef.current;
    return (
      !!trigger &&
      trigger === document.activeElement &&
      trigger.matches(":focus-visible")
    );
  }

  return (
    <>
      {trigger}
      <div
        ref={tooltipRef}
        id={id}
        role="tooltip"
        popover="manual"
        data-placement={placement}
        className={cx(
          styles.tooltip,
          open && styles.open,
          anchored && styles.anchored,
        )}
        style={
          anchored
            ? ({ "--kerb-tooltip-anchor": anchorName } as CSSProperties)
            : undefined
        }
        // Hoverable: the pointer can move onto the tooltip without it closing
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => {
          if (!triggerHasFocus()) hide(LEAVE_GRACE_MS);
        }}
      >
        {content}
      </div>
    </>
  );
}

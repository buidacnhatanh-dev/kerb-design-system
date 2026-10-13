import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

type Remembered = { open: boolean; element: HTMLElement | null };

function focusedElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  return active instanceof HTMLElement && active !== document.body
    ? active
    : null;
}

/**
 * Remembers the focused element when `open` becomes true and gives focus back
 * to it when `open` becomes false or the component unmounts.
 *
 * The element is read while rendering, before the opened content can take
 * focus for itself (through `autoFocus` or a ref, which both run before effects).
 */
export function useFocusReturn(open: boolean): void {
  const [remembered, setRemembered] = useState<Remembered>(() => ({
    open,
    element: open ? focusedElement() : null,
  }));
  if (remembered.open !== open) {
    setRemembered({ open, element: open ? focusedElement() : null });
  }
  const { element } = remembered;
  const previous = useRef<HTMLElement | null>(null);

  // Focus goes back in an effect body, not a cleanup: React restores the
  // element that had focus before a commit, which would undo a cleanup's focus()
  useIsomorphicLayoutEffect(() => {
    if (open) {
      previous.current = element;
      return;
    }
    const target = previous.current;
    previous.current = null;
    if (target?.isConnected) target.focus();
    // `element` is left out on purpose: it is fixed for as long as `open` stays true
  }, [open]);

  // Unmounted while open
  useIsomorphicLayoutEffect(
    () => () => {
      if (previous.current?.isConnected) previous.current.focus();
    },
    [],
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { isDev } from "../internal/env";
import { VisuallyHidden } from "../internal/VisuallyHidden";

export type AnnounceUrgency = "polite" | "assertive";

export type AnnounceOptions = {
  /** `polite` waits for the screen reader to finish, `assertive` interrupts. Default `polite` */
  urgency?: AnnounceUrgency;
};

export type Announce = (message: string, options?: AnnounceOptions) => void;

/** An identical message inside this window is dropped */
const DUPLICATE_WINDOW_MS = 1000;
/** Regions are emptied after this long so stale text is not read with the virtual cursor */
const CLEAR_AFTER_MS = 7000;

const AnnouncerContext = createContext<Announce | null>(null);

let warnedForeignRegion = false;
let warnedNoProvider = false;

type Pending = { frame?: number; timer?: ReturnType<typeof setTimeout> };

/**
 * Renders the two live regions and provides `announce`. Rendered once by
 * `KerbProvider`, so the app never has competing live regions.
 */
export function AnnouncerProvider({ children }: { children?: ReactNode }) {
  const politeRef = useRef<HTMLElement>(null);
  const assertiveRef = useRef<HTMLElement>(null);
  const last = useRef({ text: "", time: Number.NEGATIVE_INFINITY });
  const pending = useRef<Record<AnnounceUrgency, Pending>>({
    polite: {},
    assertive: {},
  });

  const announce = useCallback<Announce>((message, options) => {
    const text = message.trim();
    if (!text) return;

    const now = Date.now();
    if (
      text === last.current.text &&
      now - last.current.time < DUPLICATE_WINDOW_MS
    ) {
      return;
    }
    last.current = { text, time: now };

    const urgency = options?.urgency ?? "polite";
    const region = (urgency === "assertive" ? assertiveRef : politeRef).current;
    if (!region) return;

    const slot = pending.current[urgency];
    if (slot.frame !== undefined) cancelAnimationFrame(slot.frame);
    clearTimeout(slot.timer);

    // Clear first, then set on the next frame, so a repeated message is a real change
    region.textContent = "";
    slot.frame = requestAnimationFrame(() => {
      slot.frame = undefined;
      region.textContent = text;
      slot.timer = setTimeout(() => {
        region.textContent = "";
      }, CLEAR_AFTER_MS);
    });
  }, []);

  useEffect(() => {
    const slots = pending.current;
    return () => {
      for (const slot of Object.values(slots)) {
        if (slot.frame !== undefined) cancelAnimationFrame(slot.frame);
        clearTimeout(slot.timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDev || warnedForeignRegion) return;
    if (typeof MutationObserver === "undefined") return;

    const check = () => {
      const foreign = document.querySelector(
        '[aria-live]:not([aria-live="off"]):not([data-kerb-announcer])',
      );
      if (!foreign || warnedForeignRegion) return;
      warnedForeignRegion = true;
      observer.disconnect();
      console.warn(
        "Kerb: found an aria-live region outside the Kerb Announcer. Competing live regions can talk over each other. Use `useAnnouncer().announce()` instead.",
        foreign,
      );
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-live"],
    });
    check();
    return () => observer.disconnect();
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      {/* In the DOM, empty, from the first render so screen readers register them */}
      <VisuallyHidden
        as="div"
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        data-kerb-announcer="polite"
      />
      <VisuallyHidden
        as="div"
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        data-kerb-announcer="assertive"
      />
    </AnnouncerContext.Provider>
  );
}

const announceNowhere: Announce = () => {
  if (isDev && !warnedNoProvider) {
    warnedNoProvider = true;
    console.warn(
      "Kerb: `announce()` was called outside <KerbProvider>, so nothing was announced. Wrap the app in <KerbProvider>.",
    );
  }
};

/** Sends a message to screen readers through the shared live regions. */
export function useAnnouncer(): { announce: Announce } {
  const announce = useContext(AnnouncerContext) ?? announceNowhere;
  return { announce };
}

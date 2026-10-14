import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAnnouncer } from "../announcer";
import { Button } from "../button";
import { cx } from "../internal/cx";
import { isDev } from "../internal/env";
import { Icon } from "../internal/Icon";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import styles from "./Toast.module.css";

export type ToastTone = "success" | "info" | "error";

export type ToastOptions = {
  tone: ToastTone;
  title: string;
  body?: string;
  action?: { label: string; onAction: () => void };
  /**
   * ms before it closes on its own. Default 6000. Error toasts and toasts with
   * an action stay until dismissed, unless a duration is given explicitly
   * (an action toast only: errors always stay)
   */
  duration?: number;
};

export type ToastApi = {
  /** Shows a toast and returns its id */
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
};

type ToastEntry = ToastOptions & { id: string };

const DEFAULT_DURATION_MS = 6000;
/** Older toasts wait until one of the visible ones is dismissed */
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastApi | null>(null);

const icons = { success: "check", info: "info", error: "cross" } as const;

let warnedNoProvider = false;

/** How long a toast stays on its own, or null when it stays until dismissed */
function autoDismissAfter(toast: ToastOptions): number | null {
  if (toast.tone === "error") return null;
  if (toast.action && toast.duration === undefined) return null;
  return toast.duration ?? DEFAULT_DURATION_MS;
}

/** People need time to read, so nothing closes on its own when motion is reduced or off */
function timersAllowed(): boolean {
  const level = document.documentElement.getAttribute("data-kerb-motion");
  if (level === "reduced" || level === "off") return false;
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

/**
 * Owns the toast list and renders the one toast region. Rendered by
 * `KerbProvider`, inside the Announcer.
 */
export function ToastProvider({ children }: { children?: ReactNode }) {
  const { announce } = useAnnouncer();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const count = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      count.current += 1;
      const id = `kerb-toast-${count.current}`;
      setToasts((list) => [...list, { ...options, id }]);

      // The toast itself is not a live region, so this is the only announcement
      const parts = [options.title, options.body];
      if (options.action) {
        parts.push(`Press F6 to reach ${options.action.label}.`);
      }
      announce(
        parts
          .filter(Boolean)
          .map((part) => (/[.!?]$/.test(part!) ? part : `${part}.`))
          .join(" "),
        { urgency: options.tone === "error" ? "assertive" : "polite" },
      );
      return id;
    },
    [announce],
  );

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastRegion toasts={toasts.slice(-MAX_VISIBLE)} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastRegion({
  toasts,
  dismiss,
}: {
  toasts: ToastEntry[];
  dismiss: (id: string) => void;
}) {
  const regionRef = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const hasToasts = toasts.length > 0;

  // F6 moves focus to the toasts and back. Only while there are toasts:
  // otherwise F6 keeps its browser meaning
  useEffect(() => {
    if (!hasToasts) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "F6" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const region = regionRef.current;
      if (!region) return;
      event.preventDefault();

      if (region.contains(document.activeElement)) {
        const target = returnTo.current;
        returnTo.current = null;
        if (target?.isConnected) target.focus();
        else (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      const active = document.activeElement;
      returnTo.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      // The newest toast's first button: its action, or its dismiss button
      const buttons = region.querySelectorAll<HTMLElement>("button");
      const newest = region.querySelector<HTMLElement>("li:last-child button");
      (newest ?? buttons[0] ?? region).focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hasToasts]);

  // Focus leaving with the last toast goes back to where it came from
  useEffect(() => {
    if (hasToasts || !returnTo.current) return;
    if (returnTo.current.isConnected) returnTo.current.focus();
    returnTo.current = null;
  }, [hasToasts]);

  if (!hasToasts) return null;

  return (
    <section
      ref={regionRef}
      className={styles.region}
      aria-label="Notifications"
      tabIndex={-1}
    >
      <ol className={styles.stack} data-kerb-theme="dark">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => {
              // Keep focus in the region when a focused toast goes away
              const region = regionRef.current;
              const hadFocus = region?.contains(document.activeElement);
              dismiss(toast.id);
              if (hadFocus) {
                requestAnimationFrame(() => {
                  const next = region?.querySelector<HTMLElement>("button");
                  if (next) next.focus();
                });
              }
            }}
          />
        ))}
      </ol>
    </section>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: () => void;
}) {
  const [paused, setPaused] = useState({ hover: false, focus: false });
  const remaining = useRef(autoDismissAfter(toast));
  const dismissRef = useRef(onDismiss);
  useIsomorphicLayoutEffect(() => {
    dismissRef.current = onDismiss;
  });

  const isPaused = paused.hover || paused.focus;

  // Counts down only while visible and not hovered or focused
  useEffect(() => {
    if (remaining.current === null || isPaused || !timersAllowed()) return;
    const started = Date.now();
    const timer = setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      if (remaining.current !== null) {
        remaining.current = Math.max(
          0,
          remaining.current - (Date.now() - started),
        );
      }
    };
  }, [isPaused]);

  return (
    // The handlers only pause the timer while someone is reading; nothing is activated
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      className={cx(styles.toast, styles[toast.tone])}
      onPointerEnter={() => setPaused((state) => ({ ...state, hover: true }))}
      onPointerLeave={() => setPaused((state) => ({ ...state, hover: false }))}
      onFocus={() => setPaused((state) => ({ ...state, focus: true }))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused((state) => ({ ...state, focus: false }));
        }
      }}
    >
      <span className={styles.icon}>
        <Icon name={icons[toast.tone]} />
      </span>
      <div className={styles.text}>
        <p className={styles.title}>{toast.title}</p>
        {toast.body && <p className={styles.body}>{toast.body}</p>}
      </div>
      <div className={styles.actions}>
        {toast.action && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              toast.action?.onAction();
              onDismiss();
            }}
          >
            {toast.action.label}
          </Button>
        )}
        <Button
          variant="ghost"
          size="small"
          className={styles.dismiss}
          aria-label="Dismiss notification"
          iconStart={<Icon name="cross" />}
          onClick={onDismiss}
        />
      </div>
    </li>
  );
}

const toastNowhere: ToastApi = {
  show: () => {
    if (isDev && !warnedNoProvider) {
      warnedNoProvider = true;
      console.warn(
        "Kerb: `toast.show()` was called outside <KerbProvider>, so nothing was shown. Wrap the app in <KerbProvider>.",
      );
    }
    return "";
  },
  dismiss: () => {},
};

/** Shows short messages in the shared toast region. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? toastNowhere;
}

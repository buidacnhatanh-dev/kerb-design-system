import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useAnnouncer } from "../announcer";
import { Button } from "../button";
import type { ButtonProps } from "../button";
import { cx } from "../internal/cx";
import { Icon } from "../internal/Icon";
import { mergeRefs } from "../internal/mergeRefs";
import { useControllableState } from "../internal/useControllableState";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import styles from "./Dialog.module.css";

export type DialogProps = {
  /** Required. Becomes the accessible name */
  title: string;
  /** Read after the title by screen readers */
  description?: string;
  /** Element that opens the dialog. Focus returns here */
  trigger?: ReactElement;
  /** Where focus goes on open. Default "cancel" for danger dialogs, "first" otherwise */
  initialFocus?: "first" | "cancel" | RefObject<HTMLElement | null>;
  /** Controlled open state */
  open?: boolean;
  defaultOpen?: boolean;
  /** Called on open, close and Escape */
  onOpenChange?: (open: boolean) => void;
  /** `danger` never focuses the destructive button first. Default `default` */
  tone?: "default" | "danger";
  /** Close on a click on the backdrop. Default true, false for danger dialogs */
  dismissable?: boolean;
  /** Name of the close button in the corner. Default "Close" */
  closeLabel?: string;
  /** Announced when focus cannot go back to where it was. Default "Dialog closed" */
  closedMessage?: string;
  children?: ReactNode;
};

type DialogContextValue = { close: () => void };
const DialogContext = createContext<DialogContextValue | null>(null);

const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (element) =>
      !element.closest("[inert]") &&
      // Rendered and visible. Where checkVisibility is missing, assume it is
      (typeof element.checkVisibility !== "function" ||
        element.checkVisibility({ visibilityProperty: true })),
  );
}

const subscribeNothing = () => () => {};

function focusedElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  return active instanceof HTMLElement && active !== document.body
    ? active
    : null;
}

function childRef(child: ReactElement): unknown {
  const props = child.props as { ref?: unknown };
  if ("ref" in props) return props.ref;
  return (child as unknown as { ref?: unknown }).ref;
}

/** Where focus goes when a dialog closes, best first */
function returnFocus(
  remembered: HTMLElement | null,
  fallback: {
    trigger: HTMLElement | null;
    announce: (message: string) => void;
    closedMessage: string;
  },
) {
  if (remembered?.isConnected) {
    remembered.focus();
  } else if (fallback.trigger?.isConnected) {
    fallback.trigger.focus();
  } else {
    // Nothing left to return to: the top of the page, and say what happened
    (document.activeElement as HTMLElement | null)?.blur?.();
    fallback.announce(fallback.closedMessage);
  }
}

/** How many dialogs are open, so the page is locked once and unlocked once */
let openCount = 0;
let savedHtmlStyle: { overflow: string; gutter: string } | null = null;

function lockPage() {
  openCount += 1;
  if (openCount > 1) return;
  const html = document.documentElement;
  savedHtmlStyle = {
    overflow: html.style.overflow,
    gutter: html.style.scrollbarGutter,
  };
  html.style.scrollbarGutter = "stable";
  html.style.overflow = "hidden";
  // showModal() already makes the page inert in modern browsers. This covers
  // older ones and stops the VoiceOver virtual cursor from leaving the dialog
  document
    .querySelectorAll("[data-kerb-app-root]")
    .forEach((root) => root.setAttribute("inert", ""));
}

function unlockPage() {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = savedHtmlStyle?.overflow ?? "";
  html.style.scrollbarGutter = savedHtmlStyle?.gutter ?? "";
  savedHtmlStyle = null;
  document
    .querySelectorAll("[data-kerb-app-root]")
    .forEach((root) => root.removeAttribute("inert"));
}

/**
 * A modal dialog on the native `<dialog>` element. Focus moves in, stays
 * inside, and goes back to where it was on close.
 */
export function Dialog({
  title,
  description,
  trigger,
  initialFocus,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  tone = "default",
  dismissable = tone !== "danger",
  closeLabel = "Close",
  closedMessage = "Dialog closed",
  children,
}: DialogProps) {
  const [open, setOpen] = useControllableState(
    openProp,
    defaultOpen,
    onOpenChange,
  );
  const { announce } = useAnnouncer();
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  // The trigger, as the fallback for focus on close
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  // Portals need the document, which only exists after hydration
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  // The focused element is read while rendering the opening, before anything
  // inside the dialog can take focus (autoFocus and refs run before effects)
  const [remembered, setRemembered] = useState<{
    open: boolean;
    element: HTMLElement | null;
  }>(() => ({ open, element: open ? focusedElement() : null }));
  if (remembered.open !== open) {
    setRemembered({
      open,
      element: open ? focusedElement() : remembered.element,
    });
  }
  const rememberedElement = remembered.element;

  // Open: lock the page, show it modally, move focus in
  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    lockPage();
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    const panel =
      dialog.querySelector<HTMLElement>(`.${styles.panel}`) ?? dialog;
    const cancel = dialog.querySelector<HTMLElement>(
      "[data-kerb-dialog-cancel]",
    );
    const confirm = dialog.querySelector<HTMLElement>(
      "[data-kerb-dialog-confirm]",
    );
    const close = dialog.querySelector<HTMLElement>("[data-kerb-dialog-close]");
    const mode = initialFocus ?? (tone === "danger" ? "cancel" : "first");

    let target: HTMLElement | null | undefined;
    if (mode === "cancel") {
      target = cancel;
    } else if (mode === "first") {
      // The first thing to act on, not the close button in the corner
      target = focusables(panel).find((element) => element !== close);
    } else {
      target = mode.current;
    }
    // A danger dialog never starts on the destructive button
    if (tone === "danger" && target && target === confirm) target = cancel;
    (target ?? cancel ?? close ?? dialog).focus();

    return () => {
      unlockPage();
    };
    // Focus moves in once per opening, not when props change while open
  }, [open]);

  // What focus return needs, kept current for the unmount case below
  const returnTo = useRef({ trigger: triggerNode, announce, closedMessage });
  useIsomorphicLayoutEffect(() => {
    returnTo.current = { trigger: triggerNode, announce, closedMessage };
  });

  // Closed: focus goes back to where it was, else to the trigger, else to the
  // top of the page with an announcement. In an effect body, not a cleanup:
  // React puts focus back after a commit and would undo it
  useIsomorphicLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      restoreRef.current = rememberedElement;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const remembered = restoreRef.current;
    restoreRef.current = null;
    returnFocus(remembered, returnTo.current);
  }, [open]);

  // Unmounted while open, often together with its trigger (deleting the row
  // that held both). Run once the commit is over, when it is clear what is
  // still in the document
  useEffect(() => {
    const state = returnTo;
    return () => {
      if (!wasOpen.current) return;
      const remembered = restoreRef.current;
      const { current } = state;
      queueMicrotask(() => returnFocus(remembered, current));
    };
  }, []);

  const close = () => setOpen(false);

  // Tab and Shift+Tab wrap inside the dialog
  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const items = focusables(dialogRef.current);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (
      event.shiftKey &&
      (active === first || !dialogRef.current.contains(active))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last || !dialogRef.current.contains(active))
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  // Body content and the action buttons go to their own places, actions last
  const body: ReactNode[] = [];
  const actions: ReactElement[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type === DialogCancel || child.type === DialogConfirm)
    ) {
      actions.push(child);
    } else if (child != null && child !== false) {
      body.push(child);
    }
  });
  actions.sort(
    (a, b) =>
      Number(a.type === DialogConfirm) - Number(b.type === DialogConfirm),
  );

  const triggerElement =
    trigger &&
    isValidElement<{ onClick?: (event: MouseEvent) => void }>(trigger)
      ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
          ref: mergeRefs(childRef(trigger) as never, setTriggerNode),
          "aria-haspopup": "dialog",
          onClick: (event: MouseEvent) => {
            (
              trigger.props as { onClick?: (event: MouseEvent) => void }
            ).onClick?.(event);
            if (!event.defaultPrevented) setOpen(true);
          },
        })
      : null;

  const dialog = open ? (
    <DialogContext.Provider value={{ close }}>
      {/* The native dialog handles Escape (cancel) and the backdrop click (a
          click on the dialog element itself, outside the panel) */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-tone={tone}
        onKeyDown={onKeyDown}
        onCancel={(event) => {
          // Escape: React decides, so the open state never disagrees with the element
          event.preventDefault();
          close();
        }}
        onClose={() => {
          // Closed by the browser anyway (a second Escape): follow it
          if (open) close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && dismissable) close();
        }}
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <Button
              variant="ghost"
              size="small"
              className={styles.close}
              aria-label={closeLabel}
              iconStart={<Icon name="cross" />}
              data-kerb-dialog-close=""
              onClick={close}
            />
          </div>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
          {body.length > 0 && <div className={styles.body}>{body}</div>}
          {actions.length > 0 && (
            <div className={styles.actions}>{actions}</div>
          )}
        </div>
      </dialog>
    </DialogContext.Provider>
  ) : null;

  return (
    <>
      {triggerElement}
      {/* Outside the app root, which is made inert while the dialog is open */}
      {mounted && dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}

function useDialogContext(part: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) throw new Error(`<${part}> must be used inside <Dialog>.`);
  return context;
}

/** Extra content between the description and the actions. */
function DialogBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx(styles.body, className)} />;
}

/** Closes the dialog. The safe choice, so danger dialogs start here */
const DialogCancel = forwardRef<HTMLButtonElement, ButtonProps>(
  function DialogCancel({ onClick, ...rest }, ref) {
    const { close } = useDialogContext("Dialog.Cancel");
    return (
      <Button
        variant="secondary"
        {...(rest as ButtonProps)}
        ref={ref}
        data-kerb-dialog-cancel=""
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) close();
        }}
      />
    );
  },
);

/**
 * The main action. Runs `onClick`, then closes the dialog, unless `onClick`
 * called `event.preventDefault()` (to keep it open, for example to show an error)
 */
const DialogConfirm = forwardRef<HTMLButtonElement, ButtonProps>(
  function DialogConfirm({ onClick, ...rest }, ref) {
    const { close } = useDialogContext("Dialog.Confirm");
    return (
      <Button
        {...(rest as ButtonProps)}
        ref={ref}
        data-kerb-dialog-confirm=""
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) close();
        }}
      />
    );
  },
);

Dialog.Body = DialogBody;
Dialog.Cancel = DialogCancel;
Dialog.Confirm = DialogConfirm;

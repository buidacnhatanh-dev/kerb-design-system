import {
  CalendarDate,
  GregorianCalendar,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfWeek,
} from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
} from "react";
import { I18nProvider } from "react-aria/I18nProvider";
import {
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
} from "react-aria/useCalendar";
import { useCalendarState } from "react-stately/useCalendarState";
import type { CalendarState } from "react-stately/useCalendarState";
import { useAnnouncer } from "../announcer";
import { Button } from "../button";
import { composeEventHandlers } from "../internal/composeEventHandlers";
import { cx } from "../internal/cx";
import { FieldShell } from "../internal/FieldShell";
import { Icon } from "../internal/Icon";
import { mergeRefs } from "../internal/mergeRefs";
import controlStyles from "../internal/NativeControl.module.css";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import { getDateFormat, parseDateText, toCalendarDate } from "./dateFormat";
import type { ParseResult } from "./dateFormat";
import styles from "./DatePicker.module.css";

/** Every string the date picker writes itself. Override them for other languages */
export type DatePickerMessages = {
  /** Name of the calendar button. Default "Choose date" */
  chooseDate: string;
  previousMonth: string;
  nextMonth: string;
  /** The default hint, given the pattern such as "DD.MM.YYYY" */
  hint: (pattern: string) => string;
  /** Shown on blur when the text is not a real date */
  invalid: (pattern: string) => string;
  /** Shown on blur when the date is before `minValue`, given it formatted */
  tooEarly: (min: string) => string;
  /** Shown on blur when the date is after `maxValue`, given it formatted */
  tooLate: (max: string) => string;
  /** Shown on blur when `isDateUnavailable` rules the date out */
  unavailable: (date: string) => string;
};

const defaultMessages: DatePickerMessages = {
  chooseDate: "Choose date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  hint: (pattern) => `Format ${pattern}`,
  invalid: (pattern) => `Enter a real date in the format ${pattern}`,
  tooEarly: (min) => `Enter a date on or after ${min}`,
  tooLate: (max) => `Enter a date on or before ${max}`,
  unavailable: (date) => `${date} is not available. Choose another date`,
};

export type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type" | "size" | "min" | "max"
> & {
  /** Required and always visible */
  label: string;
  /** Default: the format people type, such as "Format DD.MM.YYYY" */
  hint?: string;
  /** When set: `aria-invalid`, a red border, an icon and this text. Wins over the picker's own checks */
  error?: string;
  /** Shows "(optional)" after the label */
  optional?: boolean;
  /** ISO date (`2026-11-18`), or null for no date. Makes the picker controlled */
  value?: string | null;
  /** ISO date to start with, uncontrolled */
  defaultValue?: string;
  /** Called with an ISO date, or null when the field is empty or not a usable date */
  onChange?: (iso: string | null) => void;
  /** Earliest ISO date that can be chosen */
  minValue?: string;
  /** Latest ISO date that can be chosen */
  maxValue?: string;
  /** BCP 47 locale for the format, the month names and the first day of the week. Default: `<html lang>` */
  locale?: string;
  /** Rules out single days, given as ISO dates */
  isDateUnavailable?: (iso: string) => boolean;
  /** Calendar shown from the start, for demos and docs. It does not take focus */
  defaultOpen?: boolean;
  messages?: Partial<DatePickerMessages>;
};

/** Used on the server and wherever no language is known */
const FALLBACK_LOCALE = "en-US";
/** Gap between the field and the calendar, and the closest it gets to the viewport edge */
const GAP_PX = 8;

function supportedLocale(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale)[0];
  } catch {
    return undefined;
  }
}

function subscribeToLang(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  return () => observer.disconnect();
}

const documentLang = () =>
  document.documentElement.lang || navigator.language || FALLBACK_LOCALE;
const serverLang = () => FALLBACK_LOCALE;

/** The `locale` prop, or `<html lang>`, followed as it changes */
function useLocale(locale: string | undefined): string {
  const lang = useSyncExternalStore(subscribeToLang, documentLang, serverLang);
  return supportedLocale(locale) ?? supportedLocale(lang) ?? FALLBACK_LOCALE;
}

/** Every date is Gregorian, so the grid matches the numbers in the field */
const createCalendar = () => new GregorianCalendar();

/**
 * A typeable date field with a calendar button. People can always type the
 * date; the calendar is a shortcut. `ref` and remaining props go to the
 * `<input>`, `className` goes to the outer wrapper. With `name`, a hidden
 * input submits the ISO date.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    {
      label,
      hint,
      error,
      optional,
      value,
      defaultValue,
      onChange,
      minValue,
      maxValue,
      locale: localeProp,
      isDateUnavailable,
      defaultOpen = false,
      messages: messagesProp,
      id,
      className,
      disabled,
      readOnly,
      name,
      "aria-describedby": describedBy,
      onBlur,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const messages = { ...defaultMessages, ...messagesProp };
    const locale = useLocale(localeProp);
    const dateFormat = useMemo(() => getDateFormat(locale), [locale]);
    const min = useMemo(() => toCalendarDate(minValue), [minValue]);
    const max = useMemo(() => toCalendarDate(maxValue), [maxValue]);

    const isControlled = value !== undefined;
    const [ownValue, setOwnValue] = useState<string | null>(
      defaultValue ?? null,
    );
    const current = (isControlled ? value : ownValue) || null;

    const [text, setText] = useState(() => {
      const date = toCalendarDate(current);
      return date ? dateFormat.format(date) : "";
    });
    const [ownError, setOwnError] = useState<string | null>(null);
    const [open, setOpen] = useState(defaultOpen);
    // Focus goes into the grid when someone opens it, not for defaultOpen
    const [focusGrid, setFocusGrid] = useState(false);

    const groupRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const popoverId = useId();

    /** What a parse result means here: the ISO value it gives, and the problem to show on blur */
    const check = (
      result: ParseResult,
    ): { iso: string | null; problem: string | null } => {
      if (result.kind === "empty") return { iso: null, problem: null };
      if (result.kind === "invalid") {
        return { iso: null, problem: messages.invalid(dateFormat.pattern) };
      }
      const { date } = result;
      if (min && date.compare(min) < 0) {
        return {
          iso: null,
          problem: messages.tooEarly(dateFormat.format(min)),
        };
      }
      if (max && date.compare(max) > 0) {
        return { iso: null, problem: messages.tooLate(dateFormat.format(max)) };
      }
      const iso = date.toString();
      if (isDateUnavailable?.(iso)) {
        return {
          iso: null,
          problem: messages.unavailable(dateFormat.format(date)),
        };
      }
      return { iso, problem: null };
    };

    // Keep the text in step with a value set from outside, and with the
    // locale. Typing never gets rewritten: the text is only replaced when it
    // no longer gives the current value
    const [seen, setSeen] = useState({ current, pattern: dateFormat.pattern });
    if (seen.current !== current || seen.pattern !== dateFormat.pattern) {
      setSeen({ current, pattern: dateFormat.pattern });
      const date = toCalendarDate(current);
      const formatChanged = seen.pattern !== dateFormat.pattern;
      const typed = check(parseDateText(text, dateFormat.order)).iso;
      if (formatChanged ? date !== null : typed !== current) {
        setText(date ? dateFormat.format(date) : "");
      }
    }

    const commit = (iso: string | null) => {
      if (iso === current) return;
      if (!isControlled) setOwnValue(iso);
      onChange?.(iso);
    };

    /** Errors appear on blur or Enter, never while typing */
    const validate = () => {
      const result = parseDateText(text, dateFormat.order);
      const { iso, problem } = check(result);
      setOwnError(problem);
      // Tidy a usable date into the locale's format: "1/2/2026" becomes "01/02/2026"
      if (iso && result.kind === "date")
        setText(dateFormat.format(result.date));
    };

    const selectDate = (date: CalendarDate) => {
      setText(dateFormat.format(date));
      setOwnError(null);
      commit(date.toString());
      setOpen(false);
      // Back to the field, which now reads out the chosen date
      inputRef.current?.focus();
    };

    // Esc closes the calendar and nothing else: caught first, so a dialog
    // around the picker stays open. Focus goes back to the calendar button
    // when it was in the calendar. A press outside closes it as well
    useEffect(() => {
      if (!open) return;
      const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        const wasInside = popoverRef.current?.contains(document.activeElement);
        setOpen(false);
        if (wasInside) buttonRef.current?.focus();
      };
      const onPointerDown = (event: PointerEvent) => {
        if (
          event.target instanceof Node &&
          groupRef.current?.contains(event.target)
        ) {
          return;
        }
        setOpen(false);
      };
      // Non modal: Tab can leave the calendar, and it closes behind it
      const group = groupRef.current;
      const onFocusOut = (event: globalThis.FocusEvent) => {
        const next = event.relatedTarget;
        if (next instanceof Node && !group?.contains(next)) setOpen(false);
      };
      window.addEventListener("keydown", onWindowKeyDown, true);
      document.addEventListener("pointerdown", onPointerDown, true);
      group?.addEventListener("focusout", onFocusOut);
      return () => {
        window.removeEventListener("keydown", onWindowKeyDown, true);
        document.removeEventListener("pointerdown", onPointerDown, true);
        group?.removeEventListener("focusout", onFocusOut);
      };
    }, [open]);

    // Into the top layer, below the field (above when there is no room),
    // checked every frame while open so it follows the field on scroll
    useIsomorphicLayoutEffect(() => {
      const popover = popoverRef.current;
      const anchor = groupRef.current;
      if (!open || !popover || !anchor) return;

      try {
        popover.showPopover();
      } catch {
        // No popover support: the fixed position below still shows it
      }

      const rtl = getComputedStyle(anchor).direction === "rtl";
      let last = "";
      const place = () => {
        const box = anchor.getBoundingClientRect();
        const height = popover.offsetHeight;
        const key = `${box.top},${box.left},${box.width},${height},${window.innerWidth},${window.innerHeight}`;
        if (key === last) return;
        last = key;

        // As wide as the field, within the limits in the stylesheet
        popover.style.inlineSize = `${box.width}px`;
        const width = popover.offsetWidth;
        const below = box.bottom + GAP_PX;
        const above = box.top - GAP_PX - height;
        const top =
          below + height > window.innerHeight - GAP_PX && above >= GAP_PX
            ? above
            : below;
        const start = rtl ? box.right - width : box.left;
        const left = Math.max(
          GAP_PX,
          Math.min(start, window.innerWidth - width - GAP_PX),
        );
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
      };

      let frame = 0;
      const loop = () => {
        place();
        frame = requestAnimationFrame(loop);
      };
      loop();

      return () => {
        cancelAnimationFrame(frame);
        try {
          popover.hidePopover();
        } catch {
          // Not shown as a popover
        }
      };
    }, [open]);

    const unavailable = useMemo(
      () =>
        isDateUnavailable
          ? (date: DateValue) =>
              isDateUnavailable(
                new CalendarDate(date.year, date.month, date.day).toString(),
              )
          : undefined,
      [isDateUnavailable],
    );

    const locked = disabled || readOnly;
    const shownError = error || ownError || undefined;

    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint ?? messages.hint(dateFormat.pattern)}
        error={shownError}
        optional={optional}
        disabled={disabled}
        describedBy={describedBy}
        className={className}
      >
        {(control) => (
          <div ref={groupRef} className={styles.group}>
            <input
              autoComplete="off"
              spellCheck={false}
              {...rest}
              {...control}
              ref={mergeRefs(ref, inputRef)}
              type="text"
              value={text}
              disabled={disabled}
              readOnly={readOnly}
              className={cx(
                "kerb-focusable",
                controlStyles.nativeControl,
                styles.input,
              )}
              onChange={(event) => {
                const next = event.target.value;
                setText(next);
                const { iso, problem } = check(
                  parseDateText(next, dateFormat.order),
                );
                commit(iso);
                // A fixed date clears the error at once; a new one waits for blur
                if (!problem) setOwnError(null);
              }}
              onBlur={composeEventHandlers(onBlur, validate)}
              onKeyDown={composeEventHandlers(
                onKeyDown,
                (event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") validate();
                },
              )}
            />
            <Button
              ref={buttonRef}
              variant="secondary"
              className={styles.button}
              aria-label={messages.chooseDate}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? popoverId : undefined}
              disabled={locked}
              iconStart={<Icon name="calendar" />}
              onClick={() => {
                if (open) {
                  setOpen(false);
                } else {
                  setFocusGrid(true);
                  setOpen(true);
                }
              }}
            />
            {open && (
              <div
                ref={popoverRef}
                id={popoverId}
                role="dialog"
                aria-label={label}
                popover="manual"
                className={styles.popover}
              >
                <I18nProvider locale={locale}>
                  <Calendar
                    label={label}
                    locale={locale}
                    value={toCalendarDate(current)}
                    minValue={min}
                    maxValue={max}
                    isDateUnavailable={unavailable}
                    focusOnMount={focusGrid}
                    messages={messages}
                    onSelect={selectDate}
                  />
                </I18nProvider>
              </div>
            )}
            {name !== undefined && (
              <input
                type="hidden"
                name={name}
                value={current ?? ""}
                disabled={disabled}
              />
            )}
          </div>
        )}
      </FieldShell>
    );
  },
);

type CalendarProps = {
  label: string;
  locale: string;
  value: CalendarDate | null;
  minValue: CalendarDate | null;
  maxValue: CalendarDate | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  /** Focus the selected day (or today) when the calendar appears */
  focusOnMount: boolean;
  messages: DatePickerMessages;
  onSelect: (date: CalendarDate) => void;
};

/** The month grid, built on React Aria's calendar hooks with Kerb's markup */
function Calendar({
  label,
  locale,
  value,
  minValue,
  maxValue,
  isDateUnavailable,
  focusOnMount,
  messages,
  onSelect,
}: CalendarProps) {
  const state = useCalendarState({
    locale,
    createCalendar,
    value,
    minValue,
    maxValue,
    isDateUnavailable,
    autoFocus: focusOnMount,
    onChange: (date) =>
      onSelect(new CalendarDate(date.year, date.month, date.day)),
  });

  // useCalendar announces month and selection changes through React Aria's
  // own live region. Kerb has one Announcer, so the hooks get a view of the
  // state that never triggers those announcements: "focused" skips the month
  // one, no value skips the selection one. Selection itself is read through
  // state.isSelected, which still sees the real value
  const quiet: CalendarState = { ...state, isFocused: true, value: null };
  const { title } = useCalendar(
    {
      "aria-label": label,
      minValue,
      maxValue,
    },
    quiet,
  );
  const { gridProps, headerProps, weekDays, weeksInMonth } = useCalendarGrid(
    { weekdayStyle: "short" },
    quiet,
  );

  // The month heading is announced when it changes, not when the calendar opens
  const { announce } = useAnnouncer();
  const lastTitle = useRef(title);
  useEffect(() => {
    if (title === lastTitle.current) return;
    lastTitle.current = title;
    announce(title);
  }, [title, announce]);

  const monthStart = state.visibleRange.start;

  return (
    <>
      <div className={styles.header}>
        <Button
          variant="ghost"
          size="small"
          className={styles.nav}
          aria-label={messages.previousMonth}
          disabled={state.isPreviousVisibleRangeInvalid()}
          iconStart={<Icon name="chevron" className={styles.previousIcon} />}
          onClick={() => state.focusPreviousPage()}
        />
        <h2 className={styles.title}>{title}</h2>
        <Button
          variant="ghost"
          size="small"
          className={styles.nav}
          aria-label={messages.nextMonth}
          disabled={state.isNextVisibleRangeInvalid()}
          iconStart={<Icon name="chevron" className={styles.nextIcon} />}
          onClick={() => state.focusNextPage()}
        />
      </div>
      <table
        {...gridProps}
        className={styles.grid}
        // Home and End go to the start and end of the week. React Aria's own
        // go to the start and end of the month, so it never sees these two
        onKeyDownCapture={(event) => {
          if (event.key !== "Home" && event.key !== "End") return;
          if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          ) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          state.setFocusedDate(
            event.key === "Home"
              ? startOfWeek(state.focusedDate, locale)
              : endOfWeek(state.focusedDate, locale),
          );
        }}
      >
        <thead {...headerProps}>
          <tr>
            {weekDays.map((day, index) => (
              <th key={index} className={styles.weekday}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weeksInMonth }, (_, week) => (
            <tr key={week}>
              {quiet.getDatesInWeek(week).map((date, index) =>
                date && isSameMonth(date, monthStart) ? (
                  <Day key={index} state={quiet} date={date} />
                ) : (
                  // Days of the next and previous month are left blank, as gridcells like the rest of the row
                  <td key={index} role="gridcell" className={styles.cell} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Day({ state, date }: { state: CalendarState; date: CalendarDate }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { cellProps, buttonProps, isSelected, formattedDate } = useCalendarCell(
    { date },
    state,
    ref,
  );
  const dayProps = buttonProps as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <td {...cellProps} className={styles.cell}>
      <button
        type="button"
        {...dayProps}
        ref={ref}
        // Only the focused day is a Tab stop; React Aria leaves days it rules
        // out without a tabIndex, which a native button would treat as 0
        tabIndex={dayProps.tabIndex ?? -1}
        className={cx(
          "kerb-focusable",
          styles.day,
          isToday(date, state.timeZone) && styles.today,
          isSelected && styles.selected,
        )}
      >
        {formattedDate}
      </button>
    </td>
  );
}

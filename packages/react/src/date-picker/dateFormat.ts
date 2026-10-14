import { CalendarDate, parseDate } from "@internationalized/date";

type Part = "day" | "month" | "year";

export type DateFormat = {
  /** The pattern people type, such as `DD.MM.YYYY` (de-DE) or `MM/DD/YYYY` (en-US) */
  pattern: string;
  /** Day, month and year in the order the locale writes them */
  order: Part[];
  /** Formats a date the way the field shows it */
  format: (date: CalendarDate) => string;
};

const tokens: Record<Part, string> = { day: "DD", month: "MM", year: "YYYY" };

// Direction marks some locales put around the separators
const bidiMarks = /[‎‏؜]/g;

/**
 * The locale's short numeric date, always Gregorian with Latin digits, so the
 * pattern in the hint and the text in the field match what people can type.
 */
export function getDateFormat(locale: string): DateFormat {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      calendar: "gregory",
      numberingSystem: "latn",
      timeZone: "UTC",
    });
  } catch {
    // An invalid locale string falls back to the runtime's own
    formatter = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const parts = formatter
    .formatToParts(Date.UTC(2026, 10, 18))
    .map((part) => ({ ...part, value: part.value.replace(bidiMarks, "") }))
    .filter((part) => part.value !== "");
  const order = parts
    .map((part) => part.type)
    .filter((type): type is Part => type in tokens);
  const pattern = parts
    .map((part) =>
      part.type in tokens ? tokens[part.type as Part] : part.value,
    )
    .join("");

  return {
    pattern,
    order,
    format: (date) =>
      parts
        .map((part) => {
          if (part.type === "day") return String(date.day).padStart(2, "0");
          if (part.type === "month") return String(date.month).padStart(2, "0");
          if (part.type === "year") return String(date.year).padStart(4, "0");
          return part.value;
        })
        .join(""),
  };
}

export type ParseResult =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "date"; date: CalendarDate };

const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * Reads what someone typed. Accepts the locale's order with any separators
 * ("18.11.2026", "18/11/2026", "18 11 2026") and ISO ("2026-11-18", for paste).
 * The year needs four digits, and the day has to exist (no 31.02).
 */
export function parseDateText(text: string, order: Part[]): ParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };

  let year: string | undefined;
  let month: string | undefined;
  let day: string | undefined;

  const iso = isoPattern.exec(trimmed);
  if (iso) {
    [, year, month, day] = iso;
  } else {
    // No letters: month names are not parsed, the hint asks for numbers
    if (/\p{L}/u.test(trimmed)) return { kind: "invalid" };
    const groups = trimmed.match(/\d+/g);
    if (!groups || groups.length !== 3) return { kind: "invalid" };
    const values: Partial<Record<Part, string>> = {};
    order.forEach((part, index) => {
      values[part] = groups[index];
    });
    ({ year, month, day } = values);
  }

  if (!year || !month || !day) return { kind: "invalid" };
  if (year.length !== 4 || month.length > 2 || day.length > 2) {
    return { kind: "invalid" };
  }

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 1 || m < 1 || m > 12 || d < 1) return { kind: "invalid" };
  const first = new CalendarDate(y, m, 1);
  if (d > first.calendar.getDaysInMonth(first)) return { kind: "invalid" };

  return { kind: "date", date: new CalendarDate(y, m, d) };
}

/** An ISO date string from props, or null when it is missing or not a date. */
export function toCalendarDate(
  iso: string | null | undefined,
): CalendarDate | null {
  if (!iso) return null;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}

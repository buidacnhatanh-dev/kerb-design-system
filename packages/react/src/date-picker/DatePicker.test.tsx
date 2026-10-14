import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  renderWithKerb,
} from "../../test/utils";
import { Dialog } from "../dialog";
import { DatePicker } from "./DatePicker";
import { getDateFormat, parseDateText } from "./dateFormat";

// jsdom hides every [popover] and has no showPopover(). This stands in for
// it; the real top layer is covered by the Playwright and story tests
const popoverStyle = document.createElement("style");
popoverStyle.textContent = "[popover]:not(#none) { display: block; }";
beforeAll(() => {
  document.head.append(popoverStyle);
});
afterAll(() => {
  popoverStyle.remove();
});

// Today is 12 November 2026, a Thursday, as on the design board
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 12, 10));
});

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.removeAttribute("lang");
});

const field = () => screen.getByRole("textbox", { name: "Workshop date" });
const calendarButton = () =>
  screen.getByRole("button", { name: "Choose date" });
const calendar = () => screen.getByRole("dialog", { name: "Workshop date" });
const grid = () => within(calendar()).getByRole("grid");

/** Waits for the Announcer, which sets its text on the next frame */
async function nextFrame() {
  await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(calendarButton());
  return calendar();
}

describe("date format", () => {
  it("follows the locale", () => {
    expect(getDateFormat("de-DE").pattern).toBe("DD.MM.YYYY");
    expect(getDateFormat("en-US").pattern).toBe("MM/DD/YYYY");
    expect(getDateFormat("en-GB").pattern).toBe("DD/MM/YYYY");
  });

  it("parses the locale's order with any separator, and ISO", () => {
    const { order } = getDateFormat("de-DE");
    for (const text of [
      "18.11.2026",
      "18/11/2026",
      "18 11 2026",
      "2026-11-18",
    ]) {
      const result = parseDateText(text, order);
      expect(result.kind === "date" && result.date.toString()).toBe(
        "2026-11-18",
      );
    }
  });

  it("rejects days that do not exist, short years and words", () => {
    const { order } = getDateFormat("de-DE");
    for (const text of [
      "31.02.2026",
      "18.13.2026",
      "18.11.26",
      "18 Nov 2026",
      "18.11",
    ]) {
      expect(parseDateText(text, order).kind).toBe("invalid");
    }
    expect(parseDateText("  ", order).kind).toBe("empty");
  });
});

describe("DatePicker", () => {
  it("is a labelled native text field with the format as its hint", () => {
    renderWithKerb(<DatePicker label="Workshop date" locale="de-DE" />);

    expect(field().tagName).toBe("INPUT");
    expect(field()).toHaveAccessibleDescription("Format DD.MM.YYYY");
    expect(calendarButton()).toHaveAttribute("aria-haspopup", "dialog");
    expect(calendarButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("takes the locale from <html lang> and follows it when it changes", async () => {
    document.documentElement.lang = "de-DE";
    renderWithKerb(
      <DatePicker label="Workshop date" defaultValue="2026-11-18" />,
    );
    expect(field()).toHaveValue("18.11.2026");

    await act(async () => {
      document.documentElement.lang = "en-US";
    });
    expect(field()).toHaveValue("11/18/2026");
    expect(field()).toHaveAccessibleDescription("Format MM/DD/YYYY");
  });

  it("starts the week on Monday in de-DE and on Sunday in en-US", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithKerb(
      <DatePicker
        label="Workshop date"
        locale="de-DE"
        defaultValue="2026-11-18"
      />,
    );
    await openCalendar(user);
    // The weekday row is hidden from screen readers: the day names are in each day's name
    let firstRow = within(grid()).getAllByRole("row")[0]!;
    let cells = within(firstRow).getAllByRole("gridcell");
    // 1 November 2026 is a Sunday: the last column of the first week
    expect(cells[6]).toHaveTextContent("1");
    expect(cells[0]).toBeEmptyDOMElement();
    expect(grid().querySelector("thead th")).toHaveTextContent(/^Mo/);
    unmount();

    renderWithKerb(
      <DatePicker
        label="Workshop date"
        locale="en-US"
        defaultValue="2026-11-18"
      />,
    );
    await openCalendar(user);
    firstRow = within(grid()).getAllByRole("row")[0]!;
    cells = within(firstRow).getAllByRole("gridcell");
    expect(cells[0]).toHaveTextContent("1");
    expect(grid().querySelector("thead th")).toHaveTextContent(/^Sun/);
  });

  it("sets the value when someone types a valid date", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <form aria-label="Booking">
        <DatePicker
          label="Workshop date"
          locale="de-DE"
          name="workshop"
          onChange={onChange}
        />
      </form>,
    );

    await user.type(field(), "18.11.2026");

    expect(onChange).toHaveBeenLastCalledWith("2026-11-18");
    const form = screen.getByRole("form", { name: "Booking" });
    expect(new FormData(form as HTMLFormElement).get("workshop")).toBe(
      "2026-11-18",
    );
  });

  it("tidies a typed date into the locale's format on blur", async () => {
    const user = userEvent.setup();
    renderWithKerb(<DatePicker label="Workshop date" locale="de-DE" />);

    await user.type(field(), "1/2/2027");
    await user.tab();

    expect(field()).toHaveValue("01.02.2027");
  });

  it("shows the error pattern for an invalid date on blur, not while typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <DatePicker label="Workshop date" locale="de-DE" onChange={onChange} />,
    );

    await user.type(field(), "31.02.2026");
    expect(field()).not.toHaveAttribute("aria-invalid");
    expect(onChange).not.toHaveBeenCalledWith(expect.any(String));

    await user.tab();

    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(field()).toHaveAccessibleDescription(
      "Format DD.MM.YYYY Enter a real date in the format DD.MM.YYYY",
    );
    const message = screen.getByText(
      "Enter a real date in the format DD.MM.YYYY",
    );
    // Colour is never alone: an icon sits next to the text
    expect(message.parentElement?.querySelector("svg")).not.toBeNull();

    // Fixing it clears the error at once
    await user.clear(field());
    await user.type(field(), "28.02.2026");
    expect(field()).not.toHaveAttribute("aria-invalid");
    expect(onChange).toHaveBeenLastCalledWith("2026-02-28");
  });

  it("checks the date on Enter as well as on blur", async () => {
    const user = userEvent.setup();
    renderWithKerb(<DatePicker label="Workshop date" locale="de-DE" />);

    await user.type(field(), "18.11{Enter}");

    expect(field()).toHaveAttribute("aria-invalid", "true");
  });

  it("explains dates outside the limits and unavailable dates", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <DatePicker
        label="Workshop date"
        locale="de-DE"
        minValue="2026-11-02"
        maxValue="2026-11-27"
        isDateUnavailable={(iso) => iso === "2026-11-20"}
        onChange={onChange}
      />,
    );

    await user.type(field(), "01.11.2026");
    await user.tab();
    expect(
      screen.getByText("Enter a date on or after 02.11.2026"),
    ).toBeVisible();

    await user.clear(field());
    await user.type(field(), "30.11.2026");
    await user.tab();
    expect(
      screen.getByText("Enter a date on or before 27.11.2026"),
    ).toBeVisible();

    await user.clear(field());
    await user.type(field(), "20.11.2026");
    await user.tab();
    expect(
      screen.getByText("20.11.2026 is not available. Choose another date"),
    ).toBeVisible();
    expect(onChange).not.toHaveBeenCalledWith(expect.any(String));
  });

  it("lets the consumer's error win", async () => {
    renderWithKerb(
      <DatePicker
        label="Workshop date"
        locale="de-DE"
        defaultValue="2026-11-18"
        error="Choose a date after your arrival"
      />,
    );

    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(field()).toHaveAccessibleDescription(
      "Format DD.MM.YYYY Choose a date after your arrival",
    );
  });

  it("follows a controlled value", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("2026-11-18");
      return (
        <>
          <DatePicker
            label="Workshop date"
            locale="de-DE"
            value={value}
            onChange={setValue}
          />
          <button type="button" onClick={() => setValue("2027-01-05")}>
            Next workshop
          </button>
          <button type="button" onClick={() => setValue(null)}>
            Clear
          </button>
          <output>{value ?? "none"}</output>
        </>
      );
    }
    renderWithKerb(<Controlled />);
    expect(field()).toHaveValue("18.11.2026");

    await user.click(screen.getByRole("button", { name: "Next workshop" }));
    expect(field()).toHaveValue("05.01.2027");

    await user.clear(field());
    await user.type(field(), "07.01.2027");
    expect(screen.getByRole("status")).toHaveTextContent("2027-01-07");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(field()).toHaveValue("");
  });

  it("forwards the ref and props to the input and the class name to the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = renderWithKerb(
      <DatePicker
        ref={ref}
        label="Workshop date"
        locale="de-DE"
        className="layout"
        required
        autoComplete="bday"
      />,
    );

    expect(ref.current).toBe(field());
    expect(field()).toBeRequired();
    expect(field()).toHaveAttribute("autocomplete", "bday");
    expect(container.querySelector(".layout")).toContainElement(field());
  });

  describe("calendar", () => {
    it("opens as a non modal dialog with focus on the selected day", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );

      const dialog = await openCalendar(user);

      expect(dialog).not.toHaveAttribute("aria-modal");
      expect(calendarButton()).toHaveAttribute("aria-expanded", "true");
      expect(calendarButton()).toHaveAttribute("aria-controls", dialog.id);
      expect(
        within(dialog).getByRole("heading", { name: "November 2026" }),
      ).toBeVisible();
      expect(grid()).toHaveAccessibleName("Workshop date, November 2026");
      const selected = within(grid()).getByRole("button", {
        name: /November 18, 2026/,
      });
      expect(selected).toHaveFocus();
      expect(selected.closest("td")).toHaveAttribute("aria-selected", "true");
      // Roving focus: one Tab stop in the grid
      expect(
        within(grid())
          .getAllByRole("button")
          .filter((day) => day.tabIndex === 0),
      ).toEqual([selected]);
    });

    it("opens on today when there is no value", async () => {
      const user = userEvent.setup();
      renderWithKerb(<DatePicker label="Workshop date" locale="en-US" />);

      await openCalendar(user);

      expect(
        within(grid()).getByRole("button", { name: /^Today/ }),
      ).toHaveFocus();
      expect(screen.getByRole("button", { name: /Today/ })).toHaveTextContent(
        "12",
      );
    });

    it("moves by day and week with the arrow keys", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );
      await openCalendar(user);

      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toHaveAccessibleName(/November 19, 2026/);
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toHaveAccessibleName(/November 26, 2026/);
      await user.keyboard("{ArrowLeft}");
      expect(document.activeElement).toHaveAccessibleName(/November 25, 2026/);
      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toHaveAccessibleName(/November 18, 2026/);
    });

    it("moves by month with Page Up and Page Down, by year with Shift", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );
      await openCalendar(user);

      await user.keyboard("{PageDown}");
      expect(document.activeElement).toHaveAccessibleName(/December 18, 2026/);
      await user.keyboard("{PageUp}{PageUp}");
      expect(document.activeElement).toHaveAccessibleName(/October 18, 2026/);
      await user.keyboard("{Shift>}{PageDown}{/Shift}");
      expect(document.activeElement).toHaveAccessibleName(/October 18, 2027/);
      await user.keyboard("{Shift>}{PageUp}{/Shift}");
      expect(document.activeElement).toHaveAccessibleName(/October 18, 2026/);
      expect(
        screen.getByRole("heading", { name: "October 2026" }),
      ).toBeVisible();
    });

    it("goes to the start and end of the week with Home and End", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="de-DE"
          defaultValue="2026-11-18"
        />,
      );
      await openCalendar(user);

      // German labels from React Aria: the week runs Monday 16 to Sunday 22
      await user.keyboard("{Home}");
      expect(document.activeElement).toHaveTextContent("16");
      expect(document.activeElement).toHaveAccessibleName(
        /Montag, 16\. November 2026/,
      );
      await user.keyboard("{End}");
      expect(document.activeElement).toHaveTextContent("22");
      expect(document.activeElement).toHaveAccessibleName(
        /Sonntag, 22\. November 2026/,
      );
    });

    it("selects with Enter, closes and puts focus back in the field", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="de-DE"
          defaultValue="2026-11-18"
          onChange={onChange}
        />,
      );
      await openCalendar(user);

      await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("2026-11-20");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(field()).toHaveFocus();
      expect(field()).toHaveValue("20.11.2026");
    });

    it("selects a day on click", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithKerb(
        <DatePicker label="Workshop date" locale="en-US" onChange={onChange} />,
      );
      await openCalendar(user);

      await user.click(
        within(grid()).getByRole("button", { name: /November 18, 2026/ }),
      );

      expect(onChange).toHaveBeenCalledWith("2026-11-18");
      expect(field()).toHaveValue("11/18/2026");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes when the selected day is chosen again", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );
      await openCalendar(user);

      await user.keyboard("{Enter}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(field()).toHaveFocus();
    });

    it("closes on Esc and returns focus to the calendar button", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );
      await openCalendar(user);
      await user.keyboard("{ArrowRight}");

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(calendarButton()).toHaveFocus();
      expect(calendarButton()).toHaveAttribute("aria-expanded", "false");
      expect(field()).toHaveValue("11/18/2026");
    });

    it("takes the Esc, so a dialog around it stays open", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <Dialog title="Book a workshop" defaultOpen>
          <DatePicker
            label="Workshop date"
            locale="en-US"
            defaultValue="2026-11-18"
          />
        </Dialog>,
      );
      await openCalendar(user);

      await user.keyboard("{Escape}");

      expect(
        screen.getByRole("dialog", { name: "Book a workshop" }),
      ).toBeVisible();
      expect(calendarButton()).toHaveFocus();
    });

    it("closes when focus leaves it with Tab", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <>
          <DatePicker
            label="Workshop date"
            locale="en-US"
            defaultValue="2026-11-18"
          />
          <button type="button">Continue</button>
        </>,
      );
      await openCalendar(user);

      // The day, then out of the calendar
      await user.tab();

      expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on a press outside without moving focus there", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <>
          <DatePicker label="Workshop date" locale="en-US" />
          <p>Somewhere else</p>
        </>,
      );
      await openCalendar(user);

      await user.click(screen.getByText("Somewhere else"));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("announces the month heading through the shared Announcer when it changes", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
        />,
      );
      const liveRegions = document.querySelectorAll("[aria-live]").length;
      await openCalendar(user);
      await nextFrame();
      expect(liveRegion("polite")).toHaveTextContent("");

      await user.click(screen.getByRole("button", { name: "Next month" }));
      await nextFrame();
      expect(
        screen.getByRole("heading", { name: "December 2026" }),
      ).toBeVisible();
      expect(liveRegion("polite")).toHaveTextContent("December 2026");

      await user.keyboard("{Enter}");
      await nextFrame();
      // No live region of React Aria's own
      expect(document.querySelectorAll("[aria-live]")).toHaveLength(
        liveRegions,
      );
    });

    it("rules out days beyond the limits and keeps them out of the Tab order", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
          minValue="2026-11-10"
          maxValue="2026-11-27"
          isDateUnavailable={(iso) => iso === "2026-11-20"}
        />,
      );
      await openCalendar(user);

      const early = within(grid()).getByRole("button", {
        name: /November 9, 2026/,
      });
      const unavailable = within(grid()).getByRole("button", {
        name: /November 20, 2026/,
      });
      expect(early).toHaveAttribute("aria-disabled", "true");
      expect(early.tabIndex).toBe(-1);
      expect(unavailable).toHaveAttribute("aria-disabled", "true");
      expect(
        screen.getByRole("button", { name: "Previous month" }),
      ).toHaveAttribute("aria-disabled", "true");

      await user.click(unavailable);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(field()).toHaveValue("11/18/2026");
    });

    it("cannot be opened when the field is disabled", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <DatePicker label="Workshop date" locale="en-US" disabled />,
      );

      expect(field()).toBeDisabled();
      expect(calendarButton()).toHaveAttribute("aria-disabled", "true");
      await user.click(calendarButton());

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("shows from the start with defaultOpen without taking focus", () => {
      renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="en-US"
          defaultValue="2026-11-18"
          defaultOpen
        />,
      );

      expect(calendar()).toBeInTheDocument();
      expect(document.body).toHaveFocus();
    });
  });

  forEachTheme(() => {
    it("has no axe violations, closed and open", async () => {
      const user = userEvent.setup();
      const { container } = renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="de-DE"
          defaultValue="2026-11-18"
          minValue="2026-11-03"
        />,
      );
      expect(await axe(container)).toHaveNoViolations();

      await openCalendar(user);
      // The calendar is inside the container: the top layer does not move it in the DOM
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with an error", async () => {
      const { container } = renderWithKerb(
        <DatePicker
          label="Workshop date"
          locale="de-DE"
          error="Enter a real date in the format DD.MM.YYYY"
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

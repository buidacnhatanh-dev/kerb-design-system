import { getLocalTimeZone, today } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { DatePicker } from "./DatePicker";

/**
 * A day near today, in the same month, so the open calendar shows both the
 * today ring and the selected day, as on the design board.
 */
const now = today(getLocalTimeZone());
const nearToday = (
  now.day <= 20 ? now.add({ days: 6 }) : now.subtract({ days: 6 })
).toString();

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker",
  component: DatePicker,
  args: {
    label: "Workshop date",
    locale: "de-DE",
  },
  decorators: [
    // As wide as the design board's card, with room below for the calendar
    (Story, { parameters }) => (
      <div
        style={{
          maxInlineSize: parameters.wide ? undefined : "36rem",
          paddingBlockEnd: parameters.open ? "26rem" : undefined,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/** The hint shows the format for the locale: de-DE here. */
export const Empty: Story = {};

export const Filled: Story = {
  args: { defaultValue: "2026-11-18" },
};

/** The border turns to the text colour inside the Kerb focus ring. */
export const Focus: Story = {
  args: { defaultValue: "2026-11-18", ...forced("focus", "focus-visible") },
};

/**
 * The calendar: week starts on Monday in de-DE, today has a ring, the
 * selected day is filled. Arrow keys move by day and week, Page Up and Down
 * by month, Shift with them by year, Home and End to the ends of the week.
 */
export const Open: Story = {
  parameters: { open: true },
  args: { defaultValue: nearToday, defaultOpen: true },
};

/** Red border, icon and text. Typed dates are checked on blur and on Enter. */
export const Error: Story = {
  args: { error: "Enter a real date in the format DD.MM.YYYY" },
};

export const Disabled: Story = {
  args: { defaultValue: "2026-11-18", disabled: true },
};

/** Days before the minimum, after the maximum and unavailable days are struck through and cannot be chosen. */
export const Limits: Story = {
  parameters: { open: true },
  args: {
    defaultValue: "2026-11-18",
    minValue: "2026-11-04",
    maxValue: "2026-11-27",
    isDateUnavailable: (iso: string) => iso === "2026-11-20",
    hint: "Format DD.MM.YYYY. Between 4 and 27 November, not the 20th",
    defaultOpen: true,
  },
};

/** en-US: the format is MM/DD/YYYY and the week starts on Sunday. */
export const UnitedStates: Story = {
  parameters: { open: true },
  args: { locale: "en-US", defaultValue: nearToday, defaultOpen: true },
};

/** Every closed state side by side. */
export const AllStates: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className={storyStyles.card}>
      <div className={storyStyles.fields}>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Empty</p>
          <DatePicker {...args} />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Focus</p>
          <DatePicker
            {...args}
            defaultValue="2026-11-18"
            {...forced("focus", "focus-visible")}
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Filled</p>
          <DatePicker {...args} defaultValue="2026-11-18" />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Error</p>
          <DatePicker
            {...args}
            error="Enter a real date in the format DD.MM.YYYY"
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Disabled</p>
          <DatePicker {...args} defaultValue="2026-11-18" disabled />
        </div>
      </div>
    </div>
  ),
};

export const Themes: Story = {
  parameters: { wide: true },
  render: (args) => (
    <ThemeColumns>
      <DatePicker {...args} defaultValue="2026-11-18" />
    </ThemeColumns>
  ),
};

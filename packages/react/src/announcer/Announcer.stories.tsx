import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { ThemeColumns, storyStyles } from "../internal/stories/helpers";
import { useAnnouncer } from "./Announcer";
import type { AnnounceUrgency } from "./Announcer";

type Entry = { id: number; message: string; urgency: AnnounceUrgency };

/** Three actions and a log of what was sent to the live regions. */
function AnnouncerDemo() {
  const { announce } = useAnnouncer();
  const [log, setLog] = useState<Entry[]>([]);

  const say = (message: string, urgency: AnnounceUrgency = "polite") => {
    announce(message, { urgency });
    setLog((entries) => [...entries, { id: entries.length, message, urgency }]);
  };

  return (
    <div>
      <div className={storyStyles.row}>
        <Button
          variant="secondary"
          onClick={() => say("12 results for “dialog”")}
        >
          Run a search
        </Button>
        <Button variant="secondary" onClick={() => say("Draft saved")}>
          Save a draft
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            say("Upload failed. The file is over 5 MB.", "assertive")
          }
        >
          Fail an upload
        </Button>
      </div>
      {/* A visible copy for sighted people. The announcement itself goes through the Announcer */}
      <ol className={storyStyles.log} aria-label="Announced so far">
        {log.map((entry) => (
          <li key={entry.id}>
            [{entry.urgency}] {entry.message}
          </li>
        ))}
      </ol>
    </div>
  );
}

const meta: Meta<typeof AnnouncerDemo> = {
  title: "Kerb originals/Announcer",
  component: AnnouncerDemo,
};

export default meta;
type Story = StoryObj<typeof AnnouncerDemo>;

/** Press a button with a screen reader running, or watch the log. */
export const Demo: Story = {};

export const Themes: Story = {
  render: () => (
    <ThemeColumns>
      <AnnouncerDemo />
    </ThemeColumns>
  ),
};

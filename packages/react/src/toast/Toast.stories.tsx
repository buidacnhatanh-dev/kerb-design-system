import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef } from "react";
import { Button } from "../button";
import { storyStyles } from "../internal/stories/helpers";
import { useToast } from "./Toast";
import type { ToastOptions } from "./Toast";

const examples: Record<string, ToastOptions> = {
  saved: {
    tone: "success",
    title: "Project saved",
    body: "Your changes are live.",
  },
  trash: {
    tone: "info",
    title: "Item moved to trash",
    body: "It will be deleted in 30 days.",
    action: { label: "Undo", onAction: () => {} },
  },
  upload: {
    tone: "error",
    title: "Could not upload image",
    body: "The file is over 5 MB. Choose a smaller one.",
    action: { label: "Try again", onAction: () => {} },
  },
};

/** Shows the given toasts once, when the story renders. */
function ShowOnMount({ toasts }: { toasts: ToastOptions[] }) {
  const toast = useToast();
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    for (const options of toasts) toast.show(options);
  }, [toast, toasts]);
  return null;
}

function Triggers() {
  const toast = useToast();
  return (
    <div className={storyStyles.row}>
      <Button variant="secondary" onClick={() => toast.show(examples.saved!)}>
        Save project
      </Button>
      <Button variant="secondary" onClick={() => toast.show(examples.trash!)}>
        Delete item
      </Button>
      <Button variant="secondary" onClick={() => toast.show(examples.upload!)}>
        Upload image
      </Button>
    </div>
  );
}

const meta: Meta = {
  title: "Components/Toast",
};

export default meta;
type Story = StoryObj;

/** Press a button. Focus stays on it; F6 moves to the toasts and back. */
export const Interactive: Story = {
  render: () => <Triggers />,
};

/** Closes on its own after 6 seconds, unless hovered or focused. */
export const Success: Story = {
  render: () => <ShowOnMount toasts={[examples.saved!]} />,
};

/** With an action it stays until dismissed. */
export const WithAction: Story = {
  render: () => <ShowOnMount toasts={[examples.trash!]} />,
};

/** Announced assertively, and stays until dismissed. */
export const Error: Story = {
  render: () => <ShowOnMount toasts={[examples.upload!]} />,
};

/** The three tones stacked, as on the design board. */
export const AllTones: Story = {
  render: () => (
    <ShowOnMount
      toasts={[examples.saved!, examples.trash!, examples.upload!]}
    />
  ),
};

/** Toasts are a dark surface in every theme. Switch the theme in the toolbar to compare. */
export const Themes: Story = {
  render: () => <ShowOnMount toasts={[examples.saved!, examples.trash!]} />,
};

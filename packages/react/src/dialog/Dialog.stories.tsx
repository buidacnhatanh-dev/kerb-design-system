import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { ThemeColumns, storyStyles } from "../internal/stories/helpers";
import { TextField } from "../text-field";
import { Dialog } from "./Dialog";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function RenameDialog(props: { defaultOpen?: boolean }) {
  return (
    <Dialog
      title="Rename project"
      description="The new name shows everywhere this project is shared."
      trigger={<Button variant="secondary">Rename project</Button>}
      defaultOpen={props.defaultOpen}
    >
      <TextField label="Project name" defaultValue="Kerb case study" />
      <Dialog.Cancel>Cancel</Dialog.Cancel>
      <Dialog.Confirm>Save name</Dialog.Confirm>
    </Dialog>
  );
}

/** Focus moves to the first field, stays inside, and returns to the trigger on close. */
export const Default: Story = {
  render: () => <RenameDialog />,
};

/** Open, as on the design board. */
export const Open: Story = {
  render: () => <RenameDialog defaultOpen />,
};

function DeleteDialog(props: { defaultOpen?: boolean }) {
  return (
    <Dialog
      tone="danger"
      title="Delete “Portfolio 2026”?"
      description="This removes the project and its 12 pages."
      trigger={<Button variant="danger">Delete project</Button>}
      defaultOpen={props.defaultOpen}
    >
      <Dialog.Body>
        <p style={{ margin: 0 }}>You can’t undo this.</p>
      </Dialog.Body>
      <Dialog.Cancel>Keep project</Dialog.Cancel>
      <Dialog.Confirm variant="danger">Delete</Dialog.Confirm>
    </Dialog>
  );
}

/** Starts on the safe choice. A click on the backdrop does not close it. */
export const Danger: Story = {
  render: () => <DeleteDialog />,
};

export const DangerOpen: Story = {
  render: () => <DeleteDialog defaultOpen />,
};

function Controlled() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Kerb case study");
  return (
    <div className={storyStyles.row}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Rename
      </Button>
      <p>Name: {name}</p>
      <Dialog title="Rename project" open={open} onOpenChange={setOpen}>
        <form
          id="rename-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setName(String(data.get("name")));
            setOpen(false);
          }}
        >
          <TextField label="Project name" name="name" defaultValue={name} />
        </form>
        <Dialog.Cancel>Cancel</Dialog.Cancel>
        <Dialog.Confirm type="submit" form="rename-form">
          Save name
        </Dialog.Confirm>
      </Dialog>
    </div>
  );
}

/** Opened by any button through `open` and `onOpenChange`. Focus still returns to it. */
export const ControlledOpen: Story = {
  render: () => <Controlled />,
};

function RemovesTrigger() {
  const [deleted, setDeleted] = useState(false);
  return deleted ? (
    <p>The project was deleted.</p>
  ) : (
    <div className={storyStyles.row}>
      <p>Portfolio 2026</p>
      <Dialog
        tone="danger"
        title="Delete “Portfolio 2026”?"
        description="This removes the project and its 12 pages."
        trigger={<Button variant="danger">Delete project</Button>}
      >
        <Dialog.Cancel>Keep project</Dialog.Cancel>
        <Dialog.Confirm variant="danger" onClick={() => setDeleted(true)}>
          Delete
        </Dialog.Confirm>
      </Dialog>
    </div>
  );
}

/**
 * Confirming removes the trigger, so focus cannot go back to it. It goes to
 * the top of the page and "Dialog closed" is announced.
 */
export const TriggerRemoved: Story = {
  render: () => <RemovesTrigger />,
};

/** The open panel in each theme. Modal dialogs cannot sit side by side, so this shows one opened per column. */
export const Themes: Story = {
  render: () => (
    <ThemeColumns>
      {(theme) => (
        <Dialog
          title={`Rename project (${theme})`}
          description="The new name shows everywhere this project is shared."
          trigger={<Button variant="secondary">Open in {theme}</Button>}
        >
          <TextField label="Project name" defaultValue="Kerb case study" />
          <Dialog.Cancel>Cancel</Dialog.Cancel>
          <Dialog.Confirm>Save name</Dialog.Confirm>
        </Dialog>
      )}
    </ThemeColumns>
  ),
};

/** A sheet along the bottom edge, for small screens. The actions stay in view. */
export const BottomSheet: Story = {
  render: () => (
    <Dialog
      title="Filter results"
      placement="bottom"
      initialFocus="close"
      trigger={<Button variant="secondary">Filters</Button>}
      defaultOpen
    >
      <TextField label="Keyword" />
      <Dialog.Confirm>Show results</Dialog.Confirm>
    </Dialog>
  ),
};

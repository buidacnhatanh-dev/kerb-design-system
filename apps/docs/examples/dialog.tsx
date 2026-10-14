"use client";

import { Button, Dialog } from "@kerb/react";

export default function DialogExample() {
  return (
    <Dialog
      tone="danger"
      title="Delete “Portfolio 2026”?"
      description="This removes the project and its 12 pages. You can’t undo this."
      trigger={<Button variant="danger">Delete project</Button>}
    >
      <Dialog.Cancel>Keep project</Dialog.Cancel>
      <Dialog.Confirm variant="danger">Delete</Dialog.Confirm>
    </Dialog>
  );
}

"use client";

import { Button, useToast } from "@kerb/react";

export default function ToastExample() {
  const toast = useToast();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      <Button
        variant="secondary"
        onClick={() =>
          toast.show({ tone: "success", title: "Project saved", body: "Your changes are live." })
        }
      >
        Save project
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.show({
            tone: "info",
            title: "Item moved to trash",
            body: "It will be deleted in 30 days.",
            action: { label: "Undo", onAction: () => {} },
          })
        }
      >
        Move to trash
      </Button>
    </div>
  );
}

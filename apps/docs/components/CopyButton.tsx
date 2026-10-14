"use client";

import { Button, useAnnouncer } from "@kerb/react";

/** Copies text and says so through the Announcer */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const { announce } = useAnnouncer();
  return (
    <Button
      variant="secondary"
      size="small"
      className="code-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          announce("Code copied");
        } catch {
          announce("Could not copy. Select the code and copy it yourself");
        }
      }}
    >
      {label}
    </Button>
  );
}

"use client";

import { Button, useAnnouncer } from "@kerb/react";

export default function AnnouncerExample() {
  const { announce } = useAnnouncer();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      <Button variant="secondary" onClick={() => announce("12 results for “dialog”")}>
        Run a search
      </Button>
      <Button variant="secondary" onClick={() => announce("Draft saved")}>
        Save a draft
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          announce("Could not upload the image. It is over 5 MB.", { urgency: "assertive" })
        }
      >
        Fail an upload
      </Button>
    </div>
  );
}

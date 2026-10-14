"use client";

import { Button } from "@kerb/react";
import { useState } from "react";

export default function ButtonExample() {
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      <Button
        loading={saving}
        onClick={() => {
          setSaving(true);
          setTimeout(() => setSaving(false), 2000);
        }}
      >
        Save changes
      </Button>
      <Button variant="secondary">Preview</Button>
      <Button disabled disabledReason="Add a title before publishing">
        Publish
      </Button>
    </div>
  );
}

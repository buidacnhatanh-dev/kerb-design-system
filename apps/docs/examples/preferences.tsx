"use client";

import { Button, Preferences, TextField } from "@kerb/react";
import Link from "next/link";

/** The full panel, and a plain page built with Kerb that follows it */
export default function PreferencesExample() {
  return (
    <div className="prefs-demo">
      <Preferences headingLevel={3} />
      <section className="preview-page kerb-prose" aria-labelledby="preview-title">
        <p className="rail-label">Preview</p>
        <h3 id="preview-title">Workshop: reading on screens</h3>
        <p>
          Most people read a screen in short bursts. Clear type, generous
          spacing and a calm page help everyone, not only people who asked for
          it. That is the curb cut effect.
        </p>
        <p>
          Places are limited to 20. <Link href="/components/date-picker">Read the full agenda</Link>{" "}
          before you book.
        </p>
        <TextField label="Email" type="email" autoComplete="email" defaultValue="anh@example.com" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBlockStart: "1rem" }}>
          <Button>Book my place</Button>
          <Button variant="secondary">Maybe later</Button>
        </div>
      </section>
    </div>
  );
}

"use client";

import { DatePicker } from "@kerb/react";

export default function DatePickerExample() {
  return (
    <div style={{ inlineSize: "min(100%, 24rem)" }}>
      <DatePicker label="Workshop date" locale="de-DE" defaultValue="2026-11-18" />
    </div>
  );
}

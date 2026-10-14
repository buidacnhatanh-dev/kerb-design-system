"use client";

import { Select } from "@kerb/react";

export default function SelectExample() {
  return (
    <Select
      label="Language"
      hint="Used for dates and numbers"
      autoComplete="language"
      defaultValue="de"
      options={[
        { value: "de", label: "German" },
        { value: "en", label: "English" },
        { value: "vi", label: "Vietnamese" },
      ]}
    />
  );
}

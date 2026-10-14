"use client";

import { TextField } from "@kerb/react";

export default function TextFieldExample() {
  return (
    <TextField
      label="Email"
      hint="For booking updates"
      type="email"
      autoComplete="email"
      defaultValue="nhatanh@"
      error="Enter a full email address"
    />
  );
}

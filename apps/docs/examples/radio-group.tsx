"use client";

import { RadioGroup } from "@kerb/react";

export default function RadioGroupExample() {
  return (
    <RadioGroup
      legend="Delivery"
      name="delivery"
      defaultValue="standard"
      options={[
        { value: "standard", label: "Standard", hint: "3 to 5 working days" },
        { value: "express", label: "Express", hint: "Next working day" },
        { value: "pickup", label: "Pick up", hint: "From the shop in Berlin" },
      ]}
    />
  );
}

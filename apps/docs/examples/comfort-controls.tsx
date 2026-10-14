"use client";

import { ComfortControls } from "@kerb/react";

export default function ComfortControlsExample() {
  return (
    <ComfortControls
      headingLevel={3}
      preview={
        <p>
          Kerb cuts were made for wheelchairs, then everyone with a pram, a bike
          or a suitcase started using them. Reading settings work the same way.
        </p>
      }
    />
  );
}

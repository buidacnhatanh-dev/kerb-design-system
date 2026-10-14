"use client";

import { Button, Tooltip } from "@kerb/react";

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </svg>
  );
}

export default function TooltipExample() {
  return (
    <div style={{ paddingBlockStart: "3rem" }}>
      <Tooltip content="Copy link to clipboard">
        <Button variant="secondary" aria-label="Copy link" iconStart={<LinkIcon />} />
      </Tooltip>
    </div>
  );
}

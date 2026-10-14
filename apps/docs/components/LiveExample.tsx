"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Toggle = "keyboard" | "zoom" | "comfort" | "motion";

const toggles: Array<{ id: Toggle; label: string }> = [
  { id: "keyboard", label: "Keyboard only" },
  { id: "zoom", label: "200% zoom" },
  { id: "comfort", label: "Comfort" },
  { id: "motion", label: "Reduce motion" },
];

/**
 * The live example with its "Try it with" toolbar and the screen reader
 * transcript. Each toggle sets a Kerb attribute on the example frame only:
 * focus on click, zoom, the comfort theme, reduced motion. Overlays that
 * leave the frame (a modal dialog, toasts) follow the page instead.
 */
export function LiveExample({
  transcript,
  caption,
  children,
}: {
  transcript: string[];
  caption?: string;
  children: ReactNode;
}) {
  const [on, setOn] = useState<Record<Toggle, boolean>>({
    keyboard: false,
    zoom: false,
    comfort: false,
    motion: false,
  });

  return (
    <>
      <div className="example">
        <div className="toolbar" role="group" aria-labelledby="try-it-with">
          <span id="try-it-with" className="toolbar-label">
            Try it with:
          </span>
          {toggles.map((toggle) => (
            <button
              key={toggle.id}
              type="button"
              className="toggle kerb-focusable"
              aria-pressed={on[toggle.id]}
              onClick={() =>
                setOn((current) => ({ ...current, [toggle.id]: !current[toggle.id] }))
              }
            >
              {toggle.label}
            </button>
          ))}
        </div>
        <div className="example-body">
          <div
            className="example-frame"
            data-kerb-focus-on-click={on.keyboard ? "" : undefined}
            data-kerb-theme={on.comfort ? "comfort" : undefined}
            data-kerb-motion={on.motion ? "reduced" : undefined}
            data-zoom={on.zoom ? "" : undefined}
          >
            <div className="example-stage">{children}</div>
          </div>
          {/* Duplicates what a screen reader already says, so it is hidden from them */}
          <div className="transcript" data-kerb-theme="dark" aria-hidden="true">
            <p className="transcript-label">What a screen reader says</p>
            <p className="transcript-note">Expected output, not a recording yet.</p>
            <ol>
              {transcript.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <p className="visually-hidden">
            Next to the example is a transcript of what a screen reader says. It
            is hidden from screen readers, which already say it.
          </p>
        </div>
      </div>
      {caption && <p className="caption">{caption}</p>}
    </>
  );
}

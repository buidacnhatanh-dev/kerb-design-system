"use client";

import { Button, Preferences } from "@kerb/react";
import { useEffect, useId, useRef, useState } from "react";
import { CrossIcon, SlidersIcon } from "./Icons";

/** At this width and up the preferences open as a side panel, below it as a sheet */
const PANEL_QUERY = "(min-width: 75em)";

/**
 * The Preferences button in the header: a side panel next to the page on
 * large screens (non modal, Esc closes it), a bottom sheet on small ones.
 */
export function PreferencesToggle() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const closePanel = () => {
    setPanelOpen(false);
    buttonRef.current?.focus();
  };

  // Into the panel when it opens; Esc inside it closes it and goes back
  useEffect(() => {
    if (!panelOpen) return;
    closeRef.current?.focus();
    const panel = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setPanelOpen(false);
      buttonRef.current?.focus();
    };
    panel?.addEventListener("keydown", onKeyDown);
    return () => panel?.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        aria-label="Preferences"
        aria-expanded={panelOpen}
        aria-controls={panelOpen ? panelId : undefined}
        iconStart={<SlidersIcon />}
        onClick={() => {
          if (window.matchMedia(PANEL_QUERY).matches) {
            if (panelOpen) closePanel();
            else setPanelOpen(true);
          } else {
            setSheetOpen(true);
          }
        }}
      />
      {panelOpen && (
        <aside
          ref={panelRef}
          id={panelId}
          aria-label="Preferences"
          className="prefs-panel"
        >
          <div className="prefs-panel-close">
            <Button
              ref={closeRef}
              variant="ghost"
              size="small"
              aria-label="Close preferences"
              iconStart={<CrossIcon />}
              onClick={closePanel}
            />
          </div>
          <Preferences headingLevel={2} />
        </aside>
      )}
      <Preferences variant="sheet" open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

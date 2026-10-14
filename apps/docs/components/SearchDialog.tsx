"use client";

import { Dialog, TextField, useAnnouncer } from "@kerb/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type { KeyboardEvent } from "react";
import type { SearchEntry } from "../lib/site";

const MAX_RESULTS = 30;
/** The count is announced once typing rests */
const ANNOUNCE_AFTER_MS = 500;

function search(index: SearchEntry[], query: string): SearchEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const matches = index.filter((entry) => {
    const text = `${entry.title} ${entry.page}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
  // Titles that start with the query first, then pages before headings
  const first = words[0] ?? "";
  return matches
    .map((entry, order) => ({
      entry,
      score:
        (entry.title.toLowerCase().startsWith(first) ? 0 : 2) +
        (entry.href.includes("#") ? 1 : 0),
      order,
    }))
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, MAX_RESULTS)
    .map(({ entry }) => entry);
}

/**
 * Search as a Dialog: a combobox field and a listbox of results. Arrow keys
 * move through the results, Enter opens one, the count is announced.
 */
export function SearchDialog({
  index,
  open,
  onOpenChange,
}: {
  index: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { announce } = useAnnouncer();
  const listId = useId();
  const results = search(index, query);
  const count =
    query.trim() === ""
      ? "Type to search pages and headings."
      : results.length === 0
        ? "No results."
        : `${results.length} ${results.length === 1 ? "result" : "results"}.`;

  useEffect(() => {
    if (!open || query.trim() === "") return;
    const timer = setTimeout(() => announce(count), ANNOUNCE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [open, query, count, announce]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    onOpenChange(false);
    setQuery("");
    router.push(entry.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  const optionId = (position: number) => `${listId}-option-${position}`;

  return (
    <Dialog title="Search docs" open={open} onOpenChange={onOpenChange}>
      <div className="search-field">
        <TextField
          label="Page or heading"
          type="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            results.length > 0 ? optionId(active) : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <p className="search-count">{count}</p>
        <div id={listId} role="listbox" aria-label="Results" className="search-results">
          {results.map((entry, position) => (
            // Keyboard use goes through the field (aria-activedescendant); a
            // click on an option opens it
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div
              key={entry.href}
              id={optionId(position)}
              role="option"
              // Reachable through the field, not with Tab; a press keeps focus in the field
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              aria-selected={position === active}
              className="search-option"
              onClick={() => go(entry)}
            >
              <span className="search-option-title">{entry.title}</span>
              <span className="search-option-where">{entry.page}</span>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

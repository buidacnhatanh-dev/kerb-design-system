import { readFileSync } from "node:fs";
import path from "node:path";
import type { ComponentSlug } from "./registry";

/** Written by hand: what the component is and the manual screen reader pass */
export type PassportFacts = {
  pattern: string;
  wcag: string[];
  /** Null until the manual pass is done (docs/07-testing-and-ci.md) */
  screenReaders: string | null;
  /** Null until the manual pass is done */
  testedBy: string | null;
};

/** Written by scripts/passport-stats.ts from real test runs. Never hand edited */
export type PassportStats = {
  keyboardTests: number;
  axeViolations: number;
  axeRuns: number;
  /** The docs page in the comfort theme at 200% zoom: no sideways scroll, no clipped text */
  comfortZoom: "passed" | "failed" | "not run";
  lastRun: string;
};

export type SiteStats = {
  keyboardTests: number;
  axeViolations: number;
  axeRuns: number;
  gzipKb: number;
  lastRun: string;
};

const passportsDir = path.join(process.cwd(), "content", "passports");

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function getPassport(slug: ComponentSlug): {
  facts: PassportFacts;
  stats: PassportStats | null;
} {
  const facts = readJson<PassportFacts>(path.join(passportsDir, `${slug}.json`));
  if (!facts) throw new Error(`Missing passport: content/passports/${slug}.json`);
  return {
    facts,
    stats: readJson<PassportStats>(path.join(passportsDir, `${slug}.stats.json`)),
  };
}

export function getSiteStats(): SiteStats | null {
  return readJson<SiteStats>(path.join(process.cwd(), "content", "stats.json"));
}

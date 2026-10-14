/*
 * Writes the passport numbers from real test runs (docs/07-testing-and-ci.md).
 *
 *   node scripts/passport-stats.ts          write the files
 *   node scripts/passport-stats.ts --check  fail if the committed numbers differ (CI)
 *
 * Reads, from reports/:
 *   e2e.json   Playwright (pnpm test:e2e): keyboard tests per component spec
 *   a11y.json  Storybook Vitest addon (pnpm test:a11y): axe runs per story file
 *   docs.json  Playwright docs checks (pnpm test:docs): the comfort theme at 200% zoom
 * Writes apps/docs/content/passports/<slug>.stats.json and apps/docs/content/stats.json.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = path.join(import.meta.dirname, "..");
const reports = path.join(root, "reports");
const passports = path.join(root, "apps", "docs", "content", "passports");
const check = process.argv.includes("--check");

const slugs = [
  "button",
  "text-field",
  "select",
  "checkbox",
  "radio-group",
  "dialog",
  "tabs",
  "tooltip",
  "toast",
  "date-picker",
  "preferences",
  "comfort-controls",
  "announcer",
];
const hrefs: Record<string, string> = Object.fromEntries(
  slugs.map((slug) => [
    slug,
    ["preferences", "comfort-controls", "announcer"].includes(slug)
      ? `/originals/${slug}`
      : `/components/${slug}`,
  ]),
);

type Stats = {
  keyboardTests: number;
  axeViolations: number;
  axeRuns: number;
  comfortZoom: "passed" | "failed" | "not run";
  lastRun: string;
};

function readReport<T>(name: string, command: string): T {
  const file = path.join(reports, name);
  if (!existsSync(file)) {
    console.error(`Missing reports/${name}. Run \`${command}\` first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

// Playwright's JSON report: suites per file, nested suites; a spec appears once per browser
type PwSpec = {
  title: string;
  file: string;
  line: number;
  ok: boolean;
  tests: Array<{ status: string }>;
  /** Added here: the describe blocks around it */
  path?: string;
};
type PwSuite = {
  title: string;
  file: string;
  specs: PwSpec[];
  suites?: PwSuite[];
};
type PwReport = { suites: PwSuite[]; stats: { startTime: string } };

/** Every spec in a suite, each with the titles of the describe blocks around it */
function specsOf(suite: PwSuite, parents: string[] = []): PwSpec[] {
  const trail = [...parents, suite.title];
  return [
    ...suite.specs.map((spec) => ({ ...spec, path: trail.join(" › ") })),
    ...(suite.suites ?? []).flatMap((child) => specsOf(child, trail)),
  ];
}

/** One run of a test in one browser: it ran (not skipped) and passed */
const ranAndPassed = (spec: PwSpec) =>
  spec.ok && spec.tests.some((test) => test.status !== "skipped");

/**
 * Tests counted once each, not once per browser: a test counts when it
 * passed in every browser it ran in.
 */
function passingTests(specs: PwSpec[]): number {
  const runs = new Map<string, PwSpec[]>();
  for (const spec of specs) {
    const key = `${spec.file}:${spec.path}:${spec.line}:${spec.title}`;
    runs.set(key, [...(runs.get(key) ?? []), spec]);
  }
  return [...runs.values()].filter((each) => each.every(ranAndPassed)).length;
}

const e2e = readReport<PwReport>("e2e.json", "pnpm test:e2e");
const keyboard = new Map<string, number>();
for (const suite of e2e.suites) {
  const slug = path.basename(suite.file).replace(/\.spec\.ts$/, "");
  keyboard.set(slug, (keyboard.get(slug) ?? 0) + passingTests(specsOf(suite)));
}

// Vitest's JSON report: one entry per story file and theme project
type VitestReport = {
  testResults: Array<{
    name: string;
    assertionResults: Array<{ status: string }>;
  }>;
};
const a11y = readReport<VitestReport>("a11y.json", "pnpm test:a11y");
const axe = new Map<string, { runs: number; failed: number }>();
for (const result of a11y.testResults) {
  const folder = /packages\/react\/src\/([^/]+)\//.exec(result.name)?.[1];
  if (!folder) continue;
  const entry = axe.get(folder) ?? { runs: 0, failed: 0 };
  for (const assertion of result.assertionResults) {
    if (assertion.status === "skipped" || assertion.status === "pending")
      continue;
    entry.runs += 1;
    if (assertion.status !== "passed") entry.failed += 1;
  }
  axe.set(folder, entry);
}

const docs = readReport<PwReport>("docs.json", "pnpm test:docs");
const zoomResult = (href: string): Stats["comfortZoom"] => {
  const spec = docs.suites
    .flatMap((suite) => specsOf(suite))
    .find((each) => each.title === `comfort theme at 200% zoom: ${href}`);
  if (!spec) return "not run";
  return ranAndPassed(spec) ? "passed" : "failed";
};

const lastRun = e2e.stats.startTime.slice(0, 10);
const all: Record<string, Stats> = {};
for (const slug of slugs) {
  const story = axe.get(slug) ?? { runs: 0, failed: 0 };
  all[slug] = {
    keyboardTests: keyboard.get(slug) ?? 0,
    axeViolations: story.failed,
    axeRuns: story.runs,
    comfortZoom: zoomResult(hrefs[slug]!),
    lastRun,
  };
}

const bundle = readFileSync(
  path.join(root, "packages", "react", "dist", "index.js"),
);
const site = {
  keyboardTests: Object.values(all).reduce(
    (sum, each) => sum + each.keyboardTests,
    0,
  ),
  axeViolations: Object.values(all).reduce(
    (sum, each) => sum + each.axeViolations,
    0,
  ),
  axeRuns: Object.values(all).reduce((sum, each) => sum + each.axeRuns, 0),
  gzipKb: Math.round((gzipSync(bundle, { level: 9 }).length / 1024) * 10) / 10,
  lastRun,
};

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
// Everything but the date, which changes on every run
const counts = (value: object) =>
  JSON.stringify({ ...value, lastRun: undefined, gzipKb: undefined });

if (check) {
  const stale: string[] = [];
  for (const slug of slugs) {
    const file = path.join(passports, `${slug}.stats.json`);
    const committed = existsSync(file)
      ? JSON.parse(readFileSync(file, "utf8"))
      : {};
    if (counts(committed) !== counts(all[slug]!)) {
      stale.push(
        `${slug}: committed ${counts(committed)}, this run ${counts(all[slug]!)}`,
      );
    }
  }
  if (stale.length > 0) {
    console.error(
      "The passport numbers in apps/docs/content/passports differ from this test run.\n" +
        "Run the tests and `node scripts/passport-stats.ts`, then commit the files.\n\n" +
        stale.join("\n"),
    );
    process.exit(1);
  }
  console.log(
    `Passports match this run: ${site.keyboardTests} keyboard tests, ${site.axeViolations} axe violations.`,
  );
} else {
  for (const slug of slugs) {
    writeFileSync(path.join(passports, `${slug}.stats.json`), json(all[slug]));
  }
  writeFileSync(
    path.join(root, "apps", "docs", "content", "stats.json"),
    json(site),
  );
  console.log(
    `Wrote ${slugs.length} passports: ${site.keyboardTests} keyboard tests, ` +
      `${site.axeViolations} axe violations in ${site.axeRuns} story runs, ${site.gzipKb} kB gzipped.`,
  );
}

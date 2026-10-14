import { getPassport } from "../lib/passport";
import type { ComponentSlug } from "../lib/registry";

/**
 * The accessibility passport. Facts are written by hand; the numbers come
 * from content/passports/<slug>.stats.json, which scripts/passport-stats.ts
 * writes from real test runs.
 */
export function Passport({
  slug,
  title,
  version,
}: {
  slug: ComponentSlug;
  title: string;
  version: string;
}) {
  const { facts, stats } = getPassport(slug);
  const notRun = "[not run yet]";
  return (
    <section className="passport" aria-labelledby={`${slug}-passport`}>
      <p className="passport-label">Accessibility passport</p>
      <h2 id={`${slug}-passport`} className="passport-title">
        {title} · v{version}
      </h2>
      {stats && (
        <p className="stamp" aria-hidden="true">
          Tested
          <br />
          {stats.lastRun}
        </p>
      )}
      <dl className="passport-fields">
        <div>
          <dt>Pattern</dt>
          <dd>{facts.pattern}</dd>
        </div>
        <div>
          <dt>WCAG 2.2</dt>
          <dd>{facts.wcag.join(", ")}</dd>
        </div>
        <div>
          <dt>Screen readers</dt>
          <dd>{facts.screenReaders ?? "[manual pass pending]"}</dd>
        </div>
        <div>
          <dt>Browsers</dt>
          <dd>Chromium, Firefox, WebKit (automated)</dd>
        </div>
        <div>
          <dt>Keyboard tests</dt>
          <dd>{stats ? `${stats.keyboardTests} passing` : notRun}</dd>
        </div>
        <div>
          <dt>axe</dt>
          <dd>
            {stats
              ? `${stats.axeViolations} violations in ${stats.axeRuns} story runs`
              : notRun}
          </dd>
        </div>
        <div>
          <dt>Comfort theme</dt>
          <dd>
            {stats?.comfortZoom === "passed"
              ? "Checked at 200% zoom"
              : stats?.comfortZoom === "failed"
                ? "Fails at 200% zoom"
                : "[200% zoom check not run]"}
          </dd>
        </div>
        <div>
          <dt>Last automated run</dt>
          <dd>{stats?.lastRun ?? notRun}</dd>
        </div>
      </dl>
    </section>
  );
}

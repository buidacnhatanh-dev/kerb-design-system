import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { examples } from "../examples";
import { componentContent } from "../lib/content";
import type { ComponentFrontmatter } from "../lib/content";
import { getPassport } from "../lib/passport";
import { getPropsTables } from "../lib/props";
import type { ComponentEntry } from "../lib/registry";
import { getVersion, mdxHeadings } from "../lib/site";
import { KeyboardTable, OnThisPage, PropsTables, UseAvoid } from "./Blocks";
import { CodeBlock } from "./CodeBlock";
import { LiveExample } from "./LiveExample";
import { Passport } from "./Passport";

/** The source of the live example, shown under it, so the code is what runs */
function exampleSource(slug: string): string {
  const file = path.join(process.cwd(), "examples", `${slug}.tsx`);
  return readFileSync(file, "utf8").replace(/^"use client";\n\n/, "");
}

/**
 * The component page template (docs/06-docs-site.md): header and badges,
 * passport, live example with its code, when to use it, the MDX body
 * (accessibility notes and anything else), keyboard, props.
 */
export async function ComponentPage({ entry }: { entry: ComponentEntry }) {
  const content = await componentContent[entry.slug]();
  const front = content.frontmatter as ComponentFrontmatter;
  const Body = content.default;
  const Example = examples[entry.slug];
  const { facts, stats } = getPassport(entry.slug);
  const version = getVersion();
  const bodyHeadings = mdxHeadings(`components/${entry.slug}.mdx`).filter(
    (heading) => heading.level === 2,
  );
  const sections = [
    { id: "live-example", title: "Live example" },
    { id: "when-to-use", title: "When to use it" },
    ...bodyHeadings,
    { id: "props", title: "Props" },
  ];
  const group = entry.group === "components" ? "Components" : "Kerb originals";

  return (
    <div className="page-grid">
      <article>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/#components">
                {group}
              </Link>
            </li>
            <li aria-current="page">{entry.title}</li>
          </ol>
        </nav>
        <h1>{entry.title}</h1>
        <p className="lead">{front.description}</p>
        <ul className="badges" aria-label="Status">
          {/* Stable only after the manual screen reader pass (docs/07-testing-and-ci.md) */}
          <li className={facts.screenReaders ? "badge badge-good" : "badge"}>
            {facts.screenReaders ? "Stable" : "Beta"}
          </li>
          <li className="badge">{front.pattern}</li>
          <li className={stats?.axeViolations === 0 ? "badge badge-good" : "badge"}>
            axe: {stats ? stats.axeViolations : "[n]"} violations
          </li>
        </ul>

        <Passport slug={entry.slug} title={entry.title} version={version} />

        <h2 id="live-example">Live example</h2>
        {entry.slug === "preferences" ? (
          // The full panel next to a page that follows it (docs/06): the
          // preview is the point, so no toolbar, and the code is under "Use it in your app"
          <>
            <Example />
            {front.exampleCaption && <p className="caption">{front.exampleCaption}</p>}
          </>
        ) : (
          <>
            <LiveExample transcript={front.transcript} caption={front.exampleCaption}>
              <Example />
            </LiveExample>
            <CodeBlock
              code={exampleSource(entry.slug)}
              label={`${entry.title} example code`}
            />
          </>
        )}

        <h2 id="when-to-use">When to use it</h2>
        <UseAvoid use={front.use} avoid={front.avoid} />

        <Body />

        <h3 id="keyboard">Keyboard</h3>
        <KeyboardTable rows={front.keyboard} />

        <h2 id="props">Props</h2>
        <PropsTables tables={getPropsTables(entry.props)} />
      </article>
      <OnThisPage items={sections} />
    </div>
  );
}

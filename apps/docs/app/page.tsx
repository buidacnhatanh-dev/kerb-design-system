import Link from "next/link";
import { CodeBlock } from "../components/CodeBlock";
import { KeyboardIcon, ThemeIcon, WaveIcon } from "../components/Icons";
import { NotOnNpm } from "../components/NotOnNpm";
import { getSiteStats } from "../lib/passport";
import { components } from "../lib/registry";
import { getVersion } from "../lib/site";

const sample = `import { Button, Dialog } from "@kerb/react";

<Dialog
  title="Delete project?"
  trigger={<Button>Delete</Button>}
>
  This cannot be undone.
</Dialog>`;

const features = [
  {
    icon: <KeyboardIcon />,
    title: "Keyboard first",
    text: "Every component follows the WAI-ARIA patterns. Tab, arrows, Escape and Enter do what people expect.",
  },
  {
    icon: <WaveIcon />,
    title: "Screen reader tested",
    text: "Names, roles and states are checked in every test run, and each component page shows what a screen reader says.",
  },
  {
    icon: <ThemeIcon />,
    title: "Three themes",
    text: "Light, dark and comfort, which warms the background and lets people scale text without breaking layouts.",
  },
];

export default function HomePage() {
  const stats = getSiteStats();
  const version = getVersion();
  const shown = (value: number | undefined) => (value === undefined ? "[n]" : String(value));

  return (
    <main id="main" className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="pill">
            Version {version} · {components.length} components · 3 themes
          </p>
          <h1 id="hero-title">Components that work for everyone, by default.</h1>
          <p className="lead">
            Kerb is an accessibility first component library for React. Every
            button, field and dialog is keyboard ready, tested with axe in every
            theme and themed out of the box, so your team stops rebuilding the basics.
          </p>
          <div className="actions">
            <Link href="/install" className="button-link kerb-focusable">
              Get started
            </Link>
            <Link href="#components" className="button-link secondary kerb-focusable">
              Browse components
            </Link>
          </div>
        </div>
        <div>
          <NotOnNpm />
          <CodeBlock
            code="$ npm install @kerb/react"
            language="bash"
            label="Install command, coming later"
          />
          <CodeBlock code={sample} label="Dialog example" />
          <p className="caption">
            Focus is trapped, labelled and returned to the trigger. No extra props.
          </p>
        </div>
      </section>

      <ul className="features" aria-label="Why Kerb">
        {features.map((feature) => (
          <li key={feature.title} className="feature">
            <span className="feature-icon">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="components">
        <div className="section-head">
          <h2 id="components">Components</h2>
          <p>Each page has a live example, usage and accessibility notes.</p>
        </div>
        <ul className="tiles">
          {components.map((entry) => (
            <li key={entry.slug}>
              <Link href={entry.href} className="tile kerb-focusable">
                <span className="tile-title">{entry.title}</span>
                <span className="tile-summary">{entry.tile.summary}</span>
                <span className="tile-label">{entry.tile.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="stats-bar" aria-labelledby="tested">
        <div>
          <h2 id="tested">Tested on every change</h2>
          <p>
            axe accessibility checks and keyboard tests run in CI before any
            version is published
            {stats ? `. Last run ${stats.lastRun}.` : "."}
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>axe violations</dt>
            <dd>{shown(stats?.axeViolations)}</dd>
          </div>
          <div>
            <dt>keyboard tests</dt>
            <dd>{shown(stats?.keyboardTests)}</dd>
          </div>
          <div>
            <dt>gzipped JavaScript</dt>
            <dd>{stats ? `${stats.gzipKb} kB` : "[n] kB"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

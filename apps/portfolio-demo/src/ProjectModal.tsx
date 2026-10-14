import { Dialog, Tabs } from "@kerb/react";
import stats from "../../docs/content/stats.json";

/** Where the portfolio's case study lives. Set this in the real portfolio */
const CASE_STUDY_URL = "/work/kerb";

const tabs = [
  {
    value: "overview",
    label: "Overview",
    text: "Thirteen accessibility first React components with a documentation site, three themes and a Preferences panel, published on npm. Built because every team I worked with rebuilt the same broken dialogs and forms.",
    chips: ["React", "TypeScript", "Design tokens"],
  },
  {
    value: "process",
    label: "Process",
    text: "Token system first, then components one by one against the WAI-ARIA patterns, each tested with axe, keyboard tests and screen readers before it was marked stable.",
    chips: ["Storybook", "WAI-ARIA", "VoiceOver", "NVDA"],
  },
  {
    value: "outcome",
    label: "Outcome",
    // The numbers come from the last CI run (scripts/passport-stats.ts)
    text: `${stats.axeViolations} axe violations, ${stats.keyboardTests} keyboard tests in CI, ${stats.gzipKb} kB gzipped. Used in this portfolio and [project].`,
    chips: ["Vitest", "axe", "npm"],
  },
];

function LogoMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="logo-mark"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="#1D4ED8" />
      <path
        d="M6 22h7l6-8h7"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The project card and the modal it opens: a Kerb Dialog with a dark header
 * and Kerb Tabs. Closing it returns focus to the card.
 */
export function ProjectModal() {
  return (
    <Dialog
      title="Kerb"
      eyebrow="Design system · 2026"
      headerTheme="dark"
      initialFocus="close"
      trigger={
        <button type="button" className="project-card kerb-focusable">
          <img
            src="/kerb-cover.png"
            width={1600}
            height={1200}
            alt="Kerb design system: a dialog with a yellow focus ring around the Keep project button, two preference presets, and a screen reader transcript."
          />
          <span className="project-title">Kerb</span>
          <span className="project-summary">
            Accessible design system for React
          </span>
        </button>
      }
    >
      <Tabs label="About this project" defaultValue="overview">
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value}>
            <p className="panel-text">{tab.text}</p>
            <ul className="chips" aria-label="Tools">
              {tab.chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          </Tabs.Panel>
        ))}
      </Tabs>
      <div className="modal-footer">
        <p className="built-with">
          <LogoMark />
          This dialog and its tabs are Kerb components
        </p>
        <a href={CASE_STUDY_URL} className="primary-link kerb-focusable">
          Read the case study
        </a>
      </div>
    </Dialog>
  );
}

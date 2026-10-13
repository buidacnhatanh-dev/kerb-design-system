import type { Meta, StoryObj } from "@storybook/react-vite";
import "./themes.css";

// A plain page to check the theme toolbar against. No components yet.
function ThemeSample() {
  return (
    <main className="sb-theme-sample">
      <h1>One page, three themes</h1>
      <p>
        Switch between Light, Dark and Comfort with the Theme control in the
        toolbar. Only token values change. Read the{" "}
        <a
          className="kerb-focusable"
          href="https://www.w3.org/WAI/WCAG22/quickref/"
        >
          WCAG 2.2 quick reference
        </a>{" "}
        for the criteria Kerb is tested against.
      </p>
      <p className="sb-theme-sample-muted">
        Muted text for hints and captions.
      </p>
      <pre>
        <code>data-kerb-theme</code>
      </pre>
    </main>
  );
}

const meta = {
  title: "Foundations/Themes",
  component: ThemeSample,
} satisfies Meta<typeof ThemeSample>;

export default meta;

export const Themes: StoryObj<typeof meta> = {};

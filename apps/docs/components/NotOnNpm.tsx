import { repositoryUrl, storybookUrl } from "../lib/registry";

/**
 * Kerb 1.0.0 is not published to npm yet (docs/10-release.md). Shown where
 * the install command is, with the ways to try Kerb today.
 */
export function NotOnNpm() {
  return (
    <p className="notice" role="note">
      <strong>Not on npm yet.</strong> Version 1.0.0 is ready but not published,
      so the install command below is for later. Try Kerb today in the{" "}
      <a href={storybookUrl} className="kerb-focusable">
        public Storybook
      </a>{" "}
      or from the source in the{" "}
      <a href={repositoryUrl} className="kerb-focusable">
        GitHub repository
      </a>
      .
    </p>
  );
}

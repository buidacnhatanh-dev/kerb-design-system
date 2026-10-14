import { highlight } from "../lib/highlight";
import { CopyButton } from "./CopyButton";

/**
 * Highlighted code on a dark island (data-kerb-theme="dark"), with a Copy
 * button. The scrolling area is focusable, so it can be scrolled from the keyboard.
 */
export function CodeBlock({
  code,
  language = "tsx",
  label,
}: {
  code: string;
  language?: "tsx" | "css" | "bash";
  /** Names the scrolling region. Default: "Code: " and the first line, so each is unique */
  label?: string;
}) {
  const source = code.replace(/\n$/, "");
  const firstLine =
    source
      .split("\n")
      .find((line) => line.trim() && !line.trim().startsWith("//"))
      ?.trim()
      .replace(/^\$ /, "")
      .slice(0, 60) ?? "";
  const name = label ?? `Code: ${firstLine}`;
  return (
    <div className="code-block" data-kerb-theme="dark">
      {/* Focusable so a long line can be scrolled without a mouse */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="code-scroll kerb-focusable" role="region" aria-label={name} tabIndex={0}>
        <pre>
          <code>
            {highlight(source, language).map((token, index) =>
              token.kind === "plain" ? (
                token.text
              ) : (
                <span key={index} className={`t-${token.kind}`}>
                  {token.text}
                </span>
              ),
            )}
          </code>
        </pre>
      </div>
      <CopyButton text={source.replace(/^\$ /gm, "")} />
    </div>
  );
}

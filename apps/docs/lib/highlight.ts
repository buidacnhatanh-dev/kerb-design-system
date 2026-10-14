/*
 * A small highlighter for the code on the docs site (TSX, CSS and shell).
 * Enough to tell keywords, strings, tags and comments apart; no dependency.
 */

export type TokenKind =
  "plain" | "keyword" | "string" | "tag" | "attr" | "comment" | "number" | "prompt";

export type Token = { kind: TokenKind; text: string };

const keywords = new Set([
  "import", "from", "export", "default", "const", "let", "function", "return",
  "if", "else", "type", "await", "async", "new", "true", "false", "null",
  "undefined", "as", "interface", "extends",
]);

const patterns: Array<[TokenKind, RegExp]> = [
  ["comment", /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/],
  ["string", /^("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
  ["tag", /^(<\/?)([A-Za-z][\w.]*)/],
  ["attr", /^([A-Za-z_][\w-]*)(?==)/],
  ["number", /^\d[\d.]*(?:px|rem|em|ms|%)?/],
  ["plain", /^[A-Za-z_$][\w$-]*/],
  ["plain", /^\s+/],
  ["plain", /^./],
];

export function highlight(source: string, language: "tsx" | "css" | "bash"): Token[] {
  const tokens: Token[] = [];
  const push = (kind: TokenKind, text: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.text += text;
    else tokens.push({ kind, text });
  };

  let rest = source;
  let lineStart = true;
  while (rest.length > 0) {
    if (language === "bash" && lineStart && rest.startsWith("$ ")) {
      push("prompt", "$ ");
      rest = rest.slice(2);
      lineStart = false;
      continue;
    }
    for (const [kind, pattern] of patterns) {
      // "#" starts a comment in shell only; CSS uses it for colours
      if (kind === "comment" && language !== "bash" && rest.startsWith("#")) continue;
      if (kind === "tag" && language !== "tsx") continue;
      const match = pattern.exec(rest);
      if (!match) continue;
      const text = match[0];
      if (kind === "tag") {
        push("plain", match[1] ?? "");
        push("tag", match[2] ?? "");
      } else if (kind === "plain" && keywords.has(text) && language === "tsx") {
        push("keyword", text);
      } else {
        push(kind, text);
      }
      lineStart = text.endsWith("\n");
      rest = rest.slice(text.length);
      break;
    }
  }
  return tokens;
}

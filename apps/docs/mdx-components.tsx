import Link from "next/link";
import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { CodeBlock } from "./components/CodeBlock";
import { TableScroll } from "./components/TableScroll";
import { slugify } from "./lib/site";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function headerCells(node: ReactNode): string[] {
  if (Array.isArray(node)) return node.flatMap(headerCells);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  if (node.type === "th") return [textOf(node.props.children).trim()];
  return headerCells(node.props.children);
}

/** How Markdown in content/ renders: ids on headings, Kerb code blocks, scrolling tables */
const components = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 id={slugify(textOf(children))}>{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 id={slugify(textOf(children))}>{children}</h3>
  ),
  a: ({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} className="kerb-focusable" {...rest}>
        {children}
      </Link>
    ) : (
      <a href={href} className="kerb-focusable" {...rest}>
        {children}
      </a>
    ),
  pre: ({ children }: { children?: ReactNode }) => {
    const code = children as ReactElement<{ className?: string; children?: ReactNode }>;
    const language = /language-(\w+)/.exec(code.props.className ?? "")?.[1];
    return (
      <CodeBlock
        code={textOf(code.props.children)}
        language={language === "bash" || language === "css" ? language : "tsx"}
      />
    );
  },
  table: ({ children }: { children?: ReactNode }) => {
    // Named by its header cells: "Table: Preset, Values"
    const head = (Array.isArray(children) ? children : [children])[0];
    const headers = headerCells(head).join(", ");
    return (
      <TableScroll label={`Table: ${headers || "content"}`}>
        <table className="table">{children}</table>
      </TableScroll>
    );
  },
};

export function useMDXComponents() {
  return components;
}

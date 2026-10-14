import type { ComponentType } from "react";
import { mdxHeadings } from "../lib/site";
import { OnThisPage } from "./Blocks";
import { ColorTokens, ScaleTokens, TypeTokens } from "./TokenTables";
import { ThemeSwitcher } from "./ThemeSwitcher";

/** Components the foundation pages can use in their MDX */
const pageComponents = { ColorTokens, TypeTokens, ScaleTokens, ThemeSwitcher };

/** A foundation or getting started page: title, lead, MDX body, "On this page" */
export function ContentPage({
  file,
  content,
}: {
  file: string;
  content: {
    default: ComponentType<{ components?: Record<string, unknown> }>;
    frontmatter: Record<string, unknown>;
  };
}) {
  const { title, description } = content.frontmatter as { title: string; description: string };
  const Body = content.default;
  const headings = mdxHeadings(file).filter((heading) => heading.level === 2);
  return (
    <div className="page-grid">
      <article>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        <Body components={pageComponents} />
      </article>
      <OnThisPage items={headings} />
    </div>
  );
}

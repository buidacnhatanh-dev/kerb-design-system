// MDX files in content/ export their frontmatter (remark-mdx-frontmatter)
declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: Record<string, unknown>;
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}

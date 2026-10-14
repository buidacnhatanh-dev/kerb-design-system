import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Frontmatter is read with remark plugins and exported as `frontmatter`.
// Plugins are named as strings so Turbopack can pass them to the loader.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "frontmatter" }],
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Read at build time only, for the props tables. Never bundled
  serverExternalPackages: ["react-docgen-typescript", "typescript"],
};

export default withMDX(nextConfig);

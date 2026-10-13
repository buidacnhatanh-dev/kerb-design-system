import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defineConfig } from "tsup";
import type { Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

/*
 * tsup loads every .css file as a global stylesheet. This hands *.module.css
 * to esbuild's CSS Modules loader instead. The path gets a suffix so tsup's
 * own loader (which matches on ".css" at the end) leaves it alone.
 */
const cssModules: EsbuildPlugin = {
  name: "kerb-css-modules",
  setup(build) {
    build.onResolve({ filter: /\.module\.css$/ }, (args) => ({
      path: `${resolve(args.resolveDir, args.path)}?module`,
      namespace: "kerb-css-module",
    }));
    build.onLoad(
      { filter: /.*/, namespace: "kerb-css-module" },
      async (args) => {
        const file = args.path.replace(/\?module$/, "");
        return {
          contents: await readFile(file, "utf8"),
          loader: "local-css",
          resolveDir: dirname(file),
          watchFiles: [file],
        };
      },
    );
  },
};

const shared: Options = {
  format: ["esm"],
  target: "es2022",
  tsconfig: "tsconfig.build.json",
  sourcemap: true,
  // Both builds write to dist, so the build script empties it first
  clean: false,
  external: ["react", "react-dom"],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
    dts: { entry: { index: "src/index.ts" } },
    // Inline the token variables so consumers need a single stylesheet
    noExternal: [/^@kerb\/tokens/],
    esbuildPlugins: [cssModules],
    // The provider and components use hooks and context, so they are client code for React Server Components
    banner: { js: '"use client";' },
    /*
     * All styles imported from index.ts are extracted to one file, published as
     * kerb.css. esbuild names module classes `Button_module_label`; they are
     * renamed to `kerb-Button-label` here, in the stylesheet and in the class
     * maps in index.js, so they are prefixed and easy to read in dev tools.
     */
    async onSuccess() {
      const scoped = /([A-Za-z]+)_module_([A-Za-z][\w-]*)/g;
      const css = await readFile("dist/index.css", "utf8");
      await writeFile(
        "dist/kerb.css",
        css
          .replace(scoped, "kerb-$1-$2")
          .replace("index.css.map", "kerb.css.map"),
      );
      await rename("dist/index.css.map", "dist/kerb.css.map");
      await rm("dist/index.css");

      const js = await readFile("dist/index.js", "utf8");
      await writeFile(
        "dist/index.js",
        // Only the quoted class names, not the variables esbuild named after the files
        js.replace(
          new RegExp(`"${scoped.source}"`, "g"),
          (_match, file: string, name: string) => `"kerb-${file}-${name}"`,
        ),
      );
    },
  },
  {
    // No "use client" here: the head script is called from server components,
    // and the optional stylesheets have no JavaScript at all
    ...shared,
    entry: {
      "head-script": "src/head-script.ts",
      fonts: "src/styles/fonts.css",
      global: "src/styles/global.css",
    },
    dts: { entry: { "head-script": "src/head-script.ts" } },
    // Font files referenced by fonts.css are copied next to it
    loader: { ".woff": "file", ".woff2": "file" },
  },
]);

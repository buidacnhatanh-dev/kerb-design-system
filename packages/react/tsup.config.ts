import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    fonts: "src/styles/fonts.css",
  },
  format: ["esm"],
  target: "es2022",
  tsconfig: "tsconfig.build.json",
  dts: { entry: { index: "src/index.ts" } },
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // Inline the token variables so consumers need a single stylesheet
  noExternal: [/^@kerb\/tokens/],
  // Font files referenced by fonts.css are copied next to it
  loader: { ".woff": "file", ".woff2": "file" },
  // All styles imported from index.ts are extracted to one file, published as kerb.css
  async onSuccess() {
    const css = await readFile("dist/index.css", "utf8");
    await writeFile(
      "dist/kerb.css",
      css.replace("index.css.map", "kerb.css.map"),
    );
    await rename("dist/index.css.map", "dist/kerb.css.map");
    await rm("dist/index.css");
  },
});

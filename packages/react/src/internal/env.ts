declare const process: { env: { NODE_ENV?: string } };

/**
 * True outside production builds. Bundlers replace `process.env.NODE_ENV`, so
 * the dev only code is dropped from production bundles. The catch covers
 * runtimes with no bundler and no `process`.
 */
export const isDev: boolean = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

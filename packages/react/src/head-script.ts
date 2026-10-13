import { applyPreferences } from "./provider/applyPreferences";
import type { KerbPreferences } from "./provider/preferences";

/**
 * A tiny inline script for `<head>` that applies saved preferences before the
 * first paint, so the page does not flash the default theme.
 *
 * ```tsx
 * <script dangerouslySetInnerHTML={{ __html: getKerbHeadScript('kerb') }} />
 * ```
 *
 * Pass the same `storageKey` and defaults as `KerbProvider`.
 *
 * Published as its own entry, `@kerb/react/head-script`, with no "use client"
 * directive, so a server component (a Next.js root layout) can call it.
 */
export function getKerbHeadScript(
  storageKey = "kerb",
  defaults: Partial<KerbPreferences> = {},
): string {
  // "<" is escaped so a key or value can never close the script element
  // Indentation is dropped, line breaks are kept
  const source = applyPreferences.toString().replace(/\s*\n\s*/g, "\n");
  const args = JSON.stringify([storageKey, defaults]).replace(/</g, "\\u003c");
  return (
    "(function(k,d){var p={},n,s;for(n in d)p[n]=d[n];" +
    "try{s=JSON.parse(localStorage.getItem(k));if(s&&s.v===1&&s.prefs)for(n in s.prefs)p[n]=s.prefs[n]}catch(e){}" +
    `try{(${source})(document.documentElement,p)}catch(e){}` +
    `}).apply(null,${args})`
  );
}

import "@kerb/react/kerb.css";
import "@kerb/react/fonts.css";
import "@kerb/react/global.css";
import "./site.css";
import { KerbProvider } from "@kerb/react";
import { getKerbHeadScript } from "@kerb/react/head-script";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { getSearchIndex, getVersion } from "../lib/site";

export const metadata: Metadata = {
  title: { default: "Kerb", template: "%s · Kerb" },
  description:
    "Accessibility first React components with light, dark and comfort themes.",
};

/** The same key in the head script and the provider, so saved choices apply before paint */
const STORAGE_KEY = "kerb";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The head script sets the theme and preference attributes on <html>
    // before React hydrates
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getKerbHeadScript(STORAGE_KEY) }} />
      </head>
      <body>
        <KerbProvider storageKey={STORAGE_KEY}>
          <a href="#main" className="skip-link kerb-focusable">
            Skip to main content
          </a>
          <SiteHeader version={getVersion()} searchIndex={getSearchIndex()} />
          {children}
        </KerbProvider>
      </body>
    </html>
  );
}

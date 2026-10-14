import "@kerb/react/kerb.css";
import "@kerb/react/fonts.css";
import "@kerb/react/global.css";
import "./site.css";
import { KerbProvider } from "@kerb/react";
import { getKerbHeadScript } from "@kerb/react/head-script";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { docsUrl } from "../lib/registry";
import { getSearchIndex, getVersion } from "../lib/site";

const description =
  "Accessibility first React components with light, dark and comfort themes.";

/** Vercel sets this on every build; social cards need an absolute image address */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : docsUrl;

const socialImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Kerb: an accessible design system for React, built on the curb cut effect. A Save changes button with a yellow focus ring, and the light, dark and comfort themes.",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Kerb", template: "%s · Kerb" },
  description,
  openGraph: {
    type: "website",
    siteName: "Kerb",
    title: "Kerb: components that work for everyone, by default",
    description,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kerb: components that work for everyone, by default",
    description,
    images: [socialImage],
  },
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

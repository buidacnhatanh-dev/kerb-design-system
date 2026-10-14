import type { ReactNode } from "react";
import { SideNav } from "../../components/SideNav";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-shell">
      <nav aria-label="Docs" className="side-nav">
        <SideNav />
      </nav>
      <main id="main" className="main">
        {children}
      </main>
    </div>
  );
}

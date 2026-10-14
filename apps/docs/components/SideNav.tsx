"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "../lib/registry";

/** The docs navigation. The current page has aria-current="page" */
export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {nav.map((group) => (
        <div key={group.label} className="nav-group">
          <p className="nav-label" id={`nav-${group.label}`}>
            {group.label}
          </p>
          <ul className="nav-list" aria-labelledby={`nav-${group.label}`}>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link kerb-focusable"
                  aria-current={pathname === link.href ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

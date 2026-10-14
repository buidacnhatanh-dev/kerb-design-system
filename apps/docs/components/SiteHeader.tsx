"use client";

import { Button, Dialog } from "@kerb/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { repositoryUrl } from "../lib/registry";
import type { SearchEntry } from "../lib/site";
import { LogoMark, MenuIcon, SearchIcon } from "./Icons";
import { PreferencesToggle } from "./PreferencesToggle";
import { SearchDialog } from "./SearchDialog";
import { SideNav } from "./SideNav";

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function SiteHeader({
  version,
  searchIndex,
}: {
  version: string;
  searchIndex: SearchEntry[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // "/" opens search from anywhere except a text field
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTyping(event.target)
      ) {
        return;
      }
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="site-header">
      <Link href="/" className="logo kerb-focusable">
        <LogoMark />
        Kerb
      </Link>
      <button
        type="button"
        className="search-trigger kerb-focusable"
        aria-haspopup="dialog"
        aria-keyshortcuts="/"
        onClick={() => setSearchOpen(true)}
      >
        <span>Search docs</span>
        <kbd aria-hidden="true">/</kbd>
      </button>
      <span className="header-spacer" />
      <span className="version">v{version}</span>
      <PreferencesToggle />
      <a href={repositoryUrl} className="header-link header-github kerb-focusable">
        GitHub
      </a>
      <Button
        variant="secondary"
        className="menu-button"
        aria-label="Menu"
        iconStart={<MenuIcon />}
        onClick={() => setMenuOpen(true)}
      />
      <SearchDialog index={searchIndex} open={searchOpen} onOpenChange={setSearchOpen} />
      <Dialog
        title="Menu"
        placement="bottom"
        initialFocus="close"
        open={menuOpen}
        onOpenChange={setMenuOpen}
      >
        <Button
          variant="secondary"
          className="search-in-menu"
          iconStart={<SearchIcon />}
          onClick={() => {
            setMenuOpen(false);
            setSearchOpen(true);
          }}
        >
          Search docs
        </Button>
        <nav aria-label="Docs">
          <SideNav onNavigate={() => setMenuOpen(false)} />
        </nav>
        <a href={repositoryUrl} className="nav-link kerb-focusable">
          GitHub
        </a>
      </Dialog>
    </header>
  );
}

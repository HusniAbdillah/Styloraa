"use client";
import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";
import { WorkspaceNav } from "./workspace-nav";
import styles from "./workspace-shell.module.css";
import { useClientReady } from "@/lib/use-client-ready";
import { BrandLogo } from "./brand-logo";
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const ready = useClientReady();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <button
          disabled={!ready}
          className={`${styles.iconButton} ${styles.desktopToggle}`}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          aria-controls="desktop-navigation"
        >
          <HamburgerMenuIcon width={20} height={20} aria-hidden="true" />
        </button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            disabled={!ready}
            className={`${styles.iconButton} ${styles.mobileToggle}`}
            aria-label="Open navigation"
          >
            <HamburgerMenuIcon width={20} height={20} aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content
              className={styles.drawer}
              aria-describedby={undefined}
            >
              <div className={styles.drawerHeader}>
                <Dialog.Title className={styles.wordmark}>
                  <BrandLogo />
                </Dialog.Title>
                <Dialog.Close
                  className={styles.iconButton}
                  aria-label="Close navigation"
                >
                  <Cross2Icon width={20} height={20} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <WorkspaceNav onNavigate={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Link
          href="/create"
          className={styles.wordmark}
          aria-label="Stylora home"
        >
          <BrandLogo />
        </Link>
        <span className={styles.tagline}>
          A little intention. A style of your own.
        </span>
      </header>
      <aside className={styles.sidebar} id="desktop-navigation">
        <WorkspaceNav collapsed={collapsed} />
      </aside>
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

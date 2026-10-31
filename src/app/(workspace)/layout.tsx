import Link from "next/link";
import { WorkspaceMobileNav } from "@/components/workspace-mobile-nav";
import { WorkspaceNav } from "@/components/workspace-nav";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="workspace-sidebar">
        <Link href="/create" className="brand-lockup workspace-brand" aria-label="Stylora studio home">
          <span className="brand-symbol" aria-hidden="true">✳</span>
          <span>Stylora<span className="brand-period">.</span></span>
        </Link>
        <WorkspaceNav />
        <div className="sidebar-mantra"><span aria-hidden="true">✳</span><p>Dress with intention.<br /><em>Wear what you love.</em></p></div>
      </aside>
      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <div className="workspace-mobile-brand">
            <WorkspaceMobileNav />
            <Link href="/create" className="brand-lockup" aria-label="Stylora studio home">
              <span className="brand-symbol" aria-hidden="true">✳</span>
              <span>Stylora<span className="brand-period">.</span></span>
            </Link>
          </div>
          <div className="workspace-breadcrumb"><span>Style studio</span><span aria-hidden="true">/</span><span>Make it yours</span></div>
          <Link href="/preferences" className="profile-shortcut" aria-label="Style preferences"><span>✳</span><span className="profile-shortcut-label">Your style</span></Link>
        </header>
        <main id="main" className="workspace-main">{children}</main>
      </div>
    </div>
  );
}

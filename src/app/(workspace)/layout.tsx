import Link from "next/link";
import { WorkspaceNav } from "@/components/workspace-nav";
import { WorkspaceMobileNav } from "@/components/workspace-mobile-nav";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <a
        href="#main"
        className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:z-10 focus:p-4"
      >
        Skip to content
      </a>
      <aside className="border-border hidden border-r p-7 md:block">
        <Link
          href="/create"
          className="mb-8 block font-serif text-4xl tracking-tight"
        >
          stylora<span className="text-primary">.</span>
        </Link>
        <WorkspaceNav />
        <p className="text-secondary mt-8 hidden text-xs leading-5 md:block">
          A little intention.
          <br />A style of your own.
        </p>
      </aside>
      <div className="min-w-0">
        <header className="border-border flex min-h-18 items-center justify-between gap-3 border-b px-5 py-3 md:px-10">
          <div className="flex items-center gap-3 md:hidden"><WorkspaceMobileNav /><Link href="/create" className="font-serif text-3xl tracking-tight">stylora<span className="text-primary">.</span></Link></div>
          <span className="text-secondary hidden text-sm md:block">
            Your everyday style studio
          </span>
        </header>
        <main id="main" className="min-w-0 p-5 sm:p-6 md:p-10 lg:p-14">
          {children}
        </main>
      </div>
    </div>
  );
}

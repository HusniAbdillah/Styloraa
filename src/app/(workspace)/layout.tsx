import Link from "next/link";
import { WorkspaceNav } from "@/components/workspace-nav";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <a
        href="#main"
        className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:z-10 focus:p-4"
      >
        Lewati ke konten
      </a>
      <aside className="border-border border-b p-5 md:border-r md:border-b-0 md:p-7">
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
      <div>
        <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5 md:px-10">
          <span className="text-secondary text-sm">
            Your everyday style studio
          </span>
          <span className="border-border bg-card rounded-full border px-3 py-1 text-xs">
            Shared demo · tanpa login
          </span>
        </header>
        <main id="main" className="p-6 md:p-10 lg:p-14">
          {children}
        </main>
      </div>
    </div>
  );
}

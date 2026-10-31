"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
export const workspaceLinks = [
  ["/create", "Create a look"],
  ["/wardrobe", "Wardrobe"],
  ["/capsules", "Capsules"],
  ["/saved-looks", "Saved looks"],
  ["/preferences", "Preferences"],
];
export function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-2"
    >
      {workspaceLinks.map(([href, label]) => {
        const active = path === href || path.startsWith(`${href}/`) || (href === "/create" && path.startsWith("/looks/"));
        return <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "text-secondary hover:bg-card hover:text-foreground shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-[transform,colors] duration-150 ease-out active:scale-[0.98]",
            active &&
              "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
          )}
        >
          {label}
        </Link>;
      })}
    </nav>
  );
}

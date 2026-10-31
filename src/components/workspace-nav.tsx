"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const links = [
  ["/create", "Create a look"],
  ["/wardrobe", "Wardrobe"],
  ["/capsules", "Capsules"],
  ["/saved-looks", "Saved looks"],
  ["/preferences", "Preferences"],
  ["/profile", "Workspace info"],
];
export function WorkspaceNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex gap-2 overflow-x-auto md:flex-col"
    >
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className={cn(
            "text-secondary hover:bg-card hover:text-foreground shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-[transform,colors] duration-150 ease-out active:scale-[0.98]",
            path === href &&
              "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

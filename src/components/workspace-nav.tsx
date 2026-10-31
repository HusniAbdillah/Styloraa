"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const links = [["/create", "Create a look"], ["/wardrobe", "Wardrobe"], ["/capsules", "Capsules"], ["/saved-looks", "Saved looks"], ["/preferences", "Preferences"], ["/profile", "Workspace info"]];
export function WorkspaceNav() {
  const path = usePathname();
  return <nav aria-label="Navigasi utama" className="flex gap-2 overflow-x-auto md:flex-col">{links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("shrink-0 rounded-xl px-4 py-3 text-sm text-secondary hover:bg-card hover:text-foreground", path === href && "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground")}>{label}</Link>)}</nav>;
}

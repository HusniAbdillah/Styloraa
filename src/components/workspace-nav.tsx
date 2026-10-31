"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Box, Heart, Shirt, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const workspaceLinks = [
  ["/create", "Create a look", Sparkles],
  ["/wardrobe", "Wardrobe", Shirt],
  ["/capsules", "Capsules", Box],
  ["/saved-looks", "Saved looks", Bookmark],
  ["/preferences", "Preferences", Heart],
] as const;

export function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary navigation" className="workspace-links">
      {workspaceLinks.map(([href, label, Icon]) => {
        const active = path === href || path.startsWith(`${href}/`) || (href === "/create" && path.startsWith("/looks/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn("workspace-link", active && "workspace-link-active")}
          >
            <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

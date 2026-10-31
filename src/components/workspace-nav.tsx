"use client";

import { usePathname } from "next/navigation";
import {
  PlusIcon,
  BackpackIcon,
  BookmarkIcon,
  LayersIcon,
  MixerHorizontalIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { WorkflowExitLink } from "@/components/workflow-exit-link";

const links = [
  { href: "/create", label: "Create", icon: PlusIcon },
  { href: "/wardrobe", label: "Wardrobe", icon: BackpackIcon },
  { href: "/saved-looks", label: "Saved looks", icon: BookmarkIcon },
  { href: "/capsules", label: "Capsules", icon: LayersIcon },
  { href: "/preferences", label: "Preferences", icon: MixerHorizontalIcon },
  { href: "/profile", label: "Profile", icon: PersonIcon },
] as const;

export function WorkspaceNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-3">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          path === href ||
          path.startsWith(`${href}/`) ||
          (href === "/create" && path.startsWith("/looks/"));
        return (
          <WorkflowExitLink
            key={href}
            href={href}
            onExitConfirmed={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "text-secondary hover:bg-card hover:text-foreground flex min-h-11 items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors duration-150",
              active &&
                "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
            )}
          >
            <Icon
              width={20}
              height={20}
              className="shrink-0"
              aria-hidden="true"
            />
            {!collapsed ? <span>{label}</span> : null}
          </WorkflowExitLink>
        );
      })}
    </nav>
  );
}

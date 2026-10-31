"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  BackpackIcon,
  BookmarkIcon,
  LayersIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
const links = [
  { href: "/create", label: "Create", icon: PlusIcon },
  { href: "/wardrobe", label: "Wardrobe", icon: BackpackIcon },
  { href: "/saved-looks", label: "Saved looks", icon: BookmarkIcon },
  { href: "/capsules", label: "Capsules", icon: LayersIcon },
  { href: "/preferences", label: "Preferences", icon: MixerHorizontalIcon },
];
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
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
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
          </Link>
        );
      })}
    </nav>
  );
}

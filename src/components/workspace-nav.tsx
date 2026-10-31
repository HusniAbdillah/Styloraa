"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Box, Heart, Info, Menu, Shirt, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  ["/create", "Create a look", Sparkles],
  ["/wardrobe", "Wardrobe", Shirt],
  ["/saved-looks", "Saved looks", Bookmark],
  ["/capsules", "Capsules", Box],
  ["/preferences", "Style preferences", Heart],
  ["/profile", "Workspace info", Info],
] as const;

function NavItems({ close }: { close?: () => void }) {
  const path = usePathname();
  return <nav aria-label="Primary navigation" className="workspace-links">{links.map(([href, label, Icon]) => {
    const active = path === href || (href === "/create" && path.startsWith("/looks/"));
    return <Link key={href} href={href} onClick={close} aria-current={active ? "page" : undefined} className={cn("workspace-link", active && "workspace-link-active")}><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></Link>;
  })}</nav>;
}

export function WorkspaceNav() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <>
    <NavItems />
    <button className="mobile-menu-trigger" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}><Menu size={18} aria-hidden="true" /> Menu</button>
    <dialog ref={dialogRef} className="mobile-nav-dialog" aria-label="Main menu" onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}>
      <div className="mobile-nav-head"><Link href="/create" className="brand-lockup" onClick={() => setOpen(false)}><span className="brand-symbol" aria-hidden="true">✳</span><span>Stylora</span></Link><button className="icon-button" type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={19} /></button></div>
      <NavItems close={() => setOpen(false)} />
      <p className="mobile-nav-note">Dress with intention.</p>
    </dialog>
  </>;
}

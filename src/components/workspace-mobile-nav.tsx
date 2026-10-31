"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { WorkspaceNav } from "@/components/workspace-nav";

export function WorkspaceMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="border-border text-foreground inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border md:hidden" aria-label="Open navigation" aria-expanded={open}>
          <Menu size={20} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 md:hidden" />
        <Dialog.Content className="bg-background fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col p-5 shadow-xl md:hidden" aria-describedby={undefined}>
          <div className="mb-8 flex items-center justify-between gap-3">
            <Dialog.Title className="font-serif text-3xl">stylora<span className="text-primary">.</span></Dialog.Title>
            <Dialog.Close asChild><button type="button" className="border-border inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border" aria-label="Close navigation"><X size={20} aria-hidden="true" /></button></Dialog.Close>
          </div>
          <WorkspaceNav onNavigate={() => setOpen(false)} />
          <p className="text-secondary mt-auto text-xs leading-5">A little intention.<br />A style of your own.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

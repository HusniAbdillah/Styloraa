"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps } from "react";

export function WorkflowExitLink({ href, children, className, onExitConfirmed, ...props }: ComponentProps<typeof Link> & { onExitConfirmed?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeLook = path === "/create" || path.startsWith("/looks/");
  const protectedDestination = href === "/wardrobe" || href === "/preferences";
  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirming && dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [confirming]);
  function leave() {
    setConfirming(false);
    onExitConfirmed?.();
    router.push(String(href));
  }
  return <>
    <Link href={href} className={className} {...props} onClick={(event) => {
      if (activeLook && protectedDestination) { event.preventDefault(); setConfirming(true); return; }
      onExitConfirmed?.();
    }}>{children}</Link>
    {confirming && <dialog ref={dialogRef} className="workflow-exit-dialog" aria-labelledby="workflow-exit-title" aria-describedby="workflow-exit-copy" onClose={() => setConfirming(false)}>
        <span className="sparkle-seal" aria-hidden="true">✦</span><p className="eyebrow">Before you go</p><h2 id="workflow-exit-title">Your outfit flow will be cleared.</h2>
        <p id="workflow-exit-copy">Finish your recommendations first, then update your wardrobe or style preferences. Leaving now clears your current analysis progress.</p>
        <div><button type="button" className="button button-outline" onClick={() => setConfirming(false)}>Keep working</button><button type="button" className="button button-primary" onClick={leave}>Leave this look</button></div>
    </dialog>}
  </>;
}

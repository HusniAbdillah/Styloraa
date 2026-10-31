"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { saveStaticWardrobeItem, type WardrobeActionState } from "../actions";
import { categories } from "../schema";
import type { DemoWardrobeEntry } from "../demo-wardrobe";

const inputClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";
const initialState: WardrobeActionState = { ok: false, message: "" };

export function StaticWardrobeControls({ item }: { item: DemoWardrobeEntry }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    saveStaticWardrobeItem,
    initialState,
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
  }, [router, state.ok]);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        href={`/wardrobe/${item.id}/preview`}
        className="border-border bg-background text-foreground hover:bg-card inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium"
      >
        Preview
      </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            className="border-border bg-background text-foreground hover:bg-muted min-h-11 border"
          >
            Edit item
          </Button>
        </DialogTrigger>
        <DialogContent
          title={item.name}
          description="Edit this wardrobe piece and save it to the shared collection."
          className="!inset-y-0 !right-0 !left-auto !m-0 !h-dvh !max-h-dvh !w-full !max-w-none !rounded-none sm:!w-[min(32rem,calc(100vw-2rem))] sm:!rounded-l-2xl [&>div:first-child>button]:!h-11 [&>div:first-child>button]:!w-11"
        >
          <form action={action} className="space-y-5">
            <input type="hidden" name="static_entry_id" value={item.id} />
            <input
              type="hidden"
              name="attributes"
              value={JSON.stringify(item.attributes)}
            />
            <label className="block text-sm">
              Name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={item.name}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Category
              <select
                name="category"
                required
                defaultValue={item.category}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Color
              <input
                name="color"
                required
                maxLength={40}
                defaultValue={item.color}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Subcategory <span className="text-secondary">(optional)</span>
              <input
                name="subcategory"
                maxLength={120}
                defaultValue={item.subcategory}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Notes <span className="text-secondary">(optional)</span>
              <textarea
                name="notes"
                maxLength={4000}
                defaultValue={item.notes}
                className={`${inputClass} min-h-24`}
              />
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {state.message && !state.ok && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-primary text-sm"
              >
                {state.message}
              </p>
            )}
            {state.ok && (
              <p
                role="status"
                aria-live="polite"
                className="text-secondary text-sm"
              >
                {state.message}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

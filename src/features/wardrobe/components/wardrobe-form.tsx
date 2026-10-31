"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { addWardrobeItem } from "../actions";
import { categories } from "../schema";
const inputClass =
  "mt-2 block min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 transition-colors duration-150 ease-out focus:border-primary focus:outline-none";
export function WardrobeForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(addWardrobeItem, {
    ok: false,
    message: "",
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" disabled={!enabled}>
          Add an item
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Add to your wardrobe"
        description="All visitors share the same demo wardrobe."
        className="!inset-y-0 !right-0 !left-auto !m-0 !h-dvh !max-h-dvh !w-full !max-w-none !rounded-none sm:!w-[min(32rem,calc(100vw-2rem))] sm:!rounded-l-2xl [&>div:first-child>button]:!h-11 [&>div:first-child>button]:!w-11"
      >
        <form action={action} className="space-y-4">
          <fieldset
            disabled={!enabled || pending}
            className="space-y-4 disabled:opacity-60"
          >
            <label className="block text-sm">
              Item name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                className={inputClass}
                placeholder="Linen shirt"
              />
            </label>
            <label className="block text-sm">
              Category
              <select name="category" className={inputClass}>
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
                className={inputClass}
                placeholder="Cream"
              />
            </label>
            <Button type="submit" disabled={!enabled || pending}>
              {pending ? "Saving…" : "Add to wardrobe"}
            </Button>
          </fieldset>
          <p
            role="status"
            aria-live="polite"
            className="text-secondary text-sm"
          >
            {state.message ||
              (!enabled
                ? "Connect Supabase and enable demo writes to save."
                : "")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

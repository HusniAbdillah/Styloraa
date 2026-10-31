"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveProfileName } from "../actions";

export function ProfileNameForm({
  initialName,
  enabled,
}: {
  initialName: string | null;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfileName, {
    ok: false,
    message: "",
  });

  return (
    <form
      action={action}
      className="border-border bg-card space-y-4 rounded-2xl border p-6"
    >
      <h2 className="font-serif text-2xl">Display name</h2>
      <p className="text-secondary text-sm">
        This is a shared workspace label. Everyone visiting the demo can see and
        change it.
      </p>
      <fieldset
        disabled={!enabled || pending}
        className="space-y-4 disabled:opacity-60"
      >
        <label className="block text-sm">
          Name
          <input
            name="display_name"
            type="text"
            maxLength={80}
            defaultValue={initialName ?? ""}
            className="border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none"
            placeholder="Your shared display name"
          />
        </label>
        <Button type="submit" disabled={!enabled || pending}>
          {pending ? "Saving…" : "Save name"}
        </Button>
      </fieldset>
      <p role="status" aria-live="polite" className="text-secondary text-sm">
        {state.message ||
          (!enabled ? "Connect Supabase and enable demo writes to save." : "")}
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SaveLookButton({
  lookId,
  optionId,
  revision,
}: {
  lookId: string;
  optionId: string;
  revision: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/looks/${lookId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option_id: optionId,
          expected_revision: revision,
        }),
      });
      const result: { saved_look_id?: string; error?: { message?: string } } =
        await response.json();
      if (!response.ok || !result.saved_look_id) {
        throw new Error(
          result.error?.message ??
            "This look could not be saved. Please try again.",
        );
      }
      router.push(`/saved-looks/${result.saved_look_id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This look could not be saved.",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="bg-primary text-primary-foreground hover:bg-primary-hover min-h-12 rounded-full px-7 text-sm font-semibold disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save this look"}
      </button>
      {error && (
        <p role="alert" className="text-primary mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

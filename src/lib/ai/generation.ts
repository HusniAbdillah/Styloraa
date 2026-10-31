import "server-only";
import { createHash } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError } from "@/lib/errors";
import { MuseApiError } from "./muse";
import type { Json } from "@/types/database";

export function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function reserveGeneration(
  kind: "preview" | "capsule",
  input: Record<string, Json | undefined>,
  parents: {
    wardrobeItemId?: string;
    lookId?: string;
    outfitId?: string;
    mode?: string;
  } = {},
) {
  const { data, error } = await createServerSupabase().rpc(
    "reserve_owner4_generation",
    {
      p_workspace_id: getServerEnv().STYLORA_WORKSPACE_ID,
      p_kind: kind,
      p_input: { ...input, owner: "owner4" },
      p_wardrobe_item_id: parents.wardrobeItemId,
      p_look_id: parents.lookId,
      p_capsule_outfit_id: parents.outfitId,
      p_preview_mode: parents.mode,
    },
  );
  if (error?.code === "P0429")
    throw new MuseApiError(
      "AI_RATE_LIMITED",
      429,
      "A generation is running or the shared generation limit was reached. Try again later.",
    );
  if (error?.code === "PT409")
    throw new ConflictError("This request changed. Start a new generation.");
  if (error || !data)
    throw new MuseApiError(
      "AI_STORAGE_UNAVAILABLE",
      503,
      "Generation could not be reserved. No provider request was sent.",
    );
  return data;
}

export async function failGeneration(id: string, error: unknown) {
  const code =
    error instanceof MuseApiError
      ? error.code
      : error instanceof ConflictError
        ? "STALE_INPUT"
        : "GENERATION_FAILED";
  const { error: updateError } = await createServerSupabase()
    .from("ai_jobs")
    .update({
      status: "failed",
      error_code: code,
      completed_at: new Date().toISOString(),
    })
    .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
    .eq("id", id)
    .eq("status", "running");
  if (updateError)
    throw new MuseApiError(
      "AI_STORAGE_UNAVAILABLE",
      503,
      "The result could not be recorded. Check its status before retrying.",
    );
}

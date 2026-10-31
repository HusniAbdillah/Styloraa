import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { isMuseConfigured, MuseApiError } from "@/lib/ai/muse";
import {
  fingerprint,
  reserveGeneration,
  failGeneration,
} from "@/lib/ai/generation";
import { ConflictError } from "@/lib/errors";
import { personalization } from "@/features/preview/generation";
import { generateAiCombinations } from "@/features/outfits/generator";
import { aiCombinationSchema, type CombinationRequestInput } from "./schema";
import type { getCapsule, CapsuleInventoryItem } from "./repository";
import type { Json } from "@/types/database";

export async function generateCapsuleSuggestions(
  capsule: Awaited<ReturnType<typeof getCapsule>>,
  inventory: CapsuleInventoryItem[],
  request: CombinationRequestInput,
) {
  if (!isMuseConfigured())
    throw new MuseApiError(
      "AI_NOT_CONFIGURED",
      503,
      "Muse Spark is not configured.",
    );
  const profile = await personalization();
  const basis = {
    capsule: {
      id: capsule.id,
      revision: capsule.revision,
      brief: capsule.brief,
      timeframe: capsule.timeframe,
      season: capsule.season,
      occasion: capsule.occasion,
    },
    inventory,
    profile,
    required: request.required_item_ids,
    excluded: request.excluded_item_ids,
    count: request.count,
  };
  const input = {
    request_id: request.request_id,
    owner: "owner4",
    capsule_id: capsule.id,
    fingerprint: fingerprint(basis),
  };
  const db = createServerSupabase(),
    workspace = getServerEnv().STYLORA_WORKSPACE_ID;
  const id = await reserveGeneration("capsule", input);
  const claim = await db
    .from("ai_jobs")
    .update({ input: { ...input, claimed: true } })
    .eq("workspace_id", workspace)
    .eq("id", id)
    .eq("status", "running")
    .is("input->claimed", null)
    .select("id")
    .maybeSingle();
  if (claim.error) throw new Error("Could not start the capsule generation.");
  if (!claim.data) {
    const prior = await db
      .from("ai_jobs")
      .select("status,input")
      .eq("workspace_id", workspace)
      .eq("id", id)
      .single();
    if (prior.error) throw new Error("Could not restore this generation.");
    const saved = prior.data.input as Record<string, Json>;
    const result = aiCombinationSchema.safeParse(saved.result);
    if (prior.data.status === "succeeded" && result.success)
      return { ...result.data, dropped: 0 };
    throw new MuseApiError(
      "GENERATION_IN_PROGRESS",
      409,
      "This request is running or has already ended. Refresh before starting another generation.",
    );
  }
  try {
    const brief =
      capsule.brief &&
      typeof capsule.brief === "object" &&
      !Array.isArray(capsule.brief)
        ? capsule.brief
        : {};
    const result = await generateAiCombinations({
      brief: {
        purpose:
          typeof brief.purpose === "string" ? brief.purpose : capsule.title,
        notes: JSON.stringify({
          brief,
          timeframe: capsule.timeframe,
          season: capsule.season,
          occasion: capsule.occasion,
          user_selected_profile: profile,
        }),
      },
      inventory,
      requiredIds: request.required_item_ids,
      excludedIds: request.excluded_item_ids,
      count: request.count,
    });
    const changed = await db
      .from("capsules")
      .update({ missing_additions: result.missing_additions })
      .eq("workspace_id", workspace)
      .eq("id", capsule.id)
      .eq("revision", capsule.revision)
      .select("id")
      .maybeSingle();
    if (changed.error)
      throw new Error("Could not store the capsule suggestions.");
    if (!changed.data)
      throw new ConflictError(
        "The capsule changed. Generate new suggestions from its current pieces.",
      );
    const done = await db
      .from("ai_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        input: JSON.parse(
          JSON.stringify({ ...input, claimed: true, result }),
        ) as NonNullable<Json>,
      })
      .eq("workspace_id", workspace)
      .eq("id", id)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    if (done.error || !done.data)
      throw new Error("Could not record the capsule generation.");
    return result;
  } catch (error) {
    await failGeneration(id, error);
    throw error;
  }
}

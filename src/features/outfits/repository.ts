import "server-only";
import { clearOutfitPreviews } from "@/features/preview/cleanup";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError, InvalidInputError, NotFoundError } from "@/lib/errors";
import { getCapsule, getCapsuleInventory } from "../capsules/repository";
import type { CreateOutfitInput } from "./schema";
import { requireVerifiedCombination } from "./combination-token";

function workspaceId() {
  return getServerEnv().STYLORA_WORKSPACE_ID;
}

export async function listCapsuleOutfits(capsuleId: string) {
  const { data: capsule, error: capsuleError } = await createServerSupabase()
    .from("capsules")
    .select("id")
    .eq("workspace_id", workspaceId())
    .eq("id", capsuleId)
    .maybeSingle();
  if (capsuleError) throw new Error("Could not load the capsule.");
  if (!capsule) throw new NotFoundError("Capsule not found.");
  const { data, error } = await createServerSupabase()
    .from("capsule_outfits")
    .select(
      "id,title,rationale,uncertainty,source_type,source_revision,created_at",
    )
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId)
    .neq("source_type", "sample")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load outfits.");
  return data;
}

export async function getCapsuleOutfit(capsuleId: string, outfitId: string) {
  const db = createServerSupabase();
  const { data: outfit, error } = await db
    .from("capsule_outfits")
    .select(
      "id,title,rationale,uncertainty,source_type,source_revision,inputs_used,created_at",
    )
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId)
    .eq("id", outfitId)
    .neq("source_type", "sample")
    .maybeSingle();
  if (error) throw new Error("Could not load the outfit.");
  if (!outfit) throw new NotFoundError("Outfit not found.");
  const { data: members, error: membersError } = await db
    .from("capsule_outfit_items")
    .select("position,wardrobe_item_id")
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId)
    .eq("outfit_id", outfitId)
    .order("position", { ascending: true });
  if (membersError) throw new Error("Could not load the outfit.");
  const { data: wardrobe, error: wardrobeError } = await db
    .from("wardrobe_items")
    .select("id,name,category,color,archived_at")
    .eq("workspace_id", workspaceId())
    .in(
      "id",
      members.map((member) => member.wardrobe_item_id),
    );
  if (wardrobeError) throw new Error("Could not load outfit pieces.");
  const byId = new Map(wardrobe.map((item) => [item.id, item]));
  const items = members.map((member) => {
    const item = byId.get(member.wardrobe_item_id);
    if (!item) throw new NotFoundError("An outfit piece is unavailable.");
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      color: item.color,
      available: item.archived_at === null,
      position: member.position,
    };
  });
  const context =
    outfit.inputs_used &&
    typeof outfit.inputs_used === "object" &&
    !Array.isArray(outfit.inputs_used)
      ? outfit.inputs_used
      : {};
  return {
    ...outfit,
    uncertainty:
      outfit.uncertainty ||
      (typeof context.uncertainty === "string" ? context.uncertainty : ""),
    items,
  };
}

export async function createCapsuleOutfit(
  capsuleId: string,
  input: CreateOutfitInput,
) {
  let sourceRevision: number | undefined;
  if (input.source_type === "sample")
    throw new InvalidInputError(
      "Sample combinations cannot be saved in this studio.",
    );
  if (input.source_type === "live" && input.from_saved_look_id)
    throw new InvalidInputError(
      "A verified AI suggestion cannot be replaced with another look.",
    );
  if (input.source_type === "live") {
    const capsule = await getCapsule(capsuleId);
    sourceRevision = capsule.revision;
    requireVerifiedCombination(
      capsuleId,
      {
        title: input.title,
        rationale: input.rationale,
        item_ids: input.item_ids,
        uncertainty: input.uncertainty,
      },
      input.draft_token,
      capsule.revision,
    );
  }
  let itemIds = input.item_ids;
  if (input.from_saved_look_id && !itemIds.length) {
    itemIds = await ownedLookItemIds(input.from_saved_look_id);
  }
  const { data, error } = await createServerSupabase().rpc(
    "create_capsule_outfit",
    {
      p_workspace_id: workspaceId(),
      p_capsule_id: capsuleId,
      p_title: input.title,
      p_rationale: input.rationale,
      p_item_ids: itemIds,
      p_source_type: input.source_type,
      p_inputs_used: {
        uncertainty: input.uncertainty,
        capsule_revision: sourceRevision,
      },
    },
  );
  if (error) {
    if (error.code === "PT409")
      throw new ConflictError(
        "The capsule changed. Generate a new AI suggestion before saving.",
      );
    if (error.code === "22023") {
      const message = error.message ?? "";
      if (message.includes("Capsule is unavailable")) {
        throw new NotFoundError("Capsule not found.");
      }
      throw new InvalidInputError(
        "Outfit items must belong to the capsule and be available.",
      );
    }
    throw new Error("Could not save the outfit.");
  }
  return getCapsuleOutfit(capsuleId, data as string);
}

/**
 * Copy an owned look into a capsule: only snapshot items of kind "owned"
 * whose wardrobe items are still capsule members are carried over.
 */
export async function ownedLookItemIds(savedLookId: string) {
  const db = createServerSupabase();
  const { data: snapshot, error } = await db
    .from("saved_look_snapshots")
    .select("items")
    .eq("workspace_id", workspaceId())
    .eq("id", savedLookId)
    .maybeSingle();
  if (error) throw new Error("Could not load the saved look.");
  if (!snapshot) throw new NotFoundError("Saved look not found.");
  const items = snapshot.items as Array<{
    kind?: string;
    wardrobe_item_id?: string;
  }>;
  if (items.some((item) => item.kind !== "owned" || !item.wardrobe_item_id))
    throw new InvalidInputError(
      "Only entirely owned outfits can become capsule outfits.",
    );
  const owned = items
    .filter((item) => item.kind === "owned" && item.wardrobe_item_id)
    .map((item) => item.wardrobe_item_id as string);
  if (!owned.length) {
    throw new InvalidInputError(
      "Only owned outfits can become capsule outfits.",
    );
  }
  const { data: available, error: archivedError } = await db
    .from("wardrobe_items")
    .select("id")
    .eq("workspace_id", workspaceId())
    .in("id", owned)
    .is("archived_at", null);
  if (archivedError) throw new Error("Could not load the saved look.");
  const availableIds = new Set((available ?? []).map((row) => row.id));
  if (owned.some((id) => !availableIds.has(id))) {
    throw new InvalidInputError("Saved look items are no longer available.");
  }
  return owned;
}

/** Inventory available to the combination generator (available members only). */
export async function getGeneratorInventory(capsuleId: string) {
  const items = await getCapsuleInventory(capsuleId);
  const available = items.filter((item) => item.available);
  if (!available.length) {
    throw new InvalidInputError("Capsule has no available items to combine.");
  }
  return available;
}

export async function deleteCapsuleOutfit(capsuleId: string, outfitId: string) {
  await getCapsuleOutfit(capsuleId, outfitId);
  await clearOutfitPreviews([outfitId]);
  const { data, error } = await createServerSupabase()
    .from("capsule_outfits")
    .delete()
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId)
    .eq("id", outfitId)
    .select("id")
    .maybeSingle();
  if (error?.code === "23503")
    throw new ConflictError(
      "Delete this combination's generated previews before removing it.",
    );
  if (error) throw new Error("Could not remove the combination.");
  if (!data) throw new NotFoundError("Combination not found.");
}

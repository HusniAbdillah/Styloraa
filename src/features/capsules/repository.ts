import "server-only";
import { clearOutfitPreviews } from "@/features/preview/cleanup";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError, InvalidInputError, NotFoundError } from "@/lib/errors";
import type { CreateCapsuleInput, UpdateCapsuleInput } from "./schema";

function workspaceId() {
  return getServerEnv().STYLORA_WORKSPACE_ID;
}

export async function listCapsules() {
  const db = createServerSupabase();
  const { data, error } = await db
    .from("capsules")
    .select(
      "id,title,description,occasion,season,timeframe,revision,created_at,updated_at",
    )
    .eq("workspace_id", workspaceId())
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load capsules.");
  const ids = data.map((capsule) => capsule.id);
  if (!ids.length) return [];
  const [items, outfits] = await Promise.all([
    db
      .from("capsule_items")
      .select("capsule_id,wardrobe_item_id")
      .eq("workspace_id", workspaceId())
      .in("capsule_id", ids),
    db
      .from("capsule_outfits")
      .select("capsule_id")
      .eq("workspace_id", workspaceId())
      .in("capsule_id", ids)
      .neq("source_type", "sample"),
  ]);
  if (items.error || outfits.error) throw new Error("Could not load capsules.");
  return data.map((capsule) => ({
    ...capsule,
    item_ids: items.data
      .filter((item) => item.capsule_id === capsule.id)
      .map((item) => item.wardrobe_item_id),
    item_count: items.data.filter((item) => item.capsule_id === capsule.id)
      .length,
    outfit_count: outfits.data.filter(
      (outfit) => outfit.capsule_id === capsule.id,
    ).length,
  }));
}

export type CapsuleInventoryItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  available: boolean;
};

export async function getCapsuleInventory(capsuleId: string) {
  const { data, error } = await createServerSupabase()
    .from("capsule_items")
    .select(
      "wardrobe_item_id, wardrobe_items!inner(id,name,category,color,archived_at)",
    )
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId)
    .eq("wardrobe_items.workspace_id", workspaceId());
  if (error) throw new Error("Could not load capsule items.");
  return data.map((row) => ({
    id: row.wardrobe_items.id,
    name: row.wardrobe_items.name,
    category: row.wardrobe_items.category,
    color: row.wardrobe_items.color,
    available: row.wardrobe_items.archived_at === null,
  }));
}

export async function getCapsule(capsuleId: string) {
  const { data, error } = await createServerSupabase()
    .from("capsules")
    .select(
      "id,title,description,brief,occasion,season,timeframe,revision,missing_additions,created_at,updated_at",
    )
    .eq("workspace_id", workspaceId())
    .eq("id", capsuleId)
    .maybeSingle();
  if (error) throw new Error("Could not load the capsule.");
  if (!data) throw new NotFoundError("Capsule not found.");
  return { ...data, items: await getCapsuleInventory(capsuleId) };
}

function mapRpcError(error: { code?: string }): Error {
  if (error.code === "40001")
    return new ConflictError(
      "The capsule changed while you were editing. Reload before saving.",
    );
  if (error.code === "23503")
    return new ConflictError(
      "A piece used by a saved combination cannot be removed. Keep it or remove that combination first.",
    );
  if (error.code === "P0002") return new NotFoundError("Capsule not found.");
  if (error.code === "22023")
    return new InvalidInputError(
      "Choose available owned pieces and check the capsule details.",
    );
  return new Error("Could not save the capsule.");
}

async function savedLookIds(id: string) {
  const { data, error } = await createServerSupabase()
    .from("saved_look_snapshots")
    .select("items")
    .eq("workspace_id", workspaceId())
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load the saved look.");
  if (!data) throw new NotFoundError("Saved look not found.");
  const parsed = z
    .array(z.object({ kind: z.literal("owned"), wardrobe_item_id: z.uuid() }))
    .min(1)
    .max(100)
    .safeParse(data.items);
  if (!parsed.success)
    throw new InvalidInputError(
      "Only entirely owned looks can become a capsule.",
    );
  return parsed.data.map((item) => item.wardrobe_item_id);
}

export async function createCapsule(input: CreateCapsuleInput) {
  const sourceIds = input.from_saved_look_id
    ? await savedLookIds(input.from_saved_look_id)
    : [];
  const { data, error } = await createServerSupabase().rpc(
    "save_capsule_studio",
    {
      p_workspace_id: workspaceId(),
      p_title: input.title,
      p_description: input.description,
      p_brief: input.brief,
      p_item_ids: input.item_ids.length ? input.item_ids : sourceIds,
      p_timeframe: input.timeframe ?? undefined,
      p_season: input.season ?? undefined,
      p_occasion: input.occasion ?? undefined,
    },
  );
  if (error) throw mapRpcError(error);
  return data;
}

export async function updateCapsule(
  capsuleId: string,
  input: UpdateCapsuleInput,
) {
  const existing = await getCapsule(capsuleId);
  const { error } = await createServerSupabase().rpc("save_capsule_studio", {
    p_workspace_id: workspaceId(),
    p_capsule_id: capsuleId,
    p_expected_revision: input.expected_revision ?? existing.revision,
    p_title: input.title ?? existing.title,
    p_description: input.description ?? existing.description,
    p_brief: input.brief ?? existing.brief,
    p_item_ids: input.item_ids ?? existing.items.map((item) => item.id),
    p_timeframe:
      (input.timeframe === undefined ? existing.timeframe : input.timeframe) ??
      undefined,
    p_season:
      (input.season === undefined ? existing.season : input.season) ??
      undefined,
    p_occasion:
      (input.occasion === undefined ? existing.occasion : input.occasion) ??
      undefined,
  });
  if (error) throw mapRpcError(error);
  return getCapsule(capsuleId);
}

export async function deleteCapsule(capsuleId: string) {
  await getCapsule(capsuleId);
  const outfits = await createServerSupabase()
    .from("capsule_outfits")
    .select("id")
    .eq("workspace_id", workspaceId())
    .eq("capsule_id", capsuleId);
  if (outfits.error)
    throw new Error("Could not check the capsule combinations.");
  await clearOutfitPreviews(outfits.data.map((x) => x.id));
  const { data, error } = await createServerSupabase()
    .from("capsules")
    .delete()
    .eq("workspace_id", workspaceId())
    .eq("id", capsuleId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("Could not delete the capsule.");
  if (!data) throw new NotFoundError("Capsule not found.");
}

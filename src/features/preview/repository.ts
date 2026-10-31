import "server-only";
import { MetaAiError } from "@/lib/ai/meta";
import { requireOwnedPreviewItems } from "./ownership";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError, InvalidInputError, NotFoundError } from "@/lib/errors";
import { getCapsuleOutfit } from "../outfits/repository";
import type { CreatePreviewJobInput } from "./schema";
import { z } from "zod";

function workspaceId() {
  return getServerEnv().STYLORA_WORKSPACE_ID;
}

export type PreviewCompositionItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  available: boolean;
};

async function requireWardrobeItem(itemId: string) {
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select("id,name,category,color,archived_at")
    .eq("workspace_id", workspaceId())
    .eq("id", itemId)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe item.");
  if (!data) throw new NotFoundError("Wardrobe item not found.");
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    color: data.color,
    available: data.archived_at === null,
  };
}

async function requireLook(lookId: string) {
  const db = createServerSupabase();
  const { data: snapshot, error: snapshotError } = await db
    .from("saved_look_snapshots")
    .select("id,title,rationale,items,source_type")
    .eq("workspace_id", workspaceId())
    .eq("id", lookId)
    .maybeSingle();
  if (snapshotError) throw new Error("Could not load the saved look.");
  if (snapshot) {
    const parsed = z
      .array(z.object({ kind: z.literal("owned"), wardrobe_item_id: z.uuid() }))
      .min(1)
      .max(20)
      .safeParse(snapshot.items);
    if (!parsed.success || snapshot.source_type === "sample")
      throw new InvalidInputError(
        "Only an entirely owned saved look can be previewed.",
      );
    const ids = parsed.data.map((item) => item.wardrobe_item_id);
    const { data: wardrobe, error: wardrobeError } = await db
      .from("wardrobe_items")
      .select("id,name,category,color,archived_at")
      .eq("workspace_id", workspaceId())
      .in("id", ids);
    if (wardrobeError) throw new Error("Could not load the saved pieces.");
    const byId = new Map(wardrobe.map((item) => [item.id, item]));
    const items = ids.map((id) => {
      const item = byId.get(id);
      if (!item) throw new NotFoundError("Saved piece not found.");
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color,
        available: item.archived_at === null,
      };
    });
    return {
      look: {
        id: snapshot.id,
        title: snapshot.title,
        notes: snapshot.rationale,
        is_saved: true,
      },
      items,
    };
  }
  const { data: look, error } = await db
    .from("looks")
    .select("id,title,notes,is_saved")
    .eq("workspace_id", workspaceId())
    .eq("id", lookId)
    .neq("source_type", "sample")
    .maybeSingle();
  if (error) throw new Error("Could not load the look.");
  if (!look) throw new NotFoundError("Look not found.");
  const { data: members, error: membersError } = await db
    .from("look_items")
    .select(
      "position, wardrobe_items!inner(id,name,category,color,archived_at)",
    )
    .eq("workspace_id", workspaceId())
    .eq("look_id", lookId)
    .eq("wardrobe_items.workspace_id", workspaceId())
    .order("position", { ascending: true });
  if (membersError) throw new Error("Could not load the look.");
  const items = (
    members as Array<{
      position: number;
      wardrobe_items: {
        id: string;
        name: string;
        category: string;
        color: string;
        archived_at: string | null;
      };
    }>
  ).map((row) => ({
    id: row.wardrobe_items.id,
    name: row.wardrobe_items.name,
    category: row.wardrobe_items.category,
    color: row.wardrobe_items.color,
    available: row.wardrobe_items.archived_at === null,
  }));
  return { look, items };
}

export async function buildItemPreview(itemId: string) {
  const item = await requireWardrobeItem(itemId);
  return {
    subject: { type: "wardrobe_item" as const, id: item.id },
    title: item.name,
    items: [item],
    provenance: "manual" as const,
  };
}

export async function buildLookPreview(lookId: string) {
  const { look, items } = await requireLook(lookId);
  return {
    subject: { type: "look" as const, id: look.id },
    title: look.title,
    notes: look.notes,
    is_saved: look.is_saved,
    items,
    provenance: "manual" as const,
  };
}

export async function buildOutfitPreview(capsuleId: string, outfitId: string) {
  const outfit = await getCapsuleOutfit(capsuleId, outfitId);
  return {
    subject: {
      type: "capsule_outfit" as const,
      id: outfit.id,
      capsule_id: capsuleId,
    },
    title: outfit.title,
    rationale: outfit.rationale,
    source_type: outfit.source_type,
    items: outfit.items,
    provenance: outfit.source_type,
  };
}

export async function createPreviewJob(input: CreatePreviewJobInput) {
  const composition =
    input.subject_type === "wardrobe_item"
      ? await buildItemPreview(input.subject_id)
      : input.subject_type === "look"
        ? await buildLookPreview(input.subject_id)
        : input.capsule_id
          ? await buildOutfitPreview(input.capsule_id, input.subject_id)
          : null;
  if (!composition)
    throw new InvalidInputError("Outfit previews require a capsule.");
  requireOwnedPreviewItems(composition.items);
  throw new MetaAiError(
    "VISUAL_PROVIDER_NOT_CONFIGURED",
    503,
    "Visual previews are currently unavailable.",
  );
}

export async function getPreviewJob(jobId: string) {
  const { data, error } = await createServerSupabase()
    .from("ai_jobs")
    .select(
      "id,kind,status,error_code,preview_mode,model_source,input,source_type,output_asset_id,created_at,updated_at,completed_at",
    )
    .eq("workspace_id", workspaceId())
    .eq("id", jobId)
    .eq("kind", "preview")
    .maybeSingle();
  if (error) throw new Error("Could not load the preview job.");
  if (!data) throw new NotFoundError("Preview job not found.");
  let imageUrl: string | null = null;
  const input =
    data.input && typeof data.input === "object" && !Array.isArray(data.input)
      ? data.input
      : {};
  let stale = data.source_type !== "live" || !Array.isArray(input.item_ids);
  if (data.status === "succeeded" && data.output_asset_id && !stale) {
    const db = createServerSupabase();
    const { data: asset } = await db
      .from("assets")
      .select("bucket,storage_path")
      .eq("workspace_id", workspaceId())
      .eq("id", data.output_asset_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (
      asset &&
      asset.bucket === "previews" &&
      asset.storage_path.startsWith(workspaceId() + "/") &&
      !asset.storage_path.includes("..")
    ) {
      const { data: signed } = await db.storage
        .from("previews")
        .createSignedUrl(asset.storage_path, 300);
      imageUrl = signed?.signedUrl ?? null;
    }
    if (!imageUrl) stale = true;
  }
  const safeInput = {
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    capsule_id: input.capsule_id,
    item_ids: input.item_ids,
  };
  return {
    id: data.id,
    kind: data.kind,
    status: data.status,
    error_code: data.error_code,
    preview_mode: data.preview_mode,
    model_source: data.model_source,
    input: safeInput,
    image_url: imageUrl,
    stale,
    created_at: data.created_at,
    updated_at: data.updated_at,
    completed_at: data.completed_at,
  };
}

export async function deletePreviewResult(jobId: string) {
  const db = createServerSupabase();
  const { data: job, error } = await db
    .from("ai_jobs")
    .select("id,status,output_asset_id")
    .eq("workspace_id", workspaceId())
    .eq("id", jobId)
    .eq("kind", "preview")
    .maybeSingle();
  if (error) throw new Error("Could not load the preview.");
  if (!job) throw new NotFoundError("Preview not found.");
  if (job.status === "queued" || job.status === "running")
    throw new ConflictError(
      "Wait for this preview to finish before deleting its result.",
    );
  if (job.output_asset_id) {
    const { data: asset, error: assetError } = await db
      .from("assets")
      .select("id,bucket,storage_path")
      .eq("workspace_id", workspaceId())
      .eq("id", job.output_asset_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (assetError) throw new Error("Could not load the preview image.");
    if (asset) {
      if (
        asset.bucket !== "previews" ||
        !asset.storage_path.startsWith(workspaceId() + "/") ||
        asset.storage_path.includes("..")
      )
        throw new InvalidInputError(
          "This preview image cannot be deleted from this context.",
        );
      const { error: storageError } = await db.storage
        .from("previews")
        .remove([asset.storage_path]);
      if (storageError) throw new Error("Could not delete the preview image.");
      const { error: markError } = await db
        .from("assets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId())
        .eq("id", asset.id);
      if (markError) throw new Error("Could not update the preview image.");
    }
  }
  const { error: deleteError } = await db
    .from("ai_jobs")
    .delete()
    .eq("workspace_id", workspaceId())
    .eq("id", job.id)
    .eq("kind", "preview");
  if (deleteError) throw new Error("Could not delete the preview.");
}

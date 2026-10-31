import "server-only";

import { selectedOwnedPieces } from "./ownership";
import { getSelectedLook } from "@/features/decisions/repository";
import { BackendError } from "@/features/decisions/backend";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError, InvalidInputError, NotFoundError } from "@/lib/errors";
import { getCapsuleOutfit } from "../outfits/repository";
import { createPreviewJobSchema } from "./schema";
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

async function requireLook(lookId: string, optionId?: string) {
  const db = createServerSupabase();
  const { data: snapshot, error: snapshotError } = await db
    .from("saved_look_snapshots")
    .select("id,title,rationale,items,source_type")
    .eq("workspace_id", workspaceId())
    .eq("id", lookId)
    .maybeSingle();
  if (snapshotError) throw new Error("Could not load the saved look.");
  if (snapshot) {
    if (optionId)
      throw new InvalidInputError(
        "A saved snapshot cannot use a different option.",
      );
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
      snapshot_id: snapshot.id,
      look: {
        id: snapshot.id,
        title: snapshot.title,
        notes: snapshot.rationale,
        is_saved: true,
      },
      items,
    };
  }
  const { data: source, error: sourceError } = await db
    .from("looks")
    .select("source_type")
    .eq("workspace_id", workspaceId())
    .eq("id", lookId)
    .maybeSingle();
  if (sourceError) throw new Error("Could not load the look.");
  if (!source) throw new NotFoundError("Look not found.");
  if (source.source_type === "sample")
    throw new InvalidInputError("Sample looks cannot be previewed.");
  try {
    const selection = await getSelectedLook(lookId, optionId);
    if (selection.selected_option?.source_type === "sample")
      throw new InvalidInputError("Sample looks cannot be previewed.");
    return {
      look: {
        id: selection.look.id,
        title: selection.selected_option?.title ?? selection.look.title,
        notes: selection.look.notes,
        is_saved: selection.look.is_saved,
      },
      items: selectedOwnedPieces(selection.items, selection.stale),
    };
  } catch (error) {
    if (error instanceof BackendError && error.status === 404)
      throw new NotFoundError("Look not found.");
    if (error instanceof BackendError && error.status === 409)
      throw new ConflictError(error.message);
    throw error;
  }
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

export async function buildLookPreview(lookId: string, optionId?: string) {
  if (optionId && !z.uuid().safeParse(optionId).success)
    throw new InvalidInputError("Choose a valid outfit option.");
  const composition = await requireLook(lookId, optionId);
  const { look, items } = composition;
  return {
    subject: { type: "look" as const, id: look.id },
    title: look.title,
    notes: look.notes,
    is_snapshot: "snapshot_id" in composition,
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
  if (
    (data.status === "running" || data.status === "queued") &&
    Date.now() - new Date(data.created_at).getTime() > 240000
  ) {
    const expired = await createServerSupabase()
      .from("ai_jobs")
      .update({
        status: "failed",
        error_code: "AI_TIMEOUT",
        completed_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId())
      .eq("id", data.id)
      .in("status", ["running", "queued"]);
    if (expired.error) throw new Error("Could not update the expired preview.");
    data.status = "failed";
    data.error_code = "AI_TIMEOUT";
  }
  let imageUrl: string | null = null;
  const input =
    data.input && typeof data.input === "object" && !Array.isArray(data.input)
      ? data.input
      : {};
  let stale = data.source_type !== "live" || !Array.isArray(input.item_ids);
  if (!stale) {
    const parsed = createPreviewJobSchema.safeParse({
      ...input,
      capsule_id: input.capsule_id ?? undefined,
      option_id: input.option_id ?? undefined,
      model_source: "mannequin",
      consent_acknowledged: true,
      limitations_acknowledged: true,
    });
    if (!parsed.success || typeof input.fingerprint !== "string") stale = true;
    else {
      try {
        const { previewFingerprint } = await import("./generation");
        stale = (await previewFingerprint(parsed.data)) !== input.fingerprint;
      } catch {
        stale = true;
      }
    }
  }
  if (
    !stale &&
    typeof input.subject_type === "string" &&
    typeof input.subject_id === "string"
  ) {
    let latest = createServerSupabase()
      .from("ai_jobs")
      .select("id,input")
      .eq("workspace_id", workspaceId())
      .eq("kind", "preview")
      .eq("input->>subject_type", input.subject_type)
      .eq("input->>subject_id", input.subject_id);
    latest =
      typeof input.option_id === "string"
        ? latest.eq("input->>option_id", input.option_id)
        : latest.is("input->>option_id", null);
    if (typeof input.capsule_id === "string")
      latest = latest.eq("input->>capsule_id", input.capsule_id);
    const result = await latest
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (result.error)
      throw new Error("Could not check the current preview selection.");
    const recent = result.data?.input;
    if (
      result.data?.id !== data.id &&
      recent &&
      typeof recent === "object" &&
      !Array.isArray(recent) &&
      recent.fingerprint !== input.fingerprint
    )
      stale = true;
  }
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
    subject_type:
      typeof input.subject_type === "string" ? input.subject_type : undefined,
    subject_id:
      typeof input.subject_id === "string" ? input.subject_id : undefined,
    capsule_id:
      typeof input.capsule_id === "string" ? input.capsule_id : undefined,
    option_id:
      typeof input.option_id === "string" ? input.option_id : undefined,
    item_ids:
      Array.isArray(input.item_ids) &&
      input.item_ids.every((x) => typeof x === "string")
        ? (input.item_ids as string[])
        : undefined,
    mode: typeof input.mode === "string" ? input.mode : undefined,
  };
  return {
    id: data.id,
    kind: data.kind,
    status: z
      .enum(["queued", "running", "succeeded", "failed"])
      .parse(data.status),
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
    .update({
      status: "failed",
      error_code: "RESULT_DELETED",
      output_asset_id: null,
      wardrobe_item_id: null,
      look_id: null,
      option_id: null,
      capsule_outfit_id: null,
      input_asset_id: null,
      completed_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId())
    .eq("id", job.id)
    .eq("kind", "preview");
  if (deleteError) throw new Error("Could not delete the preview.");
}

export async function latestPreview(
  type: string,
  id: string,
  capsuleId?: string,
  optionId?: string,
) {
  const db = createServerSupabase();
  let q = db
    .from("ai_jobs")
    .select("id")
    .eq("workspace_id", workspaceId())
    .eq("kind", "preview")
    .eq("input->>subject_type", type)
    .eq("input->>subject_id", id);
  if (capsuleId) q = q.eq("input->>capsule_id", capsuleId);
  if (optionId) q = q.eq("input->>option_id", optionId);
  else q = q.is("input->>option_id", null);
  const result = await q
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error("Could not restore the preview status.");
  const job = result.data ? await getPreviewJob(result.data.id) : null;
  return job?.error_code === "RESULT_DELETED" ? null : job;
}

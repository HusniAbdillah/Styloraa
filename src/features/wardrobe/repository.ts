import "server-only";
import { getServerEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import {
  imageBytesMatchMimeType,
  type WardrobeItemInput,
  type WardrobeListFilters,
  type WardrobeAssetCleanupCursor,
} from "./schema";
import { wardrobeItemMatchesSearch } from "./search";
import {
  getDemoWardrobeEntry,
  getLocalSeedWardrobeEntryId,
} from "./demo-wardrobe";

const itemFields =
  "id,name,category,color,subcategory,notes,attributes,inferred_attributes,attribute_provenance,asset_id,image_path,created_at,updated_at";

export type WardrobeItem = Pick<
  Tables<"wardrobe_items">,
  | "id"
  | "name"
  | "category"
  | "color"
  | "subcategory"
  | "notes"
  | "attributes"
  | "inferred_attributes"
  | "attribute_provenance"
  | "asset_id"
  | "image_path"
  | "created_at"
  | "updated_at"
>;

export class WardrobeItemNotFoundError extends Error {
  constructor() {
    super("Wardrobe item not found.");
    this.name = "WardrobeItemNotFoundError";
  }
}

function workspaceId() {
  return getServerEnv().STYLORA_WORKSPACE_ID;
}

export async function listWardrobePage(
  filters: WardrobeListFilters = { search: "", limit: 100, offset: 0 },
) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const query = () => {
    let builder = supabase
      .from("wardrobe_items")
      .select(itemFields, { count: "exact" })
      .eq("workspace_id", workspace)
      .is("archived_at", null);
    if (filters.category) builder = builder.eq("category", filters.category);
    return builder.order("created_at", { ascending: false }).order("id");
  };

  if (!filters.search) {
    const { data, count, error } = await query().range(
      filters.offset,
      filters.offset + filters.limit - 1,
    );
    if (error) throw new Error("Could not load the wardrobe.");
    return { items: data, total: count ?? 0 };
  }

  const matches: WardrobeItem[] = [];
  const databasePageSize = 1000;
  let databaseOffset = 0;
  let totalRows = 0;
  do {
    const { data, count, error } = await query().range(
      databaseOffset,
      databaseOffset + databasePageSize - 1,
    );
    if (error) throw new Error("Could not load the wardrobe.");
    totalRows = count ?? databaseOffset + (data?.length ?? 0);
    matches.push(
      ...(data ?? []).filter((item) =>
        wardrobeItemMatchesSearch(item, filters.search),
      ),
    );
    databaseOffset += data?.length ?? 0;
    if (!data?.length) break;
  } while (databaseOffset < totalRows);

  return {
    items: matches.slice(filters.offset, filters.offset + filters.limit),
    total: matches.length,
  };
}

/* Keep the shared inventory contract consumed by Capsules and Preview stable. */
export async function listWardrobeItems(
  filters: WardrobeListFilters = { search: "", limit: 100, offset: 0 },
) {
  const { items } = await listWardrobePage(filters);
  return items;
}

export async function getWardrobeItem(id: string) {
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select(itemFields)
    .eq("id", id)
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe item.");
  return data;
}

export async function insertWardrobeItem(input: WardrobeItemInput) {
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .insert({
      name: input.name,
      category: input.category,
      color: input.color,
      subcategory: input.subcategory || null,
      notes: input.notes ?? "",
      attributes: input.attributes ?? {},
      workspace_id: workspaceId(),
    })
    .select(itemFields)
    .single();
  if (error) throw new Error("Could not save the item.");
  return data;
}

export async function updateWardrobeItem(id: string, input: WardrobeItemInput) {
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .update({
      name: input.name,
      category: input.category,
      color: input.color,
      subcategory: input.subcategory || null,
      notes: input.notes ?? "",
      attributes: input.attributes ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .select(itemFields)
    .maybeSingle();
  if (error) throw new Error("Could not update the item.");
  if (!data) throw new WardrobeItemNotFoundError();
  return data;
}

export async function archiveWardrobeItem(id: string) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const archivedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("wardrobe_items")
    .update({ archived_at: archivedAt })
    .eq("id", id)
    .eq("workspace_id", workspace)
    .is("archived_at", null)
    .select("id,asset_id")
    .maybeSingle();
  if (error) throw new Error("Could not remove the item.");
  if (!data) throw new WardrobeItemNotFoundError();

  if (data.asset_id) {
    const { error: detachError } = await supabase
      .from("wardrobe_items")
      .update({ asset_id: null, image_path: null })
      .eq("id", id)
      .eq("workspace_id", workspace)
      .eq("archived_at", archivedAt)
      .eq("asset_id", data.asset_id);
    if (!detachError) await retireAsset(data.asset_id, workspace);
  }
}

const signedImageLifetimeSeconds = 300;
// The hosted assets.source_type constraint only allows manual/live/sample.
// Upload reservations use manual and are distinguished by age plus references.
const pendingUploadGraceMs = 3 * 60 * 60 * 1000;
const wardrobeBucket = "wardrobe";

export class WardrobeUploadPreparationError extends Error {
  constructor(readonly stage: "asset_record" | "signed_url") {
    super("Could not prepare the wardrobe image upload.");
    this.name = "WardrobeUploadPreparationError";
  }
}

function imageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
}

type AssetRetirementResult =
  "deleted" | "missing" | "referenced" | "pending" | "failed";

async function assetHasReferences(assetId: string, workspace: string) {
  const supabase = createServerSupabase();
  const [items, jobsInput, jobsOutput, looks] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace)
      .eq("asset_id", assetId),
    supabase
      .from("ai_jobs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace)
      .eq("input_asset_id", assetId),
    supabase
      .from("ai_jobs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace)
      .eq("output_asset_id", assetId),
    supabase
      .from("looks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace)
      .eq("inspiration_asset_id", assetId),
  ]);
  if (items.error || jobsInput.error || jobsOutput.error || looks.error)
    throw new Error("Could not verify wardrobe image references.");
  return [items.count, jobsInput.count, jobsOutput.count, looks.count].some(
    (count) => (count ?? 0) > 0,
  );
}

async function retireAsset(
  assetId: string,
  workspace: string,
): Promise<AssetRetirementResult> {
  try {
    const supabase = createServerSupabase();
    const { data: asset, error } = await supabase
      .from("assets")
      .select("id,storage_path,bucket,source_type,created_at")
      .eq("id", assetId)
      .eq("workspace_id", workspace)
      .eq("bucket", wardrobeBucket)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return "failed";
    if (!asset) return "missing";
    if (
      asset.source_type === "manual" &&
      Date.now() - Date.parse(asset.created_at) < pendingUploadGraceMs
    )
      return "pending";
    const { error: archivedDetachError } = await supabase
      .from("wardrobe_items")
      .update({
        asset_id: null,
        image_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspace)
      .eq("asset_id", assetId)
      .not("archived_at", "is", null);
    if (archivedDetachError) return "failed";
    if (await assetHasReferences(assetId, workspace)) return "referenced";

    const { error: removeError } = await supabase.storage
      .from(wardrobeBucket)
      .remove([asset.storage_path]);
    if (
      removeError &&
      removeError.statusCode !== "404" &&
      !removeError.message.toLowerCase().includes("not found")
    )
      return "failed";

    const { error: updateError } = await supabase
      .from("assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("workspace_id", workspace)
      .eq("bucket", wardrobeBucket)
      .is("deleted_at", null);
    if (updateError) return "failed";
    return "deleted";
  } catch {
    // Keep an unreferenced asset row active so a later bounded retry can find it.
    return "failed";
  }
}

async function reserveWardrobeImageUpload(
  input: {
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    byteSize: number;
  },
  expectedAssetId: string | null,
) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const storagePath = `${workspace}/wardrobe/${crypto.randomUUID()}.${imageExtension(input.mimeType)}`;
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspace,
      bucket: wardrobeBucket,
      storage_path: storagePath,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      source_type: "manual",
    })
    .select("id,storage_path,mime_type,byte_size")
    .single();
  if (assetError || !asset)
    throw new WardrobeUploadPreparationError("asset_record");

  const { data: signed, error: signedError } = await supabase.storage
    .from(wardrobeBucket)
    .createSignedUploadUrl(storagePath, { upsert: false });
  if (signedError || !signed) {
    await supabase
      .from("assets")
      .delete()
      .eq("id", asset.id)
      .eq("workspace_id", workspace)
      .eq("bucket", wardrobeBucket)
      .eq("source_type", "manual");
    throw new WardrobeUploadPreparationError("signed_url");
  }

  return {
    assetId: asset.id,
    storagePath: asset.storage_path,
    mimeType: asset.mime_type,
    byteSize: asset.byte_size,
    expectedAssetId,
    uploadUrl: signed.signedUrl,
    uploadToken: signed.token,
    expiresInSeconds: 7200,
  };
}

export async function createWardrobeImageUpload(
  itemId: string,
  input: {
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    byteSize: number;
  },
) {
  const { data: item, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select("id,asset_id")
    .eq("id", itemId)
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe item.");
  if (!item) throw new WardrobeItemNotFoundError();
  return reserveWardrobeImageUpload(input, item.asset_id);
}

export async function createWardrobeImageUploadForNewItem(input: {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
}) {
  return reserveWardrobeImageUpload(input, null);
}

export class WardrobeAssetConflictError extends Error {
  constructor() {
    super("Wardrobe item changed while its image was uploading.");
    this.name = "WardrobeAssetConflictError";
  }
}

async function verifyUnattachedWardrobeImage(
  assetId: string,
  workspace: string,
) {
  const supabase = createServerSupabase();
  const { data: asset, error } = await supabase
    .from("assets")
    .select("id,storage_path,mime_type,byte_size,source_type,created_at")
    .eq("id", assetId)
    .eq("workspace_id", workspace)
    .eq("bucket", wardrobeBucket)
    .eq("source_type", "manual")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe image upload.");
  if (!asset) throw new WardrobeAssetConflictError();
  if (Date.now() - Date.parse(asset.created_at) >= pendingUploadGraceMs)
    throw new WardrobeAssetConflictError();
  if (!asset.storage_path.startsWith(`${workspace}/wardrobe/`))
    throw new Error("Invalid wardrobe image path.");
  if (await assetHasReferences(assetId, workspace))
    throw new WardrobeAssetConflictError();

  const { data: object, error: downloadError } = await supabase.storage
    .from(wardrobeBucket)
    .download(asset.storage_path);
  if (
    downloadError ||
    !object ||
    object.size !== asset.byte_size ||
    (object.type && object.type !== asset.mime_type)
  )
    throw new Error("Uploaded wardrobe image verification failed.");
  const bytes = new Uint8Array(await object.arrayBuffer());
  if (
    !imageBytesMatchMimeType(
      bytes,
      asset.mime_type as "image/jpeg" | "image/png" | "image/webp",
    )
  )
    throw new Error("Uploaded wardrobe image verification failed.");
  return asset;
}

export async function insertWardrobeItemWithImage(
  input: WardrobeItemInput,
  assetId: string,
) {
  const workspace = workspaceId();
  const asset = await verifyUnattachedWardrobeImage(assetId, workspace);
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .insert({
      name: input.name,
      category: input.category,
      color: input.color,
      subcategory: input.subcategory || null,
      notes: input.notes ?? "",
      attributes: input.attributes ?? {},
      asset_id: assetId,
      image_path: asset.storage_path,
      workspace_id: workspace,
    })
    .select(itemFields)
    .single();
  if (error) throw new Error("Could not save the item.");
  return data;
}

export async function saveStaticWardrobeItem(
  staticEntryId: string,
  input: WardrobeItemInput,
) {
  const entry = getDemoWardrobeEntry(staticEntryId);
  if (!entry) throw new WardrobeItemNotFoundError();

  const workspace = workspaceId();
  const supabase = createServerSupabase();
  const provenance = {
    demo_sample: true,
    source: "local_seed",
    demo_image: entry.imageName,
    static_entry_id: entry.id,
  };
  const { data: existing, error: lookupError } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("workspace_id", workspace)
    .is("archived_at", null)
    .contains("attribute_provenance", {
      demo_sample: true,
      source: "local_seed",
      demo_image: entry.imageName,
    })
    .maybeSingle();
  if (lookupError) throw new Error("Could not load the static wardrobe item.");

  const values = {
    name: input.name,
    category: input.category,
    color: input.color,
    subcategory: input.subcategory || null,
    notes: input.notes ?? "",
    attributes: input.attributes ?? entry.attributes,
    attribute_provenance: provenance,
    updated_at: new Date().toISOString(),
  };
  const write = existing
    ? supabase
        .from("wardrobe_items")
        .update(values)
        .eq("id", existing.id)
        .eq("workspace_id", workspace)
        .is("archived_at", null)
    : supabase.from("wardrobe_items").insert({
        ...values,
        workspace_id: workspace,
      });
  const { data, error } = await write.select("id").single();
  if (error || !data) throw new Error("Could not save the wardrobe item.");
  return data.id;
}

export async function listMaterializedStaticWardrobeEntryIds() {
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select("attribute_provenance")
    .eq("workspace_id", workspaceId())
    .contains("attribute_provenance", {
      demo_sample: true,
      source: "local_seed",
    })
    .limit(100);
  if (error) throw new Error("Could not load static wardrobe entries.");
  return new Set(
    data
      .map((item) => getLocalSeedWardrobeEntryId(item.attribute_provenance))
      .filter((id): id is string => id !== null),
  );
}

export async function getSavedStaticWardrobeItemId(staticEntryId: string) {
  const entry = getDemoWardrobeEntry(staticEntryId);
  if (!entry) return null;
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select("id")
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .contains("attribute_provenance", {
      demo_sample: true,
      source: "local_seed",
      demo_image: entry.imageName,
    })
    .maybeSingle();
  if (error) throw new Error("Could not load the static wardrobe item.");
  return data?.id ?? null;
}

export async function getSavedStaticWardrobeItem(staticEntryId: string) {
  const entry = getDemoWardrobeEntry(staticEntryId);
  if (!entry) return null;
  const { data, error } = await createServerSupabase()
    .from("wardrobe_items")
    .select(itemFields)
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .contains("attribute_provenance", {
      demo_sample: true,
      source: "local_seed",
      demo_image: entry.imageName,
    })
    .maybeSingle();
  if (error) throw new Error("Could not load the static wardrobe item.");
  return data;
}

export async function finalizeWardrobeImageUpload(
  itemId: string,
  assetId: string,
  expectedAssetId: string | null,
) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const { data: item, error: itemError } = await supabase
    .from("wardrobe_items")
    .select("id,asset_id")
    .eq("id", itemId)
    .eq("workspace_id", workspace)
    .is("archived_at", null)
    .maybeSingle();
  if (itemError) throw new Error("Could not load the wardrobe item.");
  if (!item) throw new WardrobeItemNotFoundError();
  if (item.asset_id !== expectedAssetId) throw new WardrobeAssetConflictError();

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id,storage_path,mime_type,byte_size,source_type,created_at")
    .eq("id", assetId)
    .eq("workspace_id", workspace)
    .eq("bucket", wardrobeBucket)
    .eq("source_type", "manual")
    .is("deleted_at", null)
    .maybeSingle();
  if (assetError) throw new Error("Could not load the wardrobe image upload.");
  if (!asset) throw new WardrobeAssetConflictError();
  if (Date.now() - Date.parse(asset.created_at) >= pendingUploadGraceMs)
    throw new WardrobeAssetConflictError();
  if (!asset.storage_path.startsWith(`${workspace}/wardrobe/`))
    throw new Error("Invalid wardrobe image path.");

  const { data: object, error: downloadError } = await supabase.storage
    .from(wardrobeBucket)
    .download(asset.storage_path);
  if (
    downloadError ||
    !object ||
    object.size !== asset.byte_size ||
    (object.type && object.type !== asset.mime_type)
  )
    throw new Error("Uploaded wardrobe image verification failed.");
  const bytes = new Uint8Array(await object.arrayBuffer());
  if (
    !imageBytesMatchMimeType(
      bytes,
      asset.mime_type as "image/jpeg" | "image/png" | "image/webp",
    )
  )
    throw new Error("Uploaded wardrobe image verification failed.");

  let attachQuery = supabase
    .from("wardrobe_items")
    .update({
      asset_id: assetId,
      image_path: asset.storage_path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("workspace_id", workspace)
    .is("archived_at", null);
  attachQuery = expectedAssetId
    ? attachQuery.eq("asset_id", expectedAssetId)
    : attachQuery.is("asset_id", null);
  const { data: updatedItem, error: updateError } = await attachQuery
    .select("id")
    .maybeSingle();
  if (updateError) throw new Error("Could not attach the wardrobe image.");
  if (!updatedItem) {
    await retireAsset(assetId, workspace);
    throw new WardrobeAssetConflictError();
  }

  if (expectedAssetId) await retireAsset(expectedAssetId, workspace);
  return { assetId };
}

export async function retryWardrobeAssetCleanup(assetId: string) {
  return retireAsset(assetId, workspaceId());
}

export async function retryOrphanWardrobeAssetCleanup(
  limit = 10,
  cursor?: WardrobeAssetCleanupCursor,
) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 10));
  const stalePendingBefore = new Date(
    Date.now() - pendingUploadGraceMs,
  ).toISOString();
  let query = supabase
    .from("assets")
    .select("id,created_at")
    .eq("workspace_id", workspace)
    .eq("bucket", wardrobeBucket)
    .eq("source_type", "manual")
    .lt("created_at", stalePendingBefore)
    .is("deleted_at", null);
  if (cursor) {
    query = query.or(
      `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
    );
  }
  const { data: candidates, error } = await query
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(boundedLimit + 1);
  if (error)
    throw new Error("Could not list wardrobe image cleanup candidates.");
  const rows = candidates ?? [];
  const hasMore = rows.length > boundedLimit;
  const page = rows.slice(0, boundedLimit);
  const results = [];
  for (const candidate of page) {
    results.push({
      assetId: candidate.id,
      result: await retryWardrobeAssetCleanup(candidate.id),
    });
  }
  const lastScanned = page.at(-1);
  return {
    scanned: page.length,
    deleted: results.filter((entry) => entry.result === "deleted").length,
    skipped: results.filter((entry) =>
      ["missing", "referenced", "pending"].includes(entry.result),
    ).length,
    failed: results.filter((entry) => entry.result === "failed").length,
    nextCursor:
      hasMore && lastScanned
        ? { createdAt: lastScanned.created_at, id: lastScanned.id }
        : null,
  };
}

export async function attachWardrobeImage(
  itemId: string,
  file: {
    bytes: Uint8Array;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  },
) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const { data: item, error: itemError } = await supabase
    .from("wardrobe_items")
    .select("id,asset_id")
    .eq("id", itemId)
    .eq("workspace_id", workspace)
    .is("archived_at", null)
    .maybeSingle();
  if (itemError) throw new Error("Could not load the wardrobe item.");
  if (!item) throw new WardrobeItemNotFoundError();

  const path = `${workspace}/wardrobe/${crypto.randomUUID()}.${imageExtension(file.mimeType)}`;
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspace,
      bucket: wardrobeBucket,
      storage_path: path,
      mime_type: file.mimeType,
      byte_size: file.bytes.byteLength,
      source_type: "manual",
    })
    .select("id")
    .single();
  if (assetError || !asset)
    throw new Error("Could not record the wardrobe image.");

  const { error: uploadError } = await supabase.storage
    .from(wardrobeBucket)
    .upload(path, file.bytes, {
      cacheControl: "300",
      contentType: file.mimeType,
      upsert: false,
    });
  if (uploadError) {
    const { error: objectError } = await supabase.storage
      .from(wardrobeBucket)
      .download(path);
    if (objectError) {
      await supabase
        .from("assets")
        .delete()
        .eq("id", asset.id)
        .eq("workspace_id", workspace)
        .eq("source_type", "manual");
    }
    throw new Error("Could not upload the wardrobe image.");
  }

  try {
    const { data: object, error: verifyError } = await supabase.storage
      .from(wardrobeBucket)
      .download(path);
    if (
      verifyError ||
      !object ||
      object.size !== file.bytes.byteLength ||
      (object.type && object.type !== file.mimeType)
    ) {
      throw new Error("Uploaded image verification failed.");
    }
    const storedBytes = new Uint8Array(await object.arrayBuffer());
    if (!imageBytesMatchMimeType(storedBytes, file.mimeType))
      throw new Error("Uploaded image verification failed.");

    let attachQuery = supabase
      .from("wardrobe_items")
      .update({
        asset_id: asset.id,
        image_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("workspace_id", workspace)
      .is("archived_at", null);
    attachQuery = item.asset_id
      ? attachQuery.eq("asset_id", item.asset_id)
      : attachQuery.is("asset_id", null);
    const { data: updatedItem, error: updateError } = await attachQuery
      .select("id")
      .maybeSingle();
    if (updateError) throw new Error("Could not attach the image.");
    if (!updatedItem)
      throw new Error("Wardrobe item changed while the image was uploading.");

    if (item.asset_id) await retireAsset(item.asset_id, workspace);
    return { assetId: asset.id };
  } catch (error) {
    await retireAsset(asset.id, workspace);
    throw error;
  }
}

export async function removeWardrobeImage(itemId: string) {
  const supabase = createServerSupabase();
  const workspace = workspaceId();
  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select("id,asset_id")
    .eq("id", itemId)
    .eq("workspace_id", workspace)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe item.");
  if (!item) throw new WardrobeItemNotFoundError();
  if (!item.asset_id) return;

  const { data: detachedItem, error: updateError } = await supabase
    .from("wardrobe_items")
    .update({
      asset_id: null,
      image_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("workspace_id", workspace)
    .eq("asset_id", item.asset_id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (updateError) throw new Error("Could not remove the wardrobe image.");
  if (!detachedItem) throw new WardrobeItemNotFoundError();
  await retireAsset(item.asset_id, workspace);
}

export async function getWardrobeImageUrl(assetId: string) {
  const supabase = createServerSupabase();
  const { data: linkedItem, error: itemError } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("asset_id", assetId)
    .eq("workspace_id", workspaceId())
    .is("archived_at", null)
    .maybeSingle();
  if (itemError) throw new Error("Could not load the wardrobe image.");
  if (!linkedItem) return null;

  const { data: asset, error } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", assetId)
    .eq("workspace_id", workspaceId())
    .eq("bucket", "wardrobe")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load the wardrobe image.");
  if (!asset) return null;

  const { data, error: signingError } = await supabase.storage
    .from("wardrobe")
    .createSignedUrl(asset.storage_path, signedImageLifetimeSeconds);
  if (signingError || !data)
    throw new Error("Could not load the wardrobe image.");
  return data.signedUrl;
}

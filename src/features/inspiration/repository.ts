import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type { Database, Json } from "@/types/database";

const bucket = "inspiration";

export async function createInspirationUpload(input: {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
}) {
  const supabase = createServerSupabase();
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const extension =
    input.mimeType === "image/jpeg"
      ? "jpg"
      : input.mimeType === "image/png"
        ? "png"
        : "webp";
  const storagePath = `${workspaceId}/${crypto.randomUUID()}.${extension}`;
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspaceId,
      bucket,
      storage_path: storagePath,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      source_type: "live",
    })
    .select("id,storage_path,mime_type,byte_size")
    .single();
  if (assetError || !asset) throw new Error("ASSET_CREATE_FAILED");

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);
  if (signedError || !signed) {
    await supabase
      .from("assets")
      .delete()
      .eq("id", asset.id)
      .eq("workspace_id", workspaceId);
    throw new Error("UPLOAD_URL_FAILED");
  }
  return { asset, signed };
}

export async function getInspirationAsset(assetId: string) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const { data, error } = await createServerSupabase()
    .from("assets")
    .select(
      "id,workspace_id,bucket,storage_path,mime_type,byte_size,deleted_at",
    )
    .eq("id", assetId)
    .eq("workspace_id", workspaceId)
    .eq("bucket", bucket)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("DATABASE_UNAVAILABLE");
  return data;
}

export async function downloadInspirationAsset(storagePath: string) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  if (!storagePath.startsWith(`${workspaceId}/`))
    throw new Error("ASSET_SCOPE_INVALID");
  const { data, error } = await createServerSupabase()
    .storage.from(bucket)
    .download(storagePath);
  if (error || !data) throw new Error("ASSET_NOT_UPLOADED");
  return Buffer.from(await data.arrayBuffer());
}

export async function persistInspirationRevision(args: {
  lookId: string;
  expectedRevision: number;
  assetId: string;
  title: string;
  notes: string;
  providerMetadata: Json;
  pieces: Json[];
  sourceType: "live" | "manual" | "sample";
}) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("persist_inspiration_revision", {
    p_workspace_id: workspaceId,
    p_look_id: args.lookId,
    p_expected_revision: args.expectedRevision,
    p_asset_id: args.assetId,
    p_title: args.title,
    p_notes: args.notes,
    p_provider_metadata: args.providerMetadata,
    p_pieces: args.pieces as unknown as Json,
    p_source_type: args.sourceType,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("PERSISTENCE_FAILED");
  return row;
}

export async function getLook(lookId: string) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const supabase = createServerSupabase();
  const { data: look, error: lookError } = await supabase
    .from("looks")
    .select(
      "id,title,notes,status,revision,selected_option_id,is_saved,source_type,provider_metadata,inspiration_asset_id,created_at,updated_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", lookId)
    .maybeSingle();
  if (lookError) throw new Error("DATABASE_UNAVAILABLE");
  if (!look) return null;
  const piecesResult = await supabase
    .from("inspiration_pieces")
    .select(
      "id,name,category,attributes,provenance,corrections,confidence,source_type,position",
    )
    .eq("workspace_id", workspaceId)
    .eq("look_id", lookId)
    .is("removed_at", null)
    .order("position");
  if (piecesResult.error) throw new Error("DATABASE_UNAVAILABLE");
  const pieceIds = (piecesResult.data ?? []).map((piece) => piece.id);
  const [matchesResult, optionsResult] = await Promise.all([
    pieceIds.length
      ? supabase
          .from("wardrobe_matches")
          .select(
            "id,piece_id,wardrobe_item_id,match_type,rationale,shared_attributes,differences,confidence,source_revision,is_manual_override,source_type",
          )
          .eq("workspace_id", workspaceId)
          .eq("source_revision", look.revision)
          .in("piece_id", pieceIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("outfit_options")
      .select(
        "id,option_type,title,rationale,inputs_used,uncertainty,provider_metadata,source_type,source_revision,created_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId)
      .eq("source_revision", look.revision),
  ]);
  if (matchesResult.error || optionsResult.error)
    throw new Error("DATABASE_UNAVAILABLE");
  const optionIds = (optionsResult.data ?? []).map((option) => option.id);
  const itemsResult = optionIds.length
    ? await supabase
        .from("outfit_option_items")
        .select(
          "id,option_id,slot_id,piece_id,item_kind,wardrobe_item_id,product_id,missing_brief,requested_brief,requested_category,rationale,position",
        )
        .eq("workspace_id", workspaceId)
        .in("option_id", optionIds)
        .order("position")
    : { data: [], error: null };
  if (itemsResult.error) throw new Error("DATABASE_UNAVAILABLE");
  const wardrobeItemIds = [
    ...new Set([
      ...(matchesResult.data ?? []).flatMap((match) =>
        match.wardrobe_item_id ? [match.wardrobe_item_id] : [],
      ),
      ...(itemsResult.data ?? []).flatMap((item) =>
        item.wardrobe_item_id ? [item.wardrobe_item_id] : [],
      ),
    ]),
  ];
  const wardrobeResult = wardrobeItemIds.length
    ? await supabase
        .from("wardrobe_items")
        .select("id,name,category,color")
        .eq("workspace_id", workspaceId)
        .in("id", wardrobeItemIds)
        .is("archived_at", null)
    : { data: [], error: null };
  if (wardrobeResult.error) throw new Error("DATABASE_UNAVAILABLE");
  const wardrobeById = new Map(
    (wardrobeResult.data ?? []).map((item) => [item.id, item]),
  );
  return {
    ...look,
    pieces: piecesResult.data ?? [],
    matches: (matchesResult.data ?? []).map((match) => ({
      ...match,
      wardrobe_item: match.wardrobe_item_id
        ? (wardrobeById.get(match.wardrobe_item_id) ?? null)
        : null,
    })),
    options: (optionsResult.data ?? []).map((option) => ({
      ...option,
      items: (itemsResult.data ?? []).filter(
        (item) => item.option_id === option.id,
      ).map((item) => ({
        ...item,
        wardrobe_item: item.wardrobe_item_id
          ? (wardrobeById.get(item.wardrobe_item_id) ?? null)
          : null,
      })),
    })),
  };
}

export async function getLookForRevision(lookId: string) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const { data, error } = await createServerSupabase()
    .from("looks")
    .select(
      "id,title,notes,status,revision,source_type,provider_metadata,inspiration_asset_id",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", lookId)
    .maybeSingle();
  if (error) throw new Error("DATABASE_UNAVAILABLE");
  return data;
}

export async function getActivePieces(lookId: string) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const { data, error } = await createServerSupabase()
    .from("inspiration_pieces")
    .select(
      "id,name,category,attributes,provenance,corrections,confidence,source_type,position",
    )
    .eq("workspace_id", workspaceId)
    .eq("look_id", lookId)
    .is("removed_at", null)
    .order("position");
  if (error) throw new Error("DATABASE_UNAVAILABLE");
  return data ?? [];
}

export async function getInventory() {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const supabase = createServerSupabase();
  const [items, preferences] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select(
        "id,name,category,color,subcategory,attributes,inferred_attributes,attribute_provenance,archived_at",
      )
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("user_preferences")
      .select("style_notes,style_dna,fit_preferences,body_profile")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);
  if (items.error || preferences.error) throw new Error("DATABASE_UNAVAILABLE");
  return { items: items.data ?? [], preferences: preferences.data };
}

export async function persistLookResults(args: {
  lookId: string;
  expectedRevision: number;
  replaceMatches: boolean;
  matches: Json[];
  options: Json[];
}) {
  const { data, error } = await createServerSupabase().rpc(
    "persist_look_results",
    {
      p_workspace_id: getServerEnv().STYLORA_WORKSPACE_ID,
      p_look_id: args.lookId,
      p_expected_revision: args.expectedRevision,
      p_replace_matches: args.replaceMatches,
      p_matches: args.matches as unknown as Json,
      p_options: args.options as unknown as Json,
    },
  );
  if (error) throw error;
  return data;
}

export async function updateMatchOverride(args: {
  lookId: string;
  matchId: string;
  expectedRevision: number;
  matchType: "owned_match" | "wardrobe_alternative" | "missing";
  wardrobeItemId: string | null;
  rationale: string;
}) {
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const supabase = createServerSupabase();
  const { data: look, error: lookError } = await supabase
    .from("looks")
    .select("id,revision")
    .eq("workspace_id", workspaceId)
    .eq("id", args.lookId)
    .maybeSingle();
  if (lookError || !look) throw new Error("LOOK_NOT_FOUND");
  if (look.revision !== args.expectedRevision)
    throw new Error("REVISION_CONFLICT");
  const { data: match, error: matchError } = await supabase
    .from("wardrobe_matches")
    .select("id,piece_id")
    .eq("workspace_id", workspaceId)
    .eq("id", args.matchId)
    .maybeSingle();
  if (matchError || !match) throw new Error("MATCH_NOT_FOUND");
  const { data: piece, error: pieceError } = await supabase
    .from("inspiration_pieces")
    .select("id,category")
    .eq("workspace_id", workspaceId)
    .eq("look_id", args.lookId)
    .eq("id", match.piece_id)
    .is("removed_at", null)
    .maybeSingle();
  if (pieceError || !piece) throw new Error("MATCH_NOT_FOUND");
  if (args.wardrobeItemId) {
    const { data: item, error: itemError } = await supabase
      .from("wardrobe_items")
      .select("id,category")
      .eq("workspace_id", workspaceId)
      .eq("id", args.wardrobeItemId)
      .is("archived_at", null)
      .maybeSingle();
    if (itemError || !item || item.category !== piece.category)
      throw new Error("INVALID_WARDROBE_ITEM");
  }
  const { error } = await supabase
    .from("wardrobe_matches")
    .update({
      match_type: args.matchType,
      wardrobe_item_id: args.wardrobeItemId,
      rationale: args.rationale,
      is_manual_override: true,
      source_type: "manual",
    })
    .eq("workspace_id", workspaceId)
    .eq("id", args.matchId)
    .eq("source_revision", args.expectedRevision);
  if (error) throw new Error("MATCH_UPDATE_FAILED");
  return {
    ...match,
    matchType: args.matchType,
    wardrobeItemId: args.wardrobeItemId,
    rationale: args.rationale,
  };
}

export type OutfitOptionInsert =
  Database["public"]["Tables"]["outfit_options"]["Insert"];
export type OutfitOptionItemInsert =
  Database["public"]["Tables"]["outfit_option_items"]["Insert"];

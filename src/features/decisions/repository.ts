import "server-only";
import { z } from "zod";
import { BackendError, checkDatabase, getBackendContext } from "./backend";
import { estimateSpend } from "./spend";
import type { ProductSelectionInput, SaveDecisionInput } from "./schema";
import type { Database } from "@/types/database";
import { safePublicUrl } from "@/features/products/serpapi";

const lookColumns =
  "id,title,notes,status,revision,selected_option_id,is_saved,created_at,updated_at";
const optionColumns =
  "id,look_id,option_type,title,rationale,inputs_used,uncertainty,source_type,source_revision";
const snapshotColumns =
  "id,look_id,option_id,title,source_revision,items,rationale,inputs_used,uncertainty,source_type,created_at";

type Option = Pick<
  Database["public"]["Tables"]["outfit_options"]["Row"],
  | "id"
  | "look_id"
  | "option_type"
  | "title"
  | "rationale"
  | "inputs_used"
  | "uncertainty"
  | "source_type"
  | "source_revision"
>;
type SelectionPiece = {
  id: string;
  slot_id: string;
  item_kind: string;
  wardrobe_item_id: string | null;
  product_id: string | null;
  missing_brief: string | null;
  rationale: string;
  position: number;
};

export function wardrobeImagePath(
  item: { asset_id: string | null; image_path: string | null },
  asset:
    | {
        id: string;
        workspace_id: string;
        bucket: string;
        storage_path: string;
        deleted_at: string | null;
      }
    | undefined,
  workspaceId: string,
) {
  const path = item.asset_id
    ? asset &&
      asset.id === item.asset_id &&
      asset.workspace_id === workspaceId &&
      asset.bucket === "wardrobe" &&
      !asset.deleted_at
      ? asset.storage_path
      : null
    : item.image_path;
  return path &&
    path.startsWith(`${workspaceId}/`) &&
    path.length > workspaceId.length + 1 &&
    !/[\\?#%\u0000-\u0020]/.test(path) &&
    path
      .split("/")
      .every((segment) => segment !== "." && segment !== ".." && segment !== "")
    ? path
    : null;
}

export async function getSelectedLook(
  lookId: string,
  requestedOptionId?: string,
) {
  const { db, workspaceId } = getBackendContext();
  const lookResult = await db
    .from("looks")
    .select(lookColumns)
    .eq("workspace_id", workspaceId)
    .eq("id", lookId)
    .maybeSingle();
  checkDatabase(lookResult.error, "This look is unavailable.");
  const look = lookResult.data;
  if (!look) throw new BackendError(404, "look_not_found", "Look not found.");

  const optionId = requestedOptionId ?? look.selected_option_id;
  let option: Option | null = null;
  let pieces: SelectionPiece[];
  if (optionId) {
    const optionResult = await db
      .from("outfit_options")
      .select(optionColumns)
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId)
      .eq("id", optionId)
      .maybeSingle();
    checkDatabase(optionResult.error, "This outfit is unavailable.");
    option = optionResult.data;
    if (!option)
      throw new BackendError(
        404,
        "option_not_found",
        "Outfit option not found.",
      );
    const itemResult = await db
      .from("outfit_option_items")
      .select(
        "id,slot_id,item_kind,wardrobe_item_id,product_id,missing_brief,rationale,position",
      )
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId)
      .eq("option_id", optionId)
      .order("position")
      .order("id")
      .limit(21);
    checkDatabase(itemResult.error, "The outfit items are unavailable.");
    pieces = itemResult.data ?? [];
  } else {
    const manual = await db
      .from("look_items")
      .select("wardrobe_item_id,position")
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId)
      .order("position")
      .limit(21);
    checkDatabase(manual.error, "The outfit items are unavailable.");
    pieces = (manual.data ?? []).map((item) => ({
      id: item.wardrobe_item_id,
      slot_id: `owned:${item.wardrobe_item_id}`,
      item_kind: "owned",
      wardrobe_item_id: item.wardrobe_item_id,
      product_id: null,
      missing_brief: null,
      rationale: "",
      position: item.position,
    }));
  }
  if (pieces.length > 20)
    throw new BackendError(
      409,
      "invalid_composition",
      "This outfit needs to be rebuilt.",
    );
  const wardrobeIds = pieces.flatMap((piece) =>
    piece.wardrobe_item_id ? [piece.wardrobe_item_id] : [],
  );
  const productIds = pieces.flatMap((piece) =>
    piece.product_id ? [piece.product_id] : [],
  );

  const [wardrobeResult, productResult] = await Promise.all([
    wardrobeIds.length
      ? db
          .from("wardrobe_items")
          .select("id,name,category,color,asset_id,image_path,archived_at")
          .eq("workspace_id", workspaceId)
          .in("id", wardrobeIds)
      : Promise.resolve({ data: [], error: null }),
    productIds.length
      ? db
          .from("products")
          .select(
            "id,title,category,source_label,source_type,price_minor,currency,retrieved_at,product_url,image_url",
          )
          .eq("workspace_id", workspaceId)
          .in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  checkDatabase(wardrobeResult.error, "Wardrobe items are unavailable.");
  checkDatabase(productResult.error, "Selected products are unavailable.");
  const wardrobes = new Map(
    (wardrobeResult.data ?? []).map((item) => [item.id, item]),
  );
  const products = new Map(
    (productResult.data ?? []).map((item) => [item.id, item]),
  );
  const assetIds = [
    ...new Set(
      (wardrobeResult.data ?? []).flatMap((item) =>
        item.asset_id ? [item.asset_id] : [],
      ),
    ),
  ];
  const assets = assetIds.length
    ? await db
        .from("assets")
        .select("id,workspace_id,bucket,storage_path,deleted_at")
        .eq("workspace_id", workspaceId)
        .in("id", assetIds)
    : { data: [], error: null };
  checkDatabase(assets.error, "Wardrobe images are unavailable.");
  const assetMap = new Map(
    (assets.data ?? []).map((asset) => [asset.id, asset]),
  );
  const ownedImages = new Map<string, { url: string; expiresAt: string }>();
  await Promise.all(
    [...wardrobes.values()].map(async (item) => {
      const path = wardrobeImagePath(
        item,
        item.asset_id ? assetMap.get(item.asset_id) : undefined,
        workspaceId,
      );
      if (!path) return;
      const expiresAt = new Date(Date.now() + 300000).toISOString();
      const signed = await db.storage
        .from("wardrobe")
        .createSignedUrl(path, 300);
      if (!signed.error && signed.data?.signedUrl) {
        ownedImages.set(item.id, { url: signed.data.signedUrl, expiresAt });
      }
    }),
  );
  const items = pieces.map((piece) => {
    const owned = piece.wardrobe_item_id
      ? wardrobes.get(piece.wardrobe_item_id)
      : undefined;
    const product = piece.product_id
      ? products.get(piece.product_id)
      : undefined;
    return {
      id: piece.id,
      slot_id: piece.slot_id,
      kind: piece.item_kind,
      wardrobe_item_id: piece.wardrobe_item_id,
      product_id: piece.product_id,
      name: owned?.name ?? product?.title ?? piece.missing_brief,
      category: owned?.category ?? product?.category ?? null,
      color: owned?.color ?? null,
      asset_id: owned?.asset_id ?? null,
      image_url: owned
        ? (ownedImages.get(owned.id)?.url ?? null)
        : safePublicUrl(product?.image_url),
      image_url_expires_at: owned
        ? (ownedImages.get(owned.id)?.expiresAt ?? null)
        : null,
      product_url: safePublicUrl(product?.product_url),
      available:
        piece.item_kind === "owned"
          ? Boolean(owned && !owned.archived_at)
          : piece.item_kind === "product"
            ? Boolean(product)
            : false,
      ownership:
        piece.item_kind === "owned"
          ? "owned"
          : piece.item_kind === "product"
            ? "suggested"
            : "missing",
      rationale: piece.rationale,
      position: piece.position,
      price_minor: product?.price_minor ?? null,
      currency: product?.currency ?? null,
      source_label: product?.source_label ?? null,
      source_type: product?.source_type ?? null,
      retrieved_at: product?.retrieved_at ?? null,
    };
  });
  return {
    look,
    selected_option: option,
    items,
    spend: items.length ? estimateSpend(items) : null,
    stale: option ? option.source_revision !== look.revision : false,
  };
}

export async function selectOutfitProducts(
  lookId: string,
  input: ProductSelectionInput,
) {
  const { db, workspaceId } = getBackendContext(true);
  const result = await db.rpc("select_outfit_products", {
    p_workspace_id: workspaceId,
    p_look_id: lookId,
    p_option_id: input.option_id,
    p_expected_revision: input.expected_revision,
    p_choices: input.choices,
  });
  checkDatabase(
    result.error,
    "Choose available products for this outfit's missing pieces.",
  );
  if (!result.data)
    throw new BackendError(404, "option_not_found", "Outfit option not found.");
  return getSelectedLook(lookId, input.option_id);
}

export async function saveSelectedLook(
  lookId: string,
  input: SaveDecisionInput,
) {
  const { db, workspaceId } = getBackendContext(true);
  const option = await db
    .from("outfit_options")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("look_id", lookId)
    .eq("id", input.option_id)
    .maybeSingle();
  checkDatabase(option.error, "This outfit is unavailable.");
  if (!option.data)
    throw new BackendError(404, "option_not_found", "Outfit option not found.");
  const result = await db.rpc("save_outfit_option", {
    p_workspace_id: workspaceId,
    p_option_id: input.option_id,
    p_expected_revision: input.expected_revision,
  });
  checkDatabase(
    result.error,
    "This outfit cannot be saved. Check its selected pieces.",
  );
  if (!result.data)
    throw new BackendError(
      503,
      "save_unavailable",
      "The saved outfit could not be read.",
    );
  return {
    saved_look_id: result.data,
    look_id: lookId,
    option_id: input.option_id,
  };
}

const snapshotItemSchema = z.object({
  slot_id: z.string().optional(),
  kind: z.enum(["owned", "product", "missing"]),
  wardrobe_item_id: z.uuid().nullable().optional(),
  product_id: z.uuid().nullable().optional(),
  name: z.string(),
  category: z.string(),
  color: z.string().nullable().optional(),
  price_minor: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .nullable()
    .optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable()
    .optional(),
});

type SnapshotRow = {
  id: string;
  look_id: string;
  option_id: string | null;
  title: string;
  source_revision: number;
  items: unknown;
  rationale: string;
  inputs_used: unknown;
  uncertainty: string;
  source_type: string;
  created_at: string;
};

function mapSnapshot(snapshot: SnapshotRow) {
  const parsed = z
    .array(snapshotItemSchema)
    .min(1)
    .max(20)
    .safeParse(snapshot.items);
  if (!parsed.success)
    throw new BackendError(
      503,
      "snapshot_unavailable",
      "This saved outfit could not be read.",
    );
  return {
    ...snapshot,
    items: parsed.data.map((item) => ({
      ...item,
      ownership:
        item.kind === "owned"
          ? "owned"
          : item.kind === "product"
            ? "suggested"
            : "missing",
    })),
    spend: estimateSpend(parsed.data),
  };
}

export async function listSavedLooks(limit: number, offset: number) {
  const { db, workspaceId } = getBackendContext();
  const result = await db
    .from("saved_look_snapshots")
    .select(snapshotColumns, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .order("id")
    .range(offset, offset + limit - 1);
  checkDatabase(result.error, "Saved outfits could not be loaded.");
  return {
    items: (result.data ?? []).map(mapSnapshot),
    total: result.count ?? 0,
    limit,
    offset,
  };
}

export async function getSavedLook(savedLookId: string) {
  const { db, workspaceId } = getBackendContext();
  const result = await db
    .from("saved_look_snapshots")
    .select(snapshotColumns)
    .eq("workspace_id", workspaceId)
    .eq("id", savedLookId)
    .maybeSingle();
  checkDatabase(result.error, "This saved outfit is unavailable.");
  if (!result.data)
    throw new BackendError(
      404,
      "saved_look_not_found",
      "Saved outfit not found.",
    );
  return mapSnapshot(result.data);
}

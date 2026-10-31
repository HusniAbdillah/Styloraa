import "server-only";
import { wardrobeImagePath } from "@/features/decisions/repository";
import { notFound } from "next/navigation";
import { isDatabaseConfigured, getServerEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { isMetaTextConfigured } from "@/lib/ai/meta";
import { listWardrobeItems } from "@/features/wardrobe/repository";
import { buildLookPreview } from "@/features/preview/repository";
import { getCapsule, listCapsules } from "./repository";
import {
  getCapsuleOutfit,
  listCapsuleOutfits,
} from "@/features/outfits/repository";
import {
  capsuleBriefSchema,
  missingAdditionSchema,
  uuidSchema,
} from "./schema";
import type { CapsuleDetail, StudioItem, StudioCapabilities } from "./types";

export function studioCapabilities(): StudioCapabilities {
  if (!isDatabaseConfigured()) return { writes: false, textAi: false };
  return {
    writes: getServerEnv().DEMO_WRITES_ENABLED === "true",
    textAi: isMetaTextConfigured(),
  };
}

export async function withItemImages<T extends StudioItem>(
  items: T[],
): Promise<T[]> {
  if (!items.length) return items;
  const db = createServerSupabase();
  const workspace = getServerEnv().STYLORA_WORKSPACE_ID;
  const { data, error } = await db
    .from("wardrobe_items")
    .select("id,image_path,asset_id")
    .eq("workspace_id", workspace)
    .in(
      "id",
      items.map((item) => item.id),
    );
  if (error) return items;
  const assetIds = (data ?? []).flatMap((row) =>
    row.asset_id ? [row.asset_id] : [],
  );
  const assets = assetIds.length
    ? await db
        .from("assets")
        .select("id,workspace_id,bucket,storage_path,deleted_at")
        .eq("workspace_id", workspace)
        .in("id", assetIds)
    : { data: [], error: null };
  if (assets.error) return items;
  const paths = (data ?? []).flatMap((row) => {
    const path = wardrobeImagePath(
      row,
      assets.data?.find((asset) => asset.id === row.asset_id),
      workspace,
    );
    return path ? [{ id: row.id, image_path: path }] : [];
  });
  if (!paths.length) return items;
  const { data: signed } = await db.storage.from("wardrobe").createSignedUrls(
    paths.map((row) => row.image_path!),
    1800,
  );
  const urls = new Map(
    paths.map((row, index) => [row.id, signed?.[index]?.signedUrl ?? null]),
  );
  return items.map((item) => ({
    ...item,
    imageUrl: urls.get(item.id) ?? null,
  }));
}

export async function loadStudioInventory() {
  const items = await listWardrobeItems();
  return withItemImages(items.map((item) => ({ ...item, available: true })));
}

export async function loadCapsuleIndex() {
  if (!isDatabaseConfigured())
    return {
      error: "Capsule Studio is currently unavailable. Please try again later.",
      capsules: [],
      inventory: [],
    };
  try {
    const [capsules, inventory] = await Promise.all([
      listCapsules(),
      loadStudioInventory(),
    ]);
    return { error: null, capsules, inventory };
  } catch {
    return {
      error:
        "We could not load your capsules. Check the connection and try again.",
      capsules: [],
      inventory: [],
    };
  }
}

export async function loadCapsule(capsuleId: string): Promise<CapsuleDetail> {
  if (!uuidSchema.safeParse(capsuleId).success) notFound();
  try {
    const capsule = await getCapsule(capsuleId);
    const brief = capsuleBriefSchema.safeParse(capsule.brief);
    return {
      ...capsule,
      missing_additions: missingAdditionSchema
        .array()
        .parse(capsule.missing_additions),
      brief: brief.success ? brief.data : { purpose: capsule.title, notes: "" },
      items: await withItemImages(capsule.items),
    };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function loadCapsuleOutfits(capsuleId: string) {
  return listCapsuleOutfits(capsuleId);
}

export async function loadOutfit(capsuleId: string, outfitId: string) {
  if (
    !uuidSchema.safeParse(outfitId).success ||
    !uuidSchema.safeParse(capsuleId).success
  )
    notFound();
  try {
    const outfit = await getCapsuleOutfit(capsuleId, outfitId);
    return { ...outfit, items: await withItemImages(outfit.items) };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function selectedLookItems(lookId: string, optionId?: string) {
  if (!uuidSchema.safeParse(lookId).success) notFound();
  try {
    const look = await buildLookPreview(lookId, optionId);
    if (!look.items.length || look.items.some((item) => !item.available))
      throw new NotFoundError("Look items are unavailable.");
    return look;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

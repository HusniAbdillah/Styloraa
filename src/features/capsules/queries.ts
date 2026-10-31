import "server-only";
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
import { capsuleBriefSchema, uuidSchema } from "./schema";
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
    .select("id,image_path")
    .eq("workspace_id", workspace)
    .in(
      "id",
      items.map((item) => item.id),
    );
  if (error) return items;
  const paths = (data ?? []).filter(
    (row) =>
      row.image_path?.startsWith(`${workspace}/`) &&
      !row.image_path.includes(".."),
  );
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

export async function selectedLookItems(lookId: string) {
  if (!uuidSchema.safeParse(lookId).success) notFound();
  try {
    const look = await buildLookPreview(lookId);
    if (!look.items.length || look.items.some((item) => !item.available))
      throw new NotFoundError("Look items are unavailable.");
    return look;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

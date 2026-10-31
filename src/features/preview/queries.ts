import "server-only";
import { isMuseConfigured } from "@/lib/ai/muse";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/lib/errors";
import { uuidSchema } from "@/features/capsules/schema";
import {
  withItemImages,
  loadStudioInventory,
} from "@/features/capsules/queries";
import { getCapsuleInventory } from "@/features/capsules/repository";
import {
  latestPreview,
  buildItemPreview,
  buildLookPreview,
  buildOutfitPreview,
} from "./repository";
import type { PreviewScreenData } from "./types";

export async function loadPreview(
  type: "wardrobe_item" | "look" | "capsule_outfit",
  id: string,
  capsuleId?: string,
  optionId?: string,
): Promise<PreviewScreenData> {
  if (
    !uuidSchema.safeParse(id).success ||
    (capsuleId && !uuidSchema.safeParse(capsuleId).success)
  )
    notFound();
  try {
    const composition =
      type === "wardrobe_item"
        ? await buildItemPreview(id)
        : type === "look"
          ? await buildLookPreview(id, optionId)
          : await buildOutfitPreview(capsuleId!, id);
    const items = await withItemImages(composition.items);
    const pool =
      type === "capsule_outfit"
        ? await withItemImages(await getCapsuleInventory(capsuleId!))
        : type === "look"
          ? await loadStudioInventory()
          : items;
    return {
      visualAi: isMuseConfigured(),
      latestJob: await latestPreview(type, id, capsuleId, optionId),
      subject: { type, id, optionId, ...(capsuleId ? { capsuleId } : {}) },
      title: composition.title,
      items,
      pool,
      endpoint:
        type === "wardrobe_item"
          ? `/api/wardrobe/${id}/preview`
          : type === "look"
            ? `/api/looks/${id}/preview`
            : `/api/capsules/${capsuleId}/outfits/${id}/preview`,
      back:
        type === "wardrobe_item"
          ? { href: "/wardrobe", label: "Back to wardrobe" }
          : type === "look"
            ? {
                href:
                  "is_snapshot" in composition && composition.is_snapshot
                    ? `/saved-looks/${id}`
                    : `/looks/${id}${optionId ? `?option_id=${optionId}` : ""}`,
                label: "Back to look",
              }
            : {
                href: `/capsules/${capsuleId}/outfits/${id}`,
                label: "Back to combination",
              },
    };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

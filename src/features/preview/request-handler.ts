import "server-only";
import { createPreviewJobSchema } from "./schema";
import {
  buildItemPreview,
  buildLookPreview,
  buildOutfitPreview,
} from "./repository";
import { getCapsuleInventory } from "@/features/capsules/repository";
import { listWardrobeItems } from "@/features/wardrobe/repository";
import {
  requireOwnedPreviewItems,
  validatePreviewSelection,
} from "./ownership";
import {
  checkDatabase,
  checkWrites,
  isUuid,
  invalidId,
  jsonError,
  mapRouteError,
  parseJsonBody,
} from "@/app/api/helpers";

type Subject = {
  type: "wardrobe_item" | "look" | "capsule_outfit";
  id: string;
  capsuleId?: string;
};

export async function requestOwnedPreview(request: Request, subject: Subject) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  if (!isUuid(subject.id) || (subject.capsuleId && !isUuid(subject.capsuleId)))
    return invalidId();
  const parsed = createPreviewJobSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success)
    return jsonError(
      "INVALID_INPUT",
      400,
      "Choose a preview mode and acknowledge image processing and its limitations.",
    );
  const input = parsed.data;
  if (
    input.subject_type !== subject.type ||
    input.subject_id !== subject.id ||
    input.capsule_id !== subject.capsuleId
  ) {
    return jsonError(
      "INVALID_INPUT",
      400,
      "Preview subject must match the current page.",
    );
  }
  try {
    const composition =
      subject.type === "wardrobe_item"
        ? await buildItemPreview(subject.id)
        : subject.type === "look"
          ? await buildLookPreview(subject.id)
          : await buildOutfitPreview(subject.capsuleId!, subject.id);
    requireOwnedPreviewItems(composition.items);
    const selection =
      input.item_ids ??
      (input.mode === "single"
        ? [composition.items[0].id]
        : composition.items.map((item) => item.id));
    const pool =
      subject.type === "capsule_outfit"
        ? (await getCapsuleInventory(subject.capsuleId!)).filter(
            (item) => item.available,
          )
        : subject.type === "look"
          ? (await listWardrobeItems()).map((item) => ({
              ...item,
              available: true,
            }))
          : composition.items;
    validatePreviewSelection(pool, selection, input.mode);
    return jsonError(
      "VISUAL_PROVIDER_NOT_CONFIGURED",
      503,
      "Visual previews are currently unavailable. Your selected pieces have been kept.",
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

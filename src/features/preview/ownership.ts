import { ConflictError, InvalidInputError } from "@/lib/errors";
import type { PreviewCompositionItem } from "./repository";

export function selectedOwnedPieces(
  items: Array<{
    ownership: string;
    wardrobe_item_id: string | null;
    name: string | null;
    category: string | null;
    color: string | null;
    available: boolean;
  }>,
  stale: boolean,
) {
  if (stale)
    throw new ConflictError(
      "This look has changed. Review its current pieces before previewing it.",
    );
  return items.map((item) => {
    if (
      item.ownership !== "owned" ||
      !item.wardrobe_item_id ||
      item.name === null ||
      item.category === null ||
      item.color === null
    )
      throw new InvalidInputError(
        "Only entirely owned looks can be previewed or saved as a capsule.",
      );
    return {
      id: item.wardrobe_item_id,
      name: item.name,
      category: item.category,
      color: item.color,
      available: item.available,
    };
  });
}

export function requireOwnedPreviewItems(items: PreviewCompositionItem[]) {
  if (!items.length || items.some((item) => !item.available)) {
    throw new InvalidInputError(
      "Preview is available only for owned, available wardrobe pieces.",
    );
  }
}

export function validatePreviewSelection(
  items: PreviewCompositionItem[],
  selectedIds: string[],
  mode: "single" | "combo",
) {
  requireOwnedPreviewItems(items);
  const inventory = new Set(items.map((item) => item.id));
  if (
    !selectedIds.length ||
    new Set(selectedIds).size !== selectedIds.length ||
    selectedIds.some((id) => !inventory.has(id))
  ) {
    throw new InvalidInputError(
      "Every preview piece must be owned and available in this context.",
    );
  }
  if (
    (mode === "single" && selectedIds.length !== 1) ||
    (mode === "combo" && selectedIds.length < 2)
  ) {
    throw new InvalidInputError(
      "Choose one piece for a single preview, or at least two for an outfit preview.",
    );
  }
}

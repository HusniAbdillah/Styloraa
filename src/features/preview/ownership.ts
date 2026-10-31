import { InvalidInputError } from "@/lib/errors";
import type { PreviewCompositionItem } from "./repository";

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

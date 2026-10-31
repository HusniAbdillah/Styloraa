import { describe, expect, it } from "vitest";
import { wardrobeItemMatchesSearch } from "./search";

const item = {
  name: "Blue denim A-line skirt",
  category: "bottom",
  color: "Blue",
  subcategory: "Denim skirt",
  notes: "Easy to pair with a tucked tee.",
  attributes: {
    material: "denim",
    pattern: "solid",
    style: ["casual", "classic"],
  },
  inferred_attributes: { silhouette: "A-line" },
};

describe("wardrobe item search", () => {
  it("matches each clothing detail field and structured attributes", () => {
    for (const search of [
      "blue denim",
      "bottom",
      "blue",
      "denim skirt",
      "tucked tee",
      "material denim",
      "casual",
      "silhouette A-line",
    ]) {
      expect(wardrobeItemMatchesSearch(item, search)).toBe(true);
    }
  });

  it("matches case-insensitively and ignores blank searches", () => {
    expect(wardrobeItemMatchesSearch(item, "  CLASSIC ")).toBe(true);
    expect(wardrobeItemMatchesSearch(item, "   ")).toBe(true);
  });

  it("returns false when no clothing detail contains the search phrase", () => {
    expect(wardrobeItemMatchesSearch(item, "wool coat")).toBe(false);
  });
});

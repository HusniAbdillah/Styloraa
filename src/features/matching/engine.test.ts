import { describe, expect, it } from "vitest";
import { rankWardrobeMatches } from "./engine";

const piece = {
  id: "55000000-0000-4000-8000-000000000001",
  name: "Ivory relaxed shirt",
  category: "top",
  confidence: 0.9,
  attributes: { colors: ["ivory"], pattern: "solid", silhouette: "relaxed", fit: "relaxed", styleTags: ["classic"] },
};

describe("wardrobe matching ranking", () => {
  it("ranks close same-category pieces as owned matches and labels synthetic input", () => {
    const result = rankWardrobeMatches([piece], [{
      id: "56000000-0000-4000-8000-000000000001",
      name: "Sample ivory shirt",
      category: "top",
      color: "ivory",
      subcategory: "shirt",
      attributes: { pattern: "solid", silhouette: "relaxed", fit: "relaxed", styleTags: ["classic"] },
      inferred_attributes: {},
      attribute_provenance: { demo_sample: true },
    }]);
    expect(result[0].matchType).toBe("owned_match");
    expect(result[0].sourceType).toBe("sample");
    expect(result[0].sharedAttributes.color).toContain("ivory");
  });

  it("returns an honest missing match when no wardrobe candidate exists", () => {
    const result = rankWardrobeMatches([piece], []);
    expect(result[0].matchType).toBe("missing");
    expect(result[0].wardrobeItemId).toBeNull();
    expect(result[0].sourceType).toBe("live");
  });

  it("uses another same-category item as an alternative when evidence is weak", () => {
    const result = rankWardrobeMatches([piece], [{
      id: "56000000-0000-4000-8000-000000000002",
      name: "Blue fitted shirt",
      category: "top",
      color: "blue",
      subcategory: "shirt",
      attributes: { pattern: "striped", fit: "fitted" },
      inferred_attributes: {},
      attribute_provenance: {},
    }]);
    expect(result[0].matchType).toBe("wardrobe_alternative");
    expect(result[0].differences.color).toContain("ivory");
  });
});

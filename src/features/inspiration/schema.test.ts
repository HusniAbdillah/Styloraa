import { describe, expect, it } from "vitest";
import { outfitResponseSchema } from "./prompts";
import {
  analyzeRequestSchema,
  garmentAnalysisSchema,
  uploadRequestSchema,
} from "./schema";

describe("inspiration contracts", () => {
  it("accepts supported image metadata up to the private bucket limit", () => {
    expect(
      uploadRequestSchema.safeParse({
        fileName: "look.png",
        mimeType: "image/png",
        byteSize: 10 * 1024 * 1024,
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported formats and oversized uploads", () => {
    expect(
      uploadRequestSchema.safeParse({
        fileName: "look.gif",
        mimeType: "image/gif",
        byteSize: 20,
      }).success,
    ).toBe(false);
    expect(
      uploadRequestSchema.safeParse({
        fileName: "look.png",
        mimeType: "image/png",
        byteSize: 10 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });

  it("requires structured garment detail and bounded confidence", () => {
    const incomplete = {
      title: "Look",
      summary: "",
      pieces: [{ name: "Shirt", category: "top" }],
    };
    expect(garmentAnalysisSchema.safeParse(incomplete).success).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({ assetId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("requires non-empty item rationales and distinct option titles", () => {
    const option = {
      optionType: "closest",
      title: "Reference led",
      rationale: "It keeps the reference color story.",
      uncertainty: "Material is visually uncertain.",
      profileSignalsUsed: [],
      items: [
        {
          slotId: "top",
          pieceId: null,
          itemKind: "missing",
          wardrobeItemId: null,
          missingBrief: "Ivory top",
          rationale: " ",
        },
      ],
    };
    const duplicated = [
      option,
      { ...option, optionType: "from_wardrobe" },
      { ...option, optionType: "fresh_alternative" },
    ];
    expect(
      outfitResponseSchema.safeParse({ options: duplicated }).success,
    ).toBe(false);
    const complete = duplicated.map((item, index) => ({
      ...item,
      title: ["Reference led", "Use your wardrobe", "Try a fresh layer"][index],
      items: [
        { ...item.items[0], rationale: "This detail follows the reference." },
      ],
    }));
    expect(outfitResponseSchema.safeParse({ options: complete }).success).toBe(
      true,
    );
  });

  it("keeps generated missing items searchable by the shopping contract", () => {
    const item = {
      slotId: "outerwear",
      pieceId: null,
      itemKind: "missing",
      wardrobeItemId: null,
      missingBrief: "Neutral lightweight jacket",
      rationale: "Adds a practical outer layer.",
    };
    const options = ["closest", "from_wardrobe", "fresh_alternative"].map(
      (optionType) => ({
        optionType,
        title: optionType,
        rationale: "Uses the reference silhouette.",
        uncertainty: "Fabric is uncertain.",
        profileSignalsUsed: [],
        items: optionType === "from_wardrobe" ? [] : [item],
      }),
    );
    expect(outfitResponseSchema.safeParse({ options }).success).toBe(true);
    expect(
      outfitResponseSchema.safeParse({
        options: options.map((option) => ({
          ...option,
          items: option.items.map((row) => ({ ...row, slotId: "extra-layer" })),
        })),
      }).success,
    ).toBe(false);
    expect(
      outfitResponseSchema.safeParse({
        options: options.map((option) => ({
          ...option,
          items: option.items.map((row) => ({
            ...row,
            missingBrief: "x".repeat(1000),
          })),
        })),
      }).success,
    ).toBe(true);
  });
});

import { z } from "zod";
import { garmentAnalysisSchema, garmentCategories } from "./schema";

const nullable = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const listOfText = { type: "array", items: { type: "string" } } as const;

export const garmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "pieces"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    pieces: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "category",
          "subcategory",
          "colors",
          "pattern",
          "apparentMaterial",
          "texture",
          "silhouette",
          "fit",
          "length",
          "cut",
          "sleeve",
          "neckline",
          "rise",
          "layeringRole",
          "styleTags",
          "occasion",
          "season",
          "confidence",
          "uncertainty",
          "evidence",
        ],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: [...garmentCategories] },
          subcategory: nullable,
          colors: listOfText,
          pattern: nullable,
          apparentMaterial: nullable,
          texture: nullable,
          silhouette: nullable,
          fit: nullable,
          length: nullable,
          cut: nullable,
          sleeve: nullable,
          neckline: nullable,
          rise: nullable,
          layeringRole: nullable,
          styleTags: listOfText,
          occasion: nullable,
          season: nullable,
          confidence: { type: "number", minimum: 0, maximum: 1 },
          uncertainty: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
  },
} as const;

export const analysisResponseSchema = garmentAnalysisSchema;

export const matchRationaleSchema = z.object({
  explanations: z
    .array(
      z.object({
        pieceId: z.uuid(),
        whyThis: z.string().trim().min(1).max(3000),
        profileSignalsUsed: z
          .array(
            z.enum([
              "styleDna",
              "undertone",
              "skinDepth",
              "fitPreferences",
              "bodyProfile",
            ]),
          )
          .max(5),
      }),
    )
    .max(20),
});

export const matchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["explanations"],
  properties: {
    explanations: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pieceId", "whyThis", "profileSignalsUsed"],
        properties: {
          pieceId: { type: "string" },
          whyThis: { type: "string" },
          profileSignalsUsed: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "styleDna",
                "undertone",
                "skinDepth",
                "fitPreferences",
                "bodyProfile",
              ],
            },
          },
        },
      },
    },
  },
} as const;

export const outfitResponseSchema = z
  .object({
    options: z
      .array(
        z.object({
          optionType: z.enum(["closest", "from_wardrobe", "fresh_alternative"]),
          title: z.string().trim().min(1).max(160),
          rationale: z.string().trim().min(1).max(3500),
          uncertainty: z.string().max(3500),
          profileSignalsUsed: z
            .array(
              z.enum([
                "styleDna",
                "undertone",
                "skinDepth",
                "fitPreferences",
                "bodyProfile",
              ]),
            )
            .max(5),
          items: z
            .array(
              z.object({
                slotId: z.string().trim().min(1).max(80),
                pieceId: z.uuid().nullable(),
                itemKind: z.enum(["owned", "missing"]),
                wardrobeItemId: z.uuid().nullable(),
                missingBrief: z.string().trim().min(1).max(1000).nullable(),
                rationale: z.string().trim().min(1).max(3500),
              }),
            )
            .max(20),
        }),
      )
      .length(3),
  })
  .superRefine((value, context) => {
    value.options.forEach((option, optionIndex) => {
      option.items.forEach((item, itemIndex) => {
        if (
          item.itemKind === "missing" &&
          !item.pieceId &&
          ![
            "top",
            "bottom",
            "dress",
            "outerwear",
            "shoes",
            "accessory",
            "bag",
          ].includes(item.slotId)
        ) {
          context.addIssue({
            code: "custom",
            path: ["options", optionIndex, "items", itemIndex, "slotId"],
            message:
              "A missing item without a reference piece needs a canonical garment category as its slot ID.",
          });
        }
      });
    });
    const titles = value.options.map((option) =>
      option.title.toLocaleLowerCase(),
    );
    if (new Set(titles).size !== titles.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Each recommendation needs a distinct title.",
      });
    }
  });

export const outfitJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["options"],
  properties: {
    options: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "optionType",
          "title",
          "rationale",
          "uncertainty",
          "profileSignalsUsed",
          "items",
        ],
        properties: {
          optionType: {
            type: "string",
            enum: ["closest", "from_wardrobe", "fresh_alternative"],
          },
          title: { type: "string" },
          rationale: { type: "string" },
          uncertainty: { type: "string" },
          profileSignalsUsed: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "styleDna",
                "undertone",
                "skinDepth",
                "fitPreferences",
                "bodyProfile",
              ],
            },
          },
          items: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "slotId",
                "pieceId",
                "itemKind",
                "wardrobeItemId",
                "missingBrief",
                "rationale",
              ],
              properties: {
                slotId: { type: "string" },
                pieceId: { anyOf: [{ type: "string" }, { type: "null" }] },
                itemKind: { type: "string", enum: ["owned", "missing"] },
                wardrobeItemId: {
                  anyOf: [{ type: "string" }, { type: "null" }],
                },
                missingBrief: { anyOf: [{ type: "string" }, { type: "null" }] },
                rationale: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

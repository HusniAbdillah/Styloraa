import { z } from "zod";

export const garmentCategories = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
] as const;

export const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_INSPIRATION_BYTES = 10 * 1024 * 1024;

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(supportedImageTypes),
  byteSize: z.number().int().min(1).max(MAX_INSPIRATION_BYTES),
});

export const analyzeRequestSchema = z.object({
  assetId: z.uuid(),
  occasion: z.string().trim().max(100).optional().default(""),
});

const nullableText = z.string().trim().max(120).nullable();

export const detectedGarmentSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.enum(garmentCategories),
  subcategory: nullableText,
  colors: z.array(z.string().trim().min(1).max(40)).max(5),
  pattern: nullableText,
  apparentMaterial: nullableText,
  texture: nullableText,
  silhouette: nullableText,
  fit: nullableText,
  length: nullableText,
  cut: nullableText,
  sleeve: nullableText,
  neckline: nullableText,
  rise: nullableText,
  layeringRole: nullableText,
  styleTags: z.array(z.string().trim().min(1).max(40)).max(8),
  occasion: nullableText,
  season: nullableText,
  confidence: z.number().min(0).max(1),
  uncertainty: z.string().trim().max(1000),
  evidence: z.string().trim().min(1).max(1000),
});

export const garmentAnalysisSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(1000),
  pieces: z.array(detectedGarmentSchema).min(1).max(20),
});

export const editablePieceSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(160),
  category: z.enum(garmentCategories),
  attributes: z.record(z.string(), z.unknown()),
  provenance: z.record(z.string(), z.unknown()),
  corrections: z.record(z.string(), z.unknown()).default({}),
  confidence: z.number().min(0).max(1).nullable(),
  sourceType: z.enum(["manual", "live", "sample"]).default("manual"),
});

export const revisePiecesSchema = z.object({
  expectedRevision: z.number().int().positive(),
  pieces: z.array(editablePieceSchema).max(20),
});

export const matchOverrideSchema = z.object({
  matchType: z.enum(["owned_match", "wardrobe_alternative", "missing"]),
  wardrobeItemId: z.uuid().nullable(),
  rationale: z.string().trim().min(1).max(4000),
}).superRefine((value, context) => {
  if (value.matchType === "missing" && value.wardrobeItemId !== null) {
    context.addIssue({ code: "custom", path: ["wardrobeItemId"], message: "Missing matches cannot reference a wardrobe item." });
  }
  if (value.matchType !== "missing" && value.wardrobeItemId === null) {
    context.addIssue({ code: "custom", path: ["wardrobeItemId"], message: "A selected wardrobe item is required for this match." });
  }
});

export type DetectedGarment = z.infer<typeof detectedGarmentSchema>;

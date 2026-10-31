import { z } from "zod";

export const categories = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
] as const;

const attributeValueSchema = z.union([
  z.string().trim().max(240),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().max(80)).max(20),
]);

export const garmentAttributesSchema = z
  .record(z.string().trim().min(1).max(80), attributeValueSchema)
  .refine((value) => JSON.stringify(value).length <= 8_000, {
    message: "Item attributes must be 8 KB or smaller.",
  });

export const wardrobeItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100),
  category: z.enum(categories),
  color: z.string().trim().min(1, "Color is required.").max(40),
  subcategory: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(4_000).optional(),
  attributes: garmentAttributesSchema.optional(),
});

export const wardrobeListFiltersSchema = z.object({
  search: z.string().trim().max(100).default(""),
  category: z.enum(categories).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const wardrobeItemIdSchema = z.string().uuid("Invalid wardrobe item.");

export const wardrobeImageMetadataSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
});

export function imageBytesMatchMimeType(
  bytes: Uint8Array,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
) {
  if (mimeType === "image/jpeg")
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  if (mimeType === "image/png")
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  );
}

export const wardrobeAssetIdSchema = z.string().uuid("Invalid wardrobe image.");

export const wardrobeImageFinalizeSchema = z
  .object({
    expectedAssetId: z.string().uuid().nullable(),
  })
  .strict();

export const wardrobeAssetCleanupCursorSchema = z.object({
  createdAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  id: z.string().uuid(),
});

export type WardrobeItemInput = z.infer<typeof wardrobeItemSchema>;
export type WardrobeListFilters = z.infer<typeof wardrobeListFiltersSchema>;
export type WardrobeAssetCleanupCursor = z.infer<
  typeof wardrobeAssetCleanupCursorSchema
>;

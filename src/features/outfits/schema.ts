import { z } from "zod";
import { uuidSchema } from "../capsules/schema";

export const outfitSourceSchema = z.enum(["manual", "live", "sample"]);

export const createOutfitSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    rationale: z.string().trim().min(1).max(4000),
    item_ids: z.array(uuidSchema).min(1).max(20).default([]),
    from_saved_look_id: uuidSchema.optional(),
    source_type: outfitSourceSchema.default("manual"),
    uncertainty: z.string().trim().max(4000).default(""),
    draft_token: z.string().max(24000).optional(),
  })
  .refine((value) => value.item_ids.length > 0 || value.from_saved_look_id, {
    message: "Provide outfit items or a saved look to copy.",
  })
  .refine(
    (value) => new Set(value.item_ids).size === value.item_ids.length,
    "Choose each wardrobe item once.",
  );

export type CreateOutfitInput = z.infer<typeof createOutfitSchema>;

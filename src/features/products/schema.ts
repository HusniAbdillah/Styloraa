import { z } from "zod";

export const productLookId = z.uuid();
export const compareQuerySchema = z.object({ option_id: z.uuid() }).strict();
export const valueWeightsSchema = z
  .object({
    price: z.number().min(0).max(1),
    rating: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
  })
  .strict()
  .refine(
    (value) =>
      Math.round(value.price * 1e6) +
        Math.round(value.rating * 1e6) +
        Math.round(value.relevance * 1e6) ===
      1e6,
    "Value Score weights must sum to one.",
  )
  .transform((value) => ({
    price: Math.round(value.price * 1e6) / 1e6,
    rating: Math.round(value.rating * 1e6) / 1e6,
    relevance: Math.round(value.relevance * 1e6) / 1e6,
  }));
export const marketplaceSearchSchema = z
  .object({
    option_id: z.uuid(),
    option_item_id: z.uuid(),
    q: z.string().trim().min(2).max(120).optional(),
    weights: valueWeightsSchema.optional(),
  })
  .strict();

export type MarketplaceSearchInput = z.infer<typeof marketplaceSearchSchema>;

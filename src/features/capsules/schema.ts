import { z } from "zod";

export const uuidSchema = z.uuid();

export const capsuleBriefSchema = z.object({
  purpose: z.string().trim().min(1).max(240),
  notes: z.string().trim().max(1000).default(""),
  style_preferences: z.string().trim().max(300).default(""),
  fit_preferences: z.string().trim().max(300).default(""),
  color_preferences: z.string().trim().max(300).default(""),
  avoid: z.string().trim().max(300).default(""),
});

export const capsuleFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  timeframe: z.string().trim().max(120).nullish(),
  season: z.string().trim().max(120).nullish(),
  occasion: z.string().trim().max(120).nullish(),
};

export const createCapsuleSchema = z
  .object({
    ...capsuleFields,
    brief: capsuleBriefSchema,
    item_ids: z.array(uuidSchema).max(100).default([]),
    from_saved_look_id: uuidSchema.optional(),
  })
  .refine((value) => value.item_ids.length > 0 || value.from_saved_look_id, {
    message: "Provide owned items or a saved look to start the capsule.",
  })
  .refine(
    (value) => new Set(value.item_ids).size === value.item_ids.length,
    "Choose each wardrobe item once.",
  );

export const updateCapsuleSchema = z
  .object({
    expected_revision: z.number().int().positive().optional(),
    title: capsuleFields.title.optional(),
    description: z.string().trim().max(4000).optional(),
    brief: capsuleBriefSchema.optional(),
    timeframe: capsuleFields.timeframe,
    season: capsuleFields.season,
    occasion: capsuleFields.occasion,
    item_ids: z.array(uuidSchema).min(1).max(100).optional(),
  })
  .refine(
    (value) => Object.values(value).some((entry) => entry !== undefined),
    {
      message: "Provide at least one field to update.",
    },
  )
  .refine(
    (value) =>
      !value.item_ids || new Set(value.item_ids).size === value.item_ids.length,
    "Choose each wardrobe item once.",
  );

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;
export type UpdateCapsuleInput = z.infer<typeof updateCapsuleSchema>;

export const combinationRequestSchema = z.object({
  request_id: z.uuid().default(() => crypto.randomUUID()),
  item_ids: z.array(uuidSchema).min(1).max(100).optional(),
  required_item_ids: z.array(uuidSchema).max(20).default([]),
  excluded_item_ids: z.array(uuidSchema).max(100).default([]),
  count: z.number().int().min(1).max(6).default(3),
  source: z.literal("ai").default("ai"),
});

export type CombinationRequestInput = z.infer<typeof combinationRequestSchema>;

/** Raw AI combination payload before ownership verification. */
export const missingAdditionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  rationale: z.string().trim().min(1).max(1000),
  related_item_ids: z.array(uuidSchema).min(1).max(20),
  uncertainty: z.string().trim().max(1000),
});
export const aiCombinationSchema = z.object({
  missing_additions: z.array(missingAdditionSchema).max(3).default([]),
  combinations: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        rationale: z.string().trim().min(1).max(4000),
        item_ids: z.array(uuidSchema).min(1).max(20),
        uncertainty: z.string().trim().max(4000).default(""),
      }),
    )
    .min(1)
    .max(6),
});

export type AiCombination = z.infer<typeof aiCombinationSchema>;

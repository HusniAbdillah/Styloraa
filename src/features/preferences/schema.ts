import { z } from "zod";

const preferenceLabel = z.string().trim().min(1).max(48);
const preferenceList = z.array(preferenceLabel).max(20);

export const styleDnaSchema = z
  .object({
    style_tags: preferenceList.optional(),
    preferred_color_families: preferenceList.optional(),
    contrast_level: z.enum(["low", "medium", "high", "unsure"]).optional(),
    undertone: z.enum(["warm", "cool", "neutral", "unsure"]).optional(),
    skin_depth: z
      .enum([
        "very_light",
        "light",
        "light_medium",
        "medium",
        "medium_deep",
        "deep",
        "unsure",
      ])
      .optional(),
  })
  .strip();

export const fitPreferencesSchema = z
  .object({
    preferred_fit: preferenceList.optional(),
    coverage: preferenceList.optional(),
    preferred_lengths: preferenceList.optional(),
    layering: preferenceList.optional(),
  })
  .strip();

export const bodyProfileSchema = z
  .object({
    body_shape: z.string().trim().min(1).max(80).optional(),
    proportions: z.string().trim().min(1).max(80).optional(),
    illustration: z.string().trim().min(1).max(80).optional(),
  })
  .strip();

export const preferencesSchema = z
  .object({
    style_dna: styleDnaSchema.default({}),
    fit_preferences: fitPreferencesSchema.default({}),
    body_profile: bodyProfileSchema.default({}),
  })
  .strip();

export type PreferencesInput = z.infer<typeof preferencesSchema>;

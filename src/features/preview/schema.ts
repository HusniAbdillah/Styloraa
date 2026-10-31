import { z } from "zod";
import { uuidSchema } from "../capsules/schema";

export const previewModeSchema = z.enum(["single", "combo"]);
export const previewSubjectSchema = z.enum([
  "wardrobe_item",
  "look",
  "capsule_outfit",
]);

export const createPreviewJobSchema = z.object({
  request_id: z.uuid().default(() => crypto.randomUUID()),
  subject_type: previewSubjectSchema,
  subject_id: uuidSchema,
  capsule_id: uuidSchema.optional(),
  option_id: uuidSchema.optional(),
  mode: previewModeSchema,
  model_source: z.enum(["mannequin", "provider_model"]).default("mannequin"),
  item_ids: z.array(uuidSchema).min(1).max(20).optional(),
  consent_acknowledged: z.literal(true, {
    message: "Image processing consent is required.",
  }),
  limitations_acknowledged: z.literal(true, {
    message: "Preview limitations must be acknowledged.",
  }),
});

export type CreatePreviewJobInput = z.infer<typeof createPreviewJobSchema>;

export const previewJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
] as const;

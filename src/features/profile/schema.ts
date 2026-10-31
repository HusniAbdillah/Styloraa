import { z } from "zod";

export const profileNameSchema = z
  .string()
  .trim()
  .max(80, "Display name must be 80 characters or fewer.")
  .transform((value) => (value.length ? value : null));

export type ProfileName = z.infer<typeof profileNameSchema>;

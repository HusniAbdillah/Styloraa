import { z } from "zod";

export const shareResourceIdSchema = z.uuid();
export const shareTokenSchema = z.string().regex(/^[0-9a-f]{64}$/);

export const createShareSchema = z.strictObject({
  catchphrase: z.string().trim().max(240).default(""),
  expires_in_hours: z.number().int().min(1).max(720).default(168),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;

const publicItemSchema = z.object({
  name: z.string().max(1000),
  category: z.string().max(80),
  color: z.string().max(80).nullable(),
  kind: z.enum(["owned", "product", "missing"]),
});

export const publicShareSchema = z.object({
  public_snapshot: z.object({
    title: z.string().max(160),
    source_type: z.enum(["manual", "live", "sample"]),
    items: z.array(publicItemSchema).min(1).max(20),
  }),
  catchphrase: z.string().max(240),
});

export type PublicShare = z.infer<typeof publicShareSchema>;

export function projectPublicShare(value: unknown): PublicShare | null {
  const result = publicShareSchema.safeParse(value);
  return result.success ? result.data : null;
}

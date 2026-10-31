import { z } from "zod";
export const categories = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
] as const;
export const wardrobeItemSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  category: z.enum(categories),
  color: z.string().trim().min(1, "Warna wajib diisi.").max(40),
});
export type WardrobeItemInput = z.infer<typeof wardrobeItemSchema>;

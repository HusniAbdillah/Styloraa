"use server";
import { revalidatePath } from "next/cache";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { wardrobeItemSchema } from "./schema";
import { insertWardrobeItem } from "./repository";

export type WardrobeActionState = { ok: boolean; message: string };
export async function addWardrobeItem(_previous: WardrobeActionState, formData: FormData): Promise<WardrobeActionState> {
  const input = wardrobeItemSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { ok: false, message: input.error.issues[0].message };
  if (!isDatabaseConfigured()) return { ok: false, message: "Database belum dikonfigurasi." };
  try {
    if (getServerEnv().DEMO_WRITES_ENABLED !== "true") return { ok: false, message: "Penulisan demo belum diaktifkan." };
    await insertWardrobeItem(input.data);
    revalidatePath("/wardrobe");
    return { ok: true, message: "Item ditambahkan ke wardrobe bersama." };
  } catch {
    return { ok: false, message: "Item belum dapat disimpan. Periksa konfigurasi dan migrasi database." };
  }
}

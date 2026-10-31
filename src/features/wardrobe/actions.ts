"use server";
import { revalidatePath } from "next/cache";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { wardrobeItemSchema } from "./schema";
import { insertWardrobeItem } from "./repository";

export type WardrobeActionState = { ok: boolean; message: string };
export async function addWardrobeItem(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const input = wardrobeItemSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return { ok: false, message: input.error.issues[0].message };
  if (!isDatabaseConfigured())
    return { ok: false, message: "Database is not configured." };
  try {
    if (getServerEnv().DEMO_WRITES_ENABLED !== "true")
      return { ok: false, message: "Demo writes are not enabled." };
    await insertWardrobeItem(input.data);
    revalidatePath("/wardrobe");
    return { ok: true, message: "Item added to the shared wardrobe." };
  } catch {
    return {
      ok: false,
      message:
        "Could not save the item. Check the database configuration and migrations.",
    };
  }
}

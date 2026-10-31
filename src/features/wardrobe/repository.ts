import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type { WardrobeItemInput } from "./schema";

export async function listWardrobeItems() {
  const { data, error } = await createServerSupabase().from("wardrobe_items")
    .select("id,name,category,color,image_path,created_at")
    .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Wardrobe belum dapat dimuat.");
  return data;
}
export async function insertWardrobeItem(input: WardrobeItemInput) {
  const { error } = await createServerSupabase().from("wardrobe_items").insert({
    ...input, workspace_id: getServerEnv().STYLORA_WORKSPACE_ID,
  });
  if (error) throw new Error("Item belum dapat disimpan.");
}

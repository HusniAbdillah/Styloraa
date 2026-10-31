import "server-only";
import { getServerEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ProfileName } from "./schema";

export type ProfileRecord = Pick<Tables<"user_preferences">, "display_name">;

const emptyProfile: ProfileRecord = { display_name: null };

export async function getProfile(): Promise<ProfileRecord> {
  const { data, error } = await createServerSupabase()
    .from("user_preferences")
    .select("display_name")
    .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
    .maybeSingle();

  if (error) throw new Error("Could not load the profile.");
  return data ?? emptyProfile;
}

export async function updateProfileName(displayName: ProfileName) {
  const supabase = createServerSupabase();
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const values = {
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .update(values)
    .eq("workspace_id", workspaceId)
    .select("display_name")
    .maybeSingle();
  if (error) throw new Error("Could not save the profile name.");
  if (data) return data;

  // The demo workspace is seeded with a preferences row. Keep this insert
  // fallback safe for a newly provisioned workspace without overwriting any
  // existing preferences via an upsert.
  const { data: inserted, error: insertError } = await supabase
    .from("user_preferences")
    .insert({ workspace_id: workspaceId, display_name: displayName })
    .select("display_name")
    .single();
  if (!insertError && inserted) return inserted;

  // Preferences may have initialized the shared singleton concurrently.
  // Retry only the display-name update so its other fields remain intact.
  const { data: racedInsert, error: retryError } = await supabase
    .from("user_preferences")
    .update(values)
    .eq("workspace_id", workspaceId)
    .select("display_name")
    .maybeSingle();
  if (retryError || !racedInsert)
    throw new Error("Could not save the profile name.");
  return racedInsert;
}

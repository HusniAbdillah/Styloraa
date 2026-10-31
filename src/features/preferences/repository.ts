import "server-only";
import { getServerEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { PreferencesInput } from "./schema";

export type PreferencesRecord = Pick<
  Tables<"user_preferences">,
  "style_dna" | "fit_preferences" | "body_profile"
> & { updated_at: string | null };

const emptyPreferences: PreferencesRecord = {
  style_dna: {},
  fit_preferences: {},
  body_profile: {},
  updated_at: null,
};

export async function getPreferences(): Promise<PreferencesRecord> {
  const { data, error } = await createServerSupabase()
    .from("user_preferences")
    .select("style_dna,fit_preferences,body_profile,updated_at")
    .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
    .maybeSingle();

  if (error) throw new Error("Could not load preferences.");
  return data ?? emptyPreferences;
}

export async function savePreferences(input: PreferencesInput) {
  const supabase = createServerSupabase();
  const workspaceId = getServerEnv().STYLORA_WORKSPACE_ID;
  const values = { ...input, updated_at: new Date().toISOString() };
  const fields = "style_dna,fit_preferences,body_profile,updated_at";

  const { data, error } = await supabase
    .from("user_preferences")
    .update(values)
    .eq("workspace_id", workspaceId)
    .select(fields)
    .maybeSingle();
  if (error) throw new Error("Could not save preferences.");
  if (data) return data;

  const { data: inserted, error: insertError } = await supabase
    .from("user_preferences")
    .insert({ ...values, workspace_id: workspaceId })
    .select(fields)
    .single();
  if (!insertError && inserted) return inserted;

  // If another request created the singleton after the update, retry the
  // partial update so a concurrent profile name is preserved.
  const { data: racedInsert, error: retryError } = await supabase
    .from("user_preferences")
    .update(values)
    .eq("workspace_id", workspaceId)
    .select(fields)
    .maybeSingle();
  if (retryError || !racedInsert)
    throw new Error("Could not save preferences.");
  return racedInsert;
}

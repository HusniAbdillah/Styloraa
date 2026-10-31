"use server";

import { revalidatePath } from "next/cache";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { preferencesSchema } from "./schema";
import { savePreferences as savePreferencesToDatabase } from "./repository";

export type PreferencesActionState = { ok: boolean; message: string };

function writesEnabled() {
  if (!isDatabaseConfigured()) return false;
  try {
    return getServerEnv().DEMO_WRITES_ENABLED === "true";
  } catch {
    return false;
  }
}

function parsePreferences(formData: FormData) {
  const input: Record<string, unknown> = {};
  for (const section of [
    "style_dna",
    "fit_preferences",
    "body_profile",
  ] as const) {
    const raw = formData.get(section);
    if (typeof raw !== "string" || !raw.trim()) continue;
    try {
      input[section] = JSON.parse(raw);
    } catch {
      return {
        success: false as const,
        message: `The ${section.replaceAll("_", " ")} value must be valid JSON.`,
      };
    }
  }

  const parsed = preferencesSchema.safeParse(input);
  return parsed.success
    ? { success: true as const, data: parsed.data }
    : {
        success: false as const,
        message:
          parsed.error.issues[0]?.message ?? "Invalid preference details.",
      };
}

export async function savePreferences(
  _previous: PreferencesActionState,
  formData: FormData,
): Promise<PreferencesActionState> {
  const parsed = parsePreferences(formData);
  if (!parsed.success) return { ok: false, message: parsed.message };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };

  try {
    await savePreferencesToDatabase(parsed.data);
    revalidatePath("/preferences");
    revalidatePath("/create");
    revalidatePath("/capsules");
    return { ok: true, message: "Shared style preferences saved." };
  } catch {
    return {
      ok: false,
      message: "Could not save preferences. Please try again.",
    };
  }
}

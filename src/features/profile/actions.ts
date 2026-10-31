"use server";

import { revalidatePath } from "next/cache";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { profileNameSchema } from "./schema";
import { updateProfileName } from "./repository";

export type ProfileActionState = { ok: boolean; message: string };

function writesEnabled() {
  if (!isDatabaseConfigured()) return false;
  try {
    return getServerEnv().DEMO_WRITES_ENABLED === "true";
  } catch {
    return false;
  }
}

export async function saveProfileName(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileNameSchema.safeParse(formData.get("display_name"));
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter a valid display name.",
    };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };

  try {
    await updateProfileName(parsed.data);
    revalidatePath("/profile");
    revalidatePath("/preferences");
    return {
      ok: true,
      message: parsed.data
        ? "Shared profile name saved."
        : "Shared profile name cleared.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not save the profile name. Please try again.",
    };
  }
}

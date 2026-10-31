import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ConflictError } from "@/lib/errors";

export async function clearOutfitPreviews(outfitIds: string[]) {
  if (!outfitIds.length) return;
  const { data, error } = await createServerSupabase()
    .from("ai_jobs")
    .select("id,status,created_at")
    .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
    .eq("kind", "preview")
    .in("capsule_outfit_id", outfitIds);
  if (error) throw new Error("Could not check the combination previews.");
  if (
    data.some(
      (job) =>
        (job.status === "running" || job.status === "queued") &&
        Date.now() - new Date(job.created_at).getTime() <= 240000,
    )
  )
    throw new ConflictError(
      "Wait for the active preview to finish before removing this combination.",
    );
  const { deletePreviewResult, getPreviewJob } = await import("./repository");
  for (const job of data) {
    if (job.status === "running" || job.status === "queued")
      await getPreviewJob(job.id);
    await deletePreviewResult(job.id);
  }
}

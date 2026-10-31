import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!z.uuid().safeParse(jobId).success)
    return Response.json({ error: { code: "INVALID_ID" } }, { status: 400 });
  if (!isDatabaseConfigured())
    return Response.json(
      { error: { code: "NOT_CONFIGURED" } },
      { status: 503 },
    );
  try {
    const { data, error } = await createServerSupabase()
      .from("ai_jobs")
      .select("id,kind,status,error_code,created_at,updated_at")
      .eq("id", jobId)
      .eq("workspace_id", getServerEnv().STYLORA_WORKSPACE_ID)
      .maybeSingle();
    if (error) throw error;
    return Response.json(data ? { data } : { error: { code: "NOT_FOUND" } }, {
      status: data ? 200 : 404,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: { code: "DATABASE_UNAVAILABLE" } },
      { status: 503 },
    );
  }
}

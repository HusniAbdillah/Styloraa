import { z } from "zod";
import { jsonError, readJson, requireWritableWorkspace } from "@/features/inspiration/http";
import { updateMatchOverride, getLook } from "@/features/inspiration/repository";
import { matchOverrideSchema } from "@/features/inspiration/schema";

export const runtime = "nodejs";

const requestSchema = matchOverrideSchema.extend({ expectedRevision: z.number().int().positive() });

export async function PATCH(request: Request, { params }: { params: Promise<{ lookId: string; matchId: string }> }) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const { lookId, matchId } = await params;
  if (!z.uuid().safeParse(lookId).success || !z.uuid().safeParse(matchId).success) return jsonError("INVALID_ID", 400);
  const parsed = requestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_MATCH_OVERRIDE", 400);
  try {
    const look = await getLook(lookId);
    if (!look) return jsonError("LOOK_NOT_FOUND", 404);
    if (look.revision !== parsed.data.expectedRevision) return jsonError("REVISION_CONFLICT", 409);
    if (look.options.length) return jsonError("RECOMMENDATIONS_ALREADY_GENERATED", 409);
    const updated = await updateMatchOverride({
      lookId, matchId, expectedRevision: parsed.data.expectedRevision,
      matchType: parsed.data.matchType,
      wardrobeItemId: parsed.data.wardrobeItemId,
      rationale: parsed.data.rationale,
    });
    return Response.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "REVISION_CONFLICT") return jsonError(code, 409);
    if (code === "LOOK_NOT_FOUND") return jsonError(code, 404);
    if (code === "INVALID_WARDROBE_ITEM") return jsonError(code, 400);
    if (code === "MATCH_NOT_FOUND") return jsonError(code, 404);
    return jsonError("DATABASE_UNAVAILABLE", 503);
  }
}

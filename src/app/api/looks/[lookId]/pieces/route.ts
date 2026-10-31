import { randomUUID } from "node:crypto";
import { z } from "zod";
import { jsonError, readJson, requireWritableWorkspace } from "@/features/inspiration/http";
import { getActivePieces, getLook, getLookForRevision, persistInspirationRevision } from "@/features/inspiration/repository";
import { revisePiecesSchema } from "@/features/inspiration/schema";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ lookId: string }> }) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const { lookId } = await params;
  if (!z.uuid().safeParse(lookId).success) return jsonError("INVALID_ID", 400);
  const parsed = revisePiecesSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_PIECES", 400);
  const look = await getLookForRevision(lookId);
  if (!look) return jsonError("LOOK_NOT_FOUND", 404);
  if (!look.inspiration_asset_id) return jsonError("INSPIRATION_ASSET_REQUIRED", 409);
  if (look.revision !== parsed.data.expectedRevision) return jsonError("REVISION_CONFLICT", 409);
  const existing = await getActivePieces(lookId);
  const existingById = new Map(existing.map((piece) => [piece.id, piece]));
  const ids = parsed.data.pieces.flatMap((piece) => piece.id ? [piece.id] : []);
  if (new Set(ids).size !== ids.length || ids.some((id) => !existingById.has(id))) return jsonError("INVALID_PIECE_REFERENCE", 400);

  const pieces = parsed.data.pieces.map((piece) => {
    const previous = piece.id ? existingById.get(piece.id) : undefined;
    return {
      id: piece.id ?? randomUUID(),
      name: piece.name,
      category: piece.category,
      attributes: piece.attributes,
      provenance: piece.provenance,
      corrections: piece.corrections,
      confidence: piece.confidence,
      source_type: previous?.source_type ?? "manual",
    } as unknown as Json;
  });
  try {
    await persistInspirationRevision({
      lookId,
      expectedRevision: parsed.data.expectedRevision,
      assetId: look.inspiration_asset_id,
      title: look.title,
      notes: look.notes,
      providerMetadata: look.provider_metadata as Json,
      pieces,
      sourceType: look.source_type as "live" | "manual" | "sample",
    });
    const updated = await getLook(lookId);
    return Response.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error.code === "PT409" || error.code === "40001")) return jsonError("REVISION_CONFLICT", 409);
    return jsonError("PERSISTENCE_FAILED", 503);
  }
}

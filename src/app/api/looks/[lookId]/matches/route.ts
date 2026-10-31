import { z } from "zod";
import { availableProfileSignals, profileContext, rankWardrobeMatches } from "@/features/matching/engine";
import { jsonError, providerErrorResponse, readJson, requireWritableWorkspace } from "@/features/inspiration/http";
import { getActivePieces, getInventory, getLook, getLookForRevision, persistLookResults } from "@/features/inspiration/repository";
import { matchJsonSchema, matchRationaleSchema } from "@/features/inspiration/prompts";
import { requestStructuredOutput } from "@/features/inspiration/muse";
import { isMuseConfigured } from "@/lib/env";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const matchRequestSchema = z.object({ expectedRevision: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: Promise<{ lookId: string }> }) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const { lookId } = await params;
  if (!z.uuid().safeParse(lookId).success) return jsonError("INVALID_ID", 400);
  const parsed = matchRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_MATCH_REQUEST", 400);
  if (!isMuseConfigured()) return jsonError("MUSE_NOT_CONFIGURED", 503);

  try {
    const look = await getLookForRevision(lookId);
    if (!look) return jsonError("LOOK_NOT_FOUND", 404);
    if (look.revision !== parsed.data.expectedRevision) return jsonError("REVISION_CONFLICT", 409);
    const pieces = await getActivePieces(lookId);
    if (pieces.length === 0) return jsonError("NO_ACTIVE_PIECES", 409);
    const { items, preferences } = await getInventory();
    const ranked = rankWardrobeMatches(pieces, items);
    const profile = profileContext(preferences as unknown as Record<string, unknown> | null);
    const allowedSignals = availableProfileSignals(profile);
    const candidateById = new Map(items.map((item) => [item.id, item]));
    const promptInput = ranked.map((match) => {
      const piece = pieces.find((entry) => entry.id === match.pieceId)!;
      const item = match.wardrobeItemId ? candidateById.get(match.wardrobeItemId) : null;
      return {
        piece: { id: piece.id, name: piece.name, category: piece.category, attributes: piece.attributes },
        selectedMatch: {
          type: match.matchType,
          item: item ? { id: item.id, name: item.name, category: item.category, color: item.color, subcategory: item.subcategory, attributes: item.attributes } : null,
          sharedAttributes: match.sharedAttributes,
          differences: match.differences,
        },
      };
    });
    const rationale = await requestStructuredOutput({
      schemaName: "stylora_wardrobe_match_explanations",
      schema: matchJsonSchema,
      prompt: [
        "Write one concise, honest fashion explanation for every already-computed match below.",
        "Do not change match decisions or create item IDs. Ground reasons only in visible attributes and the provided selected wardrobe item.",
        "Use profileSignalsUsed only for profile fields present in the user profile. Never infer skin, undertone, body shape, or measurements.",
        "Explain color relationships, silhouette/fit, texture, layering, and practical reuse when supported. State uncertainty when details are inferred.",
        `Allowed profile signal keys: ${JSON.stringify(allowedSignals)}.`,
        `User profile: ${JSON.stringify(profile)}.`,
        `Computed matches: ${JSON.stringify(promptInput)}.`,
      ].join("\n"),
      parse: (value) => matchRationaleSchema.parse(value),
    });
    const explanations = new Map(rationale.value.explanations.map((entry) => [entry.pieceId, entry]));
    if (explanations.size !== pieces.length || pieces.some((piece) => !explanations.has(piece.id))) return jsonError("MUSE_INVALID_OUTPUT", 502);
    const matches = ranked.map((match) => {
      const explanation = explanations.get(match.pieceId)!;
      if (explanation.profileSignalsUsed.some((signal) => !allowedSignals.includes(signal))) throw new Error("MUSE_PROFILE_SIGNAL_MISMATCH");
      const selectedSignals = explanation.profileSignalsUsed.length ? explanation.profileSignalsUsed.join(", ") : "none; personalization was not applied";
      return {
        piece_id: match.pieceId,
        wardrobe_item_id: match.wardrobeItemId,
        match_type: match.matchType,
        rationale: `Why this? ${explanation.whyThis} Profile signals used: ${selectedSignals}.`,
        shared_attributes: match.sharedAttributes,
        differences: match.differences,
        confidence: match.confidence,
        is_manual_override: false,
        source_type: match.sourceType,
      } as unknown as Json;
    });
    await persistLookResults({ lookId, expectedRevision: look.revision, replaceMatches: true, matches, options: [] });
    const updated = await getLook(lookId);
    return Response.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "MUSE_PROFILE_SIGNAL_MISMATCH") return jsonError("MUSE_INVALID_OUTPUT", 502);
    if (error && typeof error === "object" && "code" in error && error.code === "40001") return jsonError("REVISION_CONFLICT", 409);
    return providerErrorResponse(error);
  }
}

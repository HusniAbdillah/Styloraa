import { z } from "zod";
import { asRecord, availableProfileSignals, profileContext } from "@/features/matching/engine";
import { jsonError, providerErrorResponse, readJson, requireWritableWorkspace } from "@/features/inspiration/http";
import { getActivePieces, getInventory, getLook, getLookForRevision, persistLookResults } from "@/features/inspiration/repository";
import { outfitJsonSchema, outfitResponseSchema } from "@/features/inspiration/prompts";
import { requestStructuredOutput } from "@/features/inspiration/muse";
import { isMuseConfigured } from "@/lib/env";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({ expectedRevision: z.number().int().positive() });
const optionOrder = ["closest", "from_wardrobe", "fresh_alternative"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ lookId: string }> }) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const { lookId } = await params;
  if (!z.uuid().safeParse(lookId).success) return jsonError("INVALID_ID", 400);
  const parsed = requestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_RECOMMENDATION_REQUEST", 400);
  if (!isMuseConfigured()) return jsonError("MUSE_NOT_CONFIGURED", 503);

  try {
    const look = await getLookForRevision(lookId);
    if (!look) return jsonError("LOOK_NOT_FOUND", 404);
    if (look.revision !== parsed.data.expectedRevision) return jsonError("REVISION_CONFLICT", 409);
    const current = await getLook(lookId);
    if (current?.options.length === 3) return Response.json({ data: current }, { headers: { "Cache-Control": "no-store" } });
    const pieces = await getActivePieces(lookId);
    if (!pieces.length) return jsonError("NO_ACTIVE_PIECES", 409);
    const currentMatches = current?.matches.filter((match) => match.source_revision === look.revision) ?? [];
    if (currentMatches.length !== pieces.length) return jsonError("MATCHES_REQUIRED", 409);
    const { items, preferences } = await getInventory();
    const itemById = new Map(items.map((item) => [item.id, item]));
    const pieceById = new Map(pieces.map((piece) => [piece.id, piece]));
    const profile = profileContext(preferences as unknown as Record<string, unknown> | null);
    const allowedSignals = availableProfileSignals(profile);
    const recommendationInput = {
      reference: pieces.map((piece) => ({ id: piece.id, name: piece.name, category: piece.category, attributes: piece.attributes })),
      wardrobeMatches: currentMatches.map((match) => ({
        pieceId: match.piece_id, type: match.match_type, rationale: match.rationale,
        wardrobeItem: match.wardrobe_item_id ? itemById.get(match.wardrobe_item_id) : null,
        sharedAttributes: match.shared_attributes, differences: match.differences,
      })),
      availableWardrobe: items.map((item) => ({
        id: item.id, name: item.name, category: item.category, color: item.color,
        subcategory: item.subcategory, attributes: item.attributes,
      })),
      profile,
      allowedProfileSignals: allowedSignals,
    };
    const generated = await requestStructuredOutput({
      schemaName: "stylora_three_outfit_options",
      schema: outfitJsonSchema,
      prompt: [
        "Create exactly three distinct outfit options with types closest, from_wardrobe, and fresh_alternative.",
        "Use only the wardrobe IDs supplied. Never invent garment IDs, products, prices, or profile facts.",
        "The closest option should preserve the reference silhouette and color story; from_wardrobe must contain only owned wardrobe IDs and may be empty when the wardrobe is empty; fresh_alternative may combine owned items with explicit missing briefs.",
        "Every option must explain why it works using fashion reasoning and explicitly state which supplied profile signals were used. Include uncertainty for visual inferences.",
        "Each item slot needs a unique slotId, a valid reference piece ID when applicable, and a concise rationale.",
        `Allowed profile signal keys: ${JSON.stringify(allowedSignals)}.`,
        `Input data: ${JSON.stringify(recommendationInput)}.`,
      ].join("\n"),
      parse: (value) => outfitResponseSchema.parse(value),
    });

    const optionsByType = new Map(generated.value.options.map((option) => [option.optionType, option]));
    if (optionsByType.size !== 3 || optionOrder.some((type) => !optionsByType.has(type))) return jsonError("MUSE_INVALID_OUTPUT", 502);
    const options: Json[] = optionOrder.map((optionType) => {
      const option = optionsByType.get(optionType)!;
      if (option.profileSignalsUsed.some((signal) => !allowedSignals.includes(signal))) throw new Error("MUSE_PROFILE_SIGNAL_MISMATCH");
      const slotIds = new Set<string>();
      const usedWardrobeIds = new Set<string>();
      const itemsForOption = option.items.map((item, position) => {
        if (slotIds.has(item.slotId)) throw new Error("MUSE_DUPLICATE_SLOT");
        slotIds.add(item.slotId);
        if (item.pieceId && !pieceById.has(item.pieceId)) throw new Error("MUSE_UNKNOWN_PIECE");
        if (optionType === "from_wardrobe" && item.itemKind !== "owned") throw new Error("MUSE_INVALID_WARDROBE_OPTION");
        if (item.itemKind === "owned") {
          if (!item.wardrobeItemId || !itemById.has(item.wardrobeItemId) || item.missingBrief !== null) throw new Error("MUSE_UNKNOWN_WARDROBE_ITEM");
          const selected = itemById.get(item.wardrobeItemId)!;
          const refPiece = item.pieceId ? pieceById.get(item.pieceId) : null;
          if (refPiece && selected.category !== refPiece.category) throw new Error("MUSE_ITEM_CATEGORY_MISMATCH");
          usedWardrobeIds.add(item.wardrobeItemId);
          return {
            slot_id: item.slotId, piece_id: item.pieceId, item_kind: "owned",
            wardrobe_item_id: item.wardrobeItemId, product_id: null, missing_brief: null,
            rationale: item.rationale, position,
          };
        }
        if (item.wardrobeItemId !== null || !item.missingBrief) throw new Error("MUSE_INVALID_MISSING_ITEM");
        return {
          slot_id: item.slotId, piece_id: item.pieceId, item_kind: "missing",
          wardrobe_item_id: null, product_id: null, missing_brief: item.missingBrief,
          rationale: item.rationale, position,
        };
      });
      const signals = option.profileSignalsUsed;
      const profileUsed = Object.fromEntries(signals.map((signal) => {
        if (signal === "styleDna") return [signal, { ...asRecord(profile.styleDna), styleNotes: profile.styleNotes }];
        if (signal === "undertone" || signal === "skinDepth") return [signal, asRecord(profile.styleDna)[signal] ?? null];
        if (signal === "fitPreferences") return [signal, profile.fitPreferences];
        return [signal, profile.bodyProfile];
      }));
      const sampleInput = [...usedWardrobeIds].some((id) => asRecord(itemById.get(id)?.attribute_provenance).demo_sample === true);
      return {
        option_type: optionType,
        title: option.title,
        rationale: `Why this? ${option.rationale} Profile signals used: ${signals.length ? signals.join(", ") : "none; personalization was not applied"}.`,
        inputs_used: { profileSignalsUsed: signals, profile: profileUsed, wardrobeItemIds: [...usedWardrobeIds] },
        uncertainty: option.uncertainty,
        provider_metadata: { ...generated.metadata, promptVersion: "outfit-options-v1", inputInventorySource: sampleInput ? "sample" : "live" },
        source_type: "live",
        items: itemsForOption,
      } as unknown as Json;
    });

    await persistLookResults({ lookId, expectedRevision: look.revision, replaceMatches: false, matches: [], options });
    const updated = await getLook(lookId);
    return Response.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "MUSE_PROFILE_SIGNAL_MISMATCH") return jsonError("MUSE_INVALID_OUTPUT", 502);
    if (error instanceof Error && error.message.startsWith("MUSE_")) return jsonError("MUSE_INVALID_OUTPUT", 502);
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "40001") return jsonError("REVISION_CONFLICT", 409);
      if (error.code === "23505") return jsonError("OPTIONS_ALREADY_GENERATED", 409);
    }
    return providerErrorResponse(error);
  }
}

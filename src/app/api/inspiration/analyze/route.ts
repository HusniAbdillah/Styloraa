import { randomUUID } from "node:crypto";
import { jsonError, providerErrorResponse, readJson, requireWritableWorkspace } from "@/features/inspiration/http";
import { getInspirationAsset, downloadInspirationAsset, persistInspirationRevision } from "@/features/inspiration/repository";
import { analyzeRequestSchema, garmentAnalysisSchema, MAX_INSPIRATION_BYTES } from "@/features/inspiration/schema";
import { garmentJsonSchema } from "@/features/inspiration/prompts";
import { MUSE_MODEL, requestStructuredOutput } from "@/features/inspiration/muse";
import type { Json } from "@/types/database";
import { isMuseConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

function sniffMime(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const parsed = analyzeRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_ANALYSIS_REQUEST", 400);
  if (!isMuseConfigured()) return jsonError("MUSE_NOT_CONFIGURED", 503);

  try {
    const asset = await getInspirationAsset(parsed.data.assetId);
    if (!asset) return jsonError("ASSET_NOT_FOUND", 404);
    if (asset.byte_size > MAX_INSPIRATION_BYTES) return jsonError("INVALID_IMAGE_SIZE", 400);
    const bytes = await downloadInspirationAsset(asset.storage_path);
    if (bytes.byteLength !== asset.byte_size || bytes.byteLength > MAX_INSPIRATION_BYTES) return jsonError("INVALID_IMAGE_SIZE", 400);
    const actualMime = sniffMime(bytes);
    if (actualMime !== asset.mime_type) return jsonError("IMAGE_TYPE_MISMATCH", 400);

    const analysis = await requestStructuredOutput({
      schemaName: "stylora_garment_analysis",
      schema: garmentJsonSchema,
      prompt: [
        "Analyze this outfit inspiration image for visible garments only.",
        "Return garments in visual order. Use only categories top, bottom, dress, outerwear, shoes, accessory.",
        "Describe apparent material and texture cautiously; never claim exact fiber composition, brand, SKU, wearer identity, or body measurements.",
        "Use null when a detail is not visible, report uncertainty, and cite visible evidence.",
        "Do not infer skin tone, undertone, body shape, or fit of a person from this image.",
        parsed.data.occasion ? `User-provided occasion: ${parsed.data.occasion}` : "No occasion context was provided.",
      ].join("\n"),
      imageDataUrl: `data:${actualMime};base64,${bytes.toString("base64")}`,
      parse: (value) => garmentAnalysisSchema.parse(value),
    });

    const pieces = analysis.value.pieces.map((piece, position) => {
      const attributes = {
        subcategory: piece.subcategory,
        colors: piece.colors,
        pattern: piece.pattern,
        apparentMaterial: piece.apparentMaterial,
        texture: piece.texture,
        silhouette: piece.silhouette,
        fit: piece.fit,
        length: piece.length,
        cut: piece.cut,
        sleeve: piece.sleeve,
        neckline: piece.neckline,
        rise: piece.rise,
        layeringRole: piece.layeringRole,
        styleTags: piece.styleTags,
        occasion: piece.occasion,
        season: piece.season,
      };
      const provenance = Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, {
        source: "muse_visual_inference",
        confidence: piece.confidence,
        evidence: value === null || (Array.isArray(value) && value.length === 0) ? "Not clearly visible." : piece.evidence,
      }]));
      return {
        id: randomUUID(), name: piece.name, category: piece.category, attributes,
        provenance: { ...provenance, uncertainty: piece.uncertainty, evidence: piece.evidence },
        corrections: {}, confidence: piece.confidence, source_type: "live", position,
      } as unknown as Json;
    });
    const saved = await persistInspirationRevision({
      lookId: randomUUID(),
      expectedRevision: 0,
      assetId: asset.id,
      title: analysis.value.title,
      notes: parsed.data.occasion,
      providerMetadata: { ...analysis.metadata, promptVersion: "garment-analysis-v1" } as unknown as Json,
      pieces,
      sourceType: "live",
    });
    return Response.json({
      data: {
        lookId: saved.look_id,
        revision: saved.revision,
        title: analysis.value.title,
        summary: analysis.value.summary,
        pieces: analysis.value.pieces.map((piece, index) => ({ id: (pieces[index] as { id: string }).id, ...piece })),
        provider: { name: "meta", model: MUSE_MODEL },
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "ASSET_NOT_UPLOADED") return jsonError("ASSET_NOT_UPLOADED", 409);
    if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") return jsonError("DATABASE_UNAVAILABLE", 503);
    if (error && typeof error === "object" && "code" in error && error.code === "40001") return jsonError("REVISION_CONFLICT", 409);
    return providerErrorResponse(error);
  }
}

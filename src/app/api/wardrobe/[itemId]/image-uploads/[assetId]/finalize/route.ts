import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import {
  finalizeWardrobeImageUpload,
  WardrobeAssetConflictError,
  WardrobeItemNotFoundError,
} from "@/features/wardrobe/repository";
import {
  wardrobeAssetIdSchema,
  wardrobeImageFinalizeSchema,
  wardrobeItemIdSchema,
} from "@/features/wardrobe/schema";

export const runtime = "nodejs";

function jsonError(code: string, status: number) {
  return Response.json(
    { error: { code } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string; assetId: string }> },
) {
  if (!isDatabaseConfigured()) return jsonError("DATABASE_NOT_CONFIGURED", 503);
  let env;
  try {
    env = getServerEnv();
  } catch {
    return jsonError("INVALID_SERVER_CONFIGURATION", 503);
  }
  if (env.DEMO_WRITES_ENABLED !== "true")
    return jsonError("DEMO_WRITES_DISABLED", 403);

  const { itemId: rawItemId, assetId: rawAssetId } = await params;
  const itemId = wardrobeItemIdSchema.safeParse(rawItemId);
  const assetId = wardrobeAssetIdSchema.safeParse(rawAssetId);
  if (!itemId.success || !assetId.success)
    return jsonError("INVALID_UPLOAD", 400);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("INVALID_UPLOAD", 400);
  }
  const body = wardrobeImageFinalizeSchema.safeParse(raw);
  if (!body.success) return jsonError("INVALID_UPLOAD", 400);

  try {
    const data = await finalizeWardrobeImageUpload(
      itemId.data,
      assetId.data,
      body.data.expectedAssetId,
    );
    return Response.json(
      { data },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WardrobeItemNotFoundError)
      return jsonError("WARDROBE_ITEM_NOT_FOUND", 404);
    if (error instanceof WardrobeAssetConflictError)
      return jsonError("WARDROBE_IMAGE_CONFLICT", 409);
    return jsonError("UPLOAD_FINALIZATION_FAILED", 422);
  }
}

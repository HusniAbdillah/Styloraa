import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import {
  createWardrobeImageUpload,
  WardrobeItemNotFoundError,
} from "@/features/wardrobe/repository";
import {
  wardrobeImageMetadataSchema,
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
  { params }: { params: Promise<{ itemId: string }> },
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

  const { itemId: rawItemId } = await params;
  const itemId = wardrobeItemIdSchema.safeParse(rawItemId);
  if (!itemId.success) return jsonError("INVALID_WARDROBE_ITEM", 400);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("INVALID_UPLOAD", 400);
  }
  const metadata = wardrobeImageMetadataSchema.safeParse(raw);
  if (!metadata.success) return jsonError("INVALID_UPLOAD", 400);

  try {
    const upload = await createWardrobeImageUpload(itemId.data, metadata.data);
    return Response.json(
      { data: upload },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WardrobeItemNotFoundError)
      return jsonError("WARDROBE_ITEM_NOT_FOUND", 404);
    return jsonError("UPLOAD_PREPARATION_FAILED", 503);
  }
}

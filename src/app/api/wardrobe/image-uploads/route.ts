import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import {
  createWardrobeImageUploadForNewItem,
  WardrobeUploadPreparationError,
} from "@/features/wardrobe/repository";
import { wardrobeImageMetadataSchema } from "@/features/wardrobe/schema";

export const runtime = "nodejs";

function jsonError(code: string, status: number) {
  return Response.json(
    { error: { code } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return jsonError("DATABASE_NOT_CONFIGURED", 503);
  let env;
  try {
    env = getServerEnv();
  } catch {
    return jsonError("INVALID_SERVER_CONFIGURATION", 503);
  }
  if (env.DEMO_WRITES_ENABLED !== "true")
    return jsonError("DEMO_WRITES_DISABLED", 403);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("INVALID_UPLOAD", 400);
  }
  const metadata = wardrobeImageMetadataSchema.safeParse(raw);
  if (!metadata.success) return jsonError("INVALID_UPLOAD", 400);

  try {
    const upload = await createWardrobeImageUploadForNewItem(metadata.data);
    return Response.json(
      {
        data: {
          assetId: upload.assetId,
          expectedAssetId: null,
          uploadUrl: upload.uploadUrl,
          expiresInSeconds: upload.expiresInSeconds,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WardrobeUploadPreparationError) {
      return jsonError(
        error.stage === "asset_record"
          ? "UPLOAD_ASSET_RECORD_FAILED"
          : "UPLOAD_SIGNED_URL_FAILED",
        503,
      );
    }
    return jsonError("UPLOAD_PREPARATION_FAILED", 503);
  }
}

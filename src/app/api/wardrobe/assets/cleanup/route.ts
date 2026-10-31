import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { retryOrphanWardrobeAssetCleanup } from "@/features/wardrobe/repository";
import { wardrobeAssetCleanupCursorSchema } from "@/features/wardrobe/schema";

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

  const url = new URL(request.url);
  const rawCreatedAt = url.searchParams.get("cursorCreatedAt");
  const rawId = url.searchParams.get("cursorId");
  let cursor;
  if (rawCreatedAt !== null || rawId !== null) {
    const parsed = wardrobeAssetCleanupCursorSchema.safeParse({
      createdAt: rawCreatedAt,
      id: rawId,
    });
    if (!parsed.success) return jsonError("INVALID_CLEANUP_CURSOR", 400);
    cursor = parsed.data;
  }

  try {
    const data = await retryOrphanWardrobeAssetCleanup(10, cursor);
    return Response.json(
      { data },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError("WARDROBE_ASSET_CLEANUP_FAILED", 503);
  }
}

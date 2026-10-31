import { randomUUID } from "node:crypto";
import { jsonError, requireWritableWorkspace } from "@/features/inspiration/http";
import { createInspirationUpload } from "@/features/inspiration/repository";
import { uploadRequestSchema } from "@/features/inspiration/schema";
import { readJson } from "@/features/inspiration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const writable = requireWritableWorkspace();
  if ("response" in writable) return writable.response;
  const parsed = uploadRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("INVALID_UPLOAD", 400);
  try {
    const { asset, signed } = await createInspirationUpload(parsed.data);
    return Response.json({
      data: {
        assetId: asset.id,
        storagePath: asset.storage_path,
        uploadUrl: signed.signedUrl,
        uploadToken: signed.token,
        expiresInSeconds: 7200,
        correlationId: randomUUID(),
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("UPLOAD_PREPARATION_FAILED", 503);
  }
}

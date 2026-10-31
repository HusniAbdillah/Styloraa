import { z } from "zod";
import { getLook } from "@/features/inspiration/repository";
import { jsonError, noStoreHeaders } from "@/features/inspiration/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ lookId: string }> }) {
  const { lookId } = await params;
  if (!z.uuid().safeParse(lookId).success) return jsonError("INVALID_ID", 400);
  try {
    const look = await getLook(lookId);
    return look ? Response.json({ data: look }, { headers: noStoreHeaders() }) : jsonError("LOOK_NOT_FOUND", 404);
  } catch {
    return jsonError("DATABASE_UNAVAILABLE", 503);
  }
}

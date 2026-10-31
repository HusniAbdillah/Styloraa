import {
  backendRoute,
  jsonResponse,
  readJson,
} from "@/features/decisions/backend";
import { createShare } from "@/features/sharing/repository";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ savedLookId: string }> },
) {
  return backendRoute(async () => {
    const { savedLookId } = await context.params;
    return jsonResponse(
      await createShare(savedLookId, await readJson(request)),
      201,
    );
  });
}

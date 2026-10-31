import { backendRoute, jsonResponse } from "@/features/decisions/backend";
import { readPublicShare } from "@/features/sharing/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ shareToken: string }> },
) {
  return backendRoute(async () => {
    const { shareToken } = await context.params;
    return jsonResponse(await readPublicShare(shareToken));
  });
}

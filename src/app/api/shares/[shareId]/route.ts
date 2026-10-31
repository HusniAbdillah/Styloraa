import {
  BackendError,
  backendRoute,
  jsonResponse,
} from "@/features/decisions/backend";
import { revokeShare } from "@/features/sharing/repository";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  return backendRoute(async () => {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      throw new BackendError(
        403,
        "invalid_origin",
        "Submit changes from this application.",
      );
    }
    const { shareId } = await context.params;
    return jsonResponse(await revokeShare(shareId));
  });
}

import { buildLookPreview } from "@/features/preview/repository";
import { requestOwnedPreview } from "@/features/preview/request-handler";
import {
  checkDatabase,
  invalidId,
  isUuid,
  mapRouteError,
} from "@/app/api/helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ lookId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { lookId } = await params;
  return requestOwnedPreview(request, { type: "look", id: lookId });
}

/** Read-only look composition for preview. No AI claims attached. */
export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { lookId } = await params;
  if (!isUuid(lookId)) return invalidId();
  try {
    const data = await buildLookPreview(lookId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

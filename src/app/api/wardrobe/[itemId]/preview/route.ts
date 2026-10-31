import { buildItemPreview } from "@/features/preview/repository";
import { requestOwnedPreview } from "@/features/preview/request-handler";
import {
  checkDatabase,
  invalidId,
  isUuid,
  mapRouteError,
} from "@/app/api/helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ itemId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { itemId } = await params;
  return requestOwnedPreview(request, { type: "wardrobe_item", id: itemId });
}

/** Read-only wardrobe item composition for preview. */
export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { itemId } = await params;
  if (!isUuid(itemId)) return invalidId();
  try {
    const data = await buildItemPreview(itemId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

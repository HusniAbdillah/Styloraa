import { buildOutfitPreview } from "@/features/preview/repository";
import { requestOwnedPreview } from "@/features/preview/request-handler";
import {
  checkDatabase,
  invalidId,
  isUuid,
  mapRouteError,
} from "@/app/api/helpers";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ capsuleId: string; outfitId: string }> };
export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { capsuleId, outfitId } = await params;
  if (!isUuid(capsuleId) || !isUuid(outfitId)) return invalidId();
  try {
    return Response.json(
      { data: await buildOutfitPreview(capsuleId, outfitId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}
export async function POST(request: Request, { params }: Params) {
  const { capsuleId, outfitId } = await params;
  return requestOwnedPreview(request, {
    type: "capsule_outfit",
    id: outfitId,
    capsuleId,
  });
}

export const maxDuration = 240;

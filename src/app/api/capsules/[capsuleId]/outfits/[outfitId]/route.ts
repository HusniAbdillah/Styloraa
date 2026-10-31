import {
  getCapsuleOutfit,
  deleteCapsuleOutfit,
} from "@/features/outfits/repository";
import {
  checkDatabase,
  checkWrites,
  invalidId,
  isUuid,
  mapRouteError,
} from "../../../../helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ capsuleId: string; outfitId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { capsuleId, outfitId } = await params;
  if (!isUuid(capsuleId) || !isUuid(outfitId)) return invalidId();
  try {
    await deleteCapsuleOutfit(capsuleId, outfitId);
    return Response.json({ data: { id: outfitId } });
  } catch (error) {
    return mapRouteError(error);
  }
}

export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { capsuleId, outfitId } = await params;
  if (!isUuid(capsuleId) || !isUuid(outfitId)) return invalidId();
  try {
    const data = await getCapsuleOutfit(capsuleId, outfitId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

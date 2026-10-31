import { createOutfitSchema } from "@/features/outfits/schema";
import {
  createCapsuleOutfit,
  listCapsuleOutfits,
} from "@/features/outfits/repository";
import {
  checkDatabase,
  checkWrites,
  invalidId,
  isUuid,
  jsonError,
  mapRouteError,
  parseJsonBody,
} from "../../../helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ capsuleId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  try {
    const data = await listCapsuleOutfits(capsuleId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  const parsed = createOutfitSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return jsonError("INVALID_INPUT", 400, "Invalid outfit input.", {
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }
  try {
    const data = await createCapsuleOutfit(capsuleId, parsed.data);
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return mapRouteError(error);
  }
}

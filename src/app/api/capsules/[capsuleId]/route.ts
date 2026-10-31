import { updateCapsuleSchema } from "@/features/capsules/schema";
import {
  deleteCapsule,
  getCapsule,
  updateCapsule,
} from "@/features/capsules/repository";
import {
  checkDatabase,
  checkWrites,
  invalidId,
  isUuid,
  jsonError,
  mapRouteError,
  parseJsonBody,
} from "../../helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ capsuleId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  try {
    const data = await getCapsule(capsuleId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  const parsed = updateCapsuleSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return jsonError("INVALID_INPUT", 400, "Invalid capsule input.", {
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }
  try {
    const data = await updateCapsule(capsuleId, parsed.data);
    return Response.json({ data });
  } catch (error) {
    return mapRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  try {
    await deleteCapsule(capsuleId);
    return Response.json({ data: { id: capsuleId } });
  } catch (error) {
    return mapRouteError(error);
  }
}

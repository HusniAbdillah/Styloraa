import { createCapsuleSchema } from "@/features/capsules/schema";
import { createCapsule, listCapsules } from "@/features/capsules/repository";
import {
  checkDatabase,
  checkWrites,
  jsonError,
  mapRouteError,
  parseJsonBody,
} from "../helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  try {
    const data = await listCapsules();
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}

export async function POST(request: Request) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const parsed = createCapsuleSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return jsonError("INVALID_INPUT", 400, "Invalid capsule input.", {
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }
  try {
    const id = await createCapsule(parsed.data);
    return Response.json({ data: { id } }, { status: 201 });
  } catch (error) {
    return mapRouteError(error);
  }
}

import { backendRoute, jsonResponse } from "@/features/decisions/backend";
import { getSavedLook } from "@/features/decisions/repository";
import { decisionIdSchema } from "@/features/decisions/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ savedLookId: string }> },
) {
  return backendRoute(async () => {
    const id = decisionIdSchema.parse((await context.params).savedLookId);
    return jsonResponse(await getSavedLook(id));
  });
}

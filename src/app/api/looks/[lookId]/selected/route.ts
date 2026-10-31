import { backendRoute, jsonResponse } from "@/features/decisions/backend";
import { getSelectedLook } from "@/features/decisions/repository";
import {
  decisionIdSchema,
  lookDetailQuerySchema,
} from "@/features/decisions/schema";

export async function GET(
  request: Request,
  context: { params: Promise<{ lookId: string }> },
) {
  return backendRoute(async () => {
    const lookId = decisionIdSchema.parse((await context.params).lookId);
    const query = lookDetailQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonResponse(await getSelectedLook(lookId, query.option_id));
  });
}

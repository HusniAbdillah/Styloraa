import {
  backendRoute,
  jsonResponse,
  readJson,
} from "@/features/decisions/backend";
import { saveSelectedLook } from "@/features/decisions/repository";
import {
  decisionIdSchema,
  saveDecisionSchema,
} from "@/features/decisions/schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ lookId: string }> },
) {
  return backendRoute(async () => {
    const lookId = decisionIdSchema.parse((await context.params).lookId);
    const input = saveDecisionSchema.parse(await readJson(request));
    return jsonResponse(await saveSelectedLook(lookId, input), 201);
  });
}

import {
  backendRoute,
  jsonResponse,
  readJson,
} from "@/features/decisions/backend";
import { selectOutfitProducts } from "@/features/decisions/repository";
import {
  decisionIdSchema,
  selectProductsSchema,
} from "@/features/decisions/schema";

export async function PUT(
  request: Request,
  context: { params: Promise<{ lookId: string }> },
) {
  return backendRoute(async () => {
    const lookId = decisionIdSchema.parse((await context.params).lookId);
    const input = selectProductsSchema.parse(await readJson(request));
    return jsonResponse(await selectOutfitProducts(lookId, input));
  });
}

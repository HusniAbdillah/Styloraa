import {
  backendRoute,
  jsonResponse,
  readJson,
} from "@/features/decisions/backend";
import { searchMarketplace } from "@/features/products/repository";
import {
  marketplaceSearchSchema,
  productLookId,
} from "@/features/products/schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ lookId: string }> },
) {
  return backendRoute(async () => {
    const lookId = productLookId.parse((await context.params).lookId);
    const input = marketplaceSearchSchema.parse(await readJson(request));
    return jsonResponse(await searchMarketplace(lookId, input));
  });
}

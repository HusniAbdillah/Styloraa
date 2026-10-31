import { backendRoute, jsonResponse } from "@/features/decisions/backend";
import { compareProducts } from "@/features/products/repository";
import { compareQuerySchema, productLookId } from "@/features/products/schema";

export async function GET(
  request: Request,
  context: { params: Promise<{ lookId: string }> },
) {
  return backendRoute(async () => {
    const lookId = productLookId.parse((await context.params).lookId);
    const query = compareQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonResponse(await compareProducts(lookId, query.option_id));
  });
}

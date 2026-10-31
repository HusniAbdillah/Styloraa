import { backendRoute, jsonResponse } from "@/features/decisions/backend";
import { listSavedLooks } from "@/features/decisions/repository";
import { savedLookQuerySchema } from "@/features/decisions/schema";

export async function GET(request: Request) {
  return backendRoute(async () => {
    const { limit, offset } = savedLookQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonResponse(await listSavedLooks(limit, offset));
  });
}

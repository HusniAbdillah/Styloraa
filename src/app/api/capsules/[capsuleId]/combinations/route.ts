import { combinationRequestSchema } from "@/features/capsules/schema";
import { getCapsule } from "@/features/capsules/repository";
import { signCombination } from "@/features/outfits/combination-token";
import { generateCapsuleSuggestions } from "@/features/capsules/generation";
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

/**
 * Generate outfit combinations from capsule inventory + brief.
 * AI results are ownership-verified before responding; unverifiable output
 * is rejected instead of persisted. Nothing is saved by this endpoint.
 */
export async function POST(request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { capsuleId } = await params;
  if (!isUuid(capsuleId)) return invalidId();
  const parsed = combinationRequestSchema.safeParse(
    await parseJsonBody(request),
  );
  if (!parsed.success) {
    return jsonError("INVALID_INPUT", 400, "Invalid combination request.", {
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }
  try {
    const capsule = await getCapsule(capsuleId);
    const inventory = capsule.items.filter((item) => item.available);
    const scopeIds = parsed.data.item_ids ?? inventory.map((item) => item.id);
    const knownIds = new Set(inventory.map((item) => item.id));
    if (
      [
        ...scopeIds,
        ...parsed.data.required_item_ids,
        ...parsed.data.excluded_item_ids,
      ].some((id) => !knownIds.has(id)) ||
      new Set(scopeIds).size !== scopeIds.length
    ) {
      return jsonError(
        "INVALID_INPUT",
        400,
        "Every selected, required and excluded piece must be available in this capsule.",
      );
    }
    if (
      parsed.data.required_item_ids.some(
        (id) =>
          parsed.data.excluded_item_ids.includes(id) || !scopeIds.includes(id),
      )
    ) {
      return jsonError(
        "INVALID_INPUT",
        400,
        "A required piece must be selected and cannot be excluded.",
      );
    }
    const scope = inventory.filter((item) => scopeIds.includes(item.id));
    if (!scope.length) {
      return jsonError(
        "INVALID_INPUT",
        400,
        "No requested items belong to this capsule.",
      );
    }
    const { combinations, missing_additions, dropped } =
      await generateCapsuleSuggestions(capsule, scope, parsed.data);
    return Response.json({
      data: {
        combinations: combinations.map((combination) => ({
          ...combination,
          draft_token: signCombination(
            capsuleId,
            combination,
            capsule.revision,
          ),
        })),
        source: "ai",
        missing_additions,
        dropped,
      },
    });
  } catch (error) {
    return mapRouteError(error);
  }
}

export const maxDuration = 60;

import "server-only";
import {
  MuseApiError,
  MUSE_TEXT_MODEL,
  isMuseConfigured,
  requestMuse,
  museText,
} from "./muse";
export { MuseApiError as MetaAiError } from "./muse";
export const META_AI_ERRORS = {
  NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  UPSTREAM_ERROR: "AI_UPSTREAM_ERROR",
  INVALID_OUTPUT: "AI_INVALID_OUTPUT",
  TIMEOUT: "AI_TIMEOUT",
} as const;
export type MetaChatMessage = { role: "system" | "user"; content: string };
export const isMetaTextConfigured = isMuseConfigured;
export async function metaChatCompletion(
  messages: MetaChatMessage[],
  options?: {
    timeoutMs?: number;
    maxTokens?: number;
    temperature?: number;
    schema?: Record<string, unknown>;
  },
) {
  const response = await requestMuse(
    {
      model: MUSE_TEXT_MODEL,
      input: messages,
      max_output_tokens: options?.maxTokens ?? 6000,
      ...(options?.schema
        ? {
            text: {
              format: {
                type: "json_schema",
                name: "capsule_combinations",
                strict: true,
                schema: options.schema,
              },
            },
          }
        : {}),
    },
    options?.timeoutMs,
  );
  return museText(response);
}
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0) {
    throw new MuseApiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned no JSON object.",
    );
  }
  if (end <= start)
    throw new MuseApiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned malformed JSON.",
    );
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    throw new MuseApiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned malformed JSON.",
    );
  }
}

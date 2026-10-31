import "server-only";
import { getServerEnv } from "@/lib/env";

export const META_AI_ERRORS = {
  NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  UPSTREAM_ERROR: "AI_UPSTREAM_ERROR",
  INVALID_OUTPUT: "AI_INVALID_OUTPUT",
  TIMEOUT: "AI_TIMEOUT",
} as const;

export class MetaAiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export type MetaChatMessage = { role: "system" | "user"; content: string };

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 2000;

function baseUrl() {
  return (
    getServerEnv().META_API_BASE_URL || "https://api.llama.com/compat/v1"
  ).replace(/\/$/, "");
}

export function isMetaTextConfigured() {
  const env = getServerEnv();
  return Boolean(env.META_API_KEY && env.META_TEXT_MODEL);
}

/** Raw text completion against Meta's OpenAI-compatible chat endpoint. */
export async function metaChatCompletion(
  messages: MetaChatMessage[],
  options?: { timeoutMs?: number; maxTokens?: number; temperature?: number },
): Promise<string> {
  const env = getServerEnv();
  if (!env.META_API_KEY || !env.META_TEXT_MODEL) {
    throw new MetaAiError(
      META_AI_ERRORS.NOT_CONFIGURED,
      503,
      "Meta text provider is not configured.",
    );
  }
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.META_TEXT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new MetaAiError(
        META_AI_ERRORS.TIMEOUT,
        504,
        "Meta text request timed out.",
      );
    }
    throw new MetaAiError(
      META_AI_ERRORS.UPSTREAM_ERROR,
      502,
      "Meta text request failed.",
    );
  }
  if (!response.ok) {
    throw new MetaAiError(
      META_AI_ERRORS.UPSTREAM_ERROR,
      502,
      "Meta text provider returned an error.",
    );
  }
  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  } | null;
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new MetaAiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned an empty completion.",
    );
  }
  return content;
}

/** Extract the first JSON object from a completion that may carry prose. */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0) {
    throw new MetaAiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned no JSON object.",
    );
  }
  if (end <= start) throw new MetaAiError(META_AI_ERRORS.INVALID_OUTPUT, 502, "Meta text provider returned malformed JSON.");
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    throw new MetaAiError(
      META_AI_ERRORS.INVALID_OUTPUT,
      502,
      "Meta text provider returned malformed JSON.",
    );
  }
}

import "server-only";
import { getMuseApiKey, isMuseConfigured } from "@/lib/env";

export const MUSE_BASE_URL = "https://api.meta.ai/v1";
export const MUSE_TEXT_MODEL = "muse-spark-1.3";
export const MUSE_IMAGE_MODEL = "muse-image-1.0";
export { isMuseConfigured };

export class MuseApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requestMuse(
  body: Record<string, unknown>,
  timeoutMs = 45000,
) {
  const key = getMuseApiKey();
  if (!key)
    throw new MuseApiError("AI_NOT_CONFIGURED", 503, "Muse is not configured.");
  let response: Response;
  try {
    response = await fetch(`${MUSE_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, store: false }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "error",
    });
    if (!response.ok)
      throw new MuseApiError(
        response.status === 429 ? "AI_RATE_LIMITED" : "AI_UPSTREAM_ERROR",
        response.status === 429 ? 429 : 502,
        "Muse could not complete this request. Try again later.",
      );
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty response");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("Response too large");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch (error) {
    if (error instanceof MuseApiError) throw error;
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      throw new MuseApiError(
        "AI_TIMEOUT",
        504,
        "Muse took too long. Your selection has been kept.",
      );
    throw new MuseApiError(
      "AI_UPSTREAM_ERROR",
      502,
      "Muse returned an unavailable or invalid response.",
    );
  }
}

export function museText(response: Record<string, unknown>) {
  const output = response.output;
  if (response.status !== "completed" || !Array.isArray(output))
    throw new MuseApiError(
      "AI_INVALID_OUTPUT",
      502,
      "Muse did not complete the response.",
    );
  const text = output
    .flatMap((item) =>
      item?.type === "message" && Array.isArray(item.content)
        ? item.content
            .filter((part: { type?: string }) => part.type === "output_text")
            .map((part: { text?: string }) => part.text ?? "")
        : [],
    )
    .join("");
  if (!text)
    throw new MuseApiError(
      "AI_INVALID_OUTPUT",
      502,
      "Muse returned no usable text.",
    );
  return text;
}

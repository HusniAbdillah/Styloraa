import "server-only";

import OpenAI from "openai";
import { ZodError } from "zod";
import { getMuseApiKey } from "@/lib/env";

export const MUSE_MODEL = "muse-spark-1.3";

let client: OpenAI | undefined;

export function getMuseClient() {
  const apiKey = getMuseApiKey();
  if (!apiKey) throw new MuseError("MUSE_NOT_CONFIGURED");
  client ??= new OpenAI({ apiKey, baseURL: "https://api.meta.ai/v1", timeout: 45_000, maxRetries: 1 });
  return client;
}

export class MuseError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "MuseError";
  }
}

export async function requestStructuredOutput<T>(args: {
  schemaName: string;
  schema: Record<string, unknown>;
  prompt: string;
  imageDataUrl?: string;
  parse: (value: unknown) => T;
}) {
  try {
    const content: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "auto" }
    > = [
      { type: "input_text", text: args.prompt },
    ];
    if (args.imageDataUrl) content.push({ type: "input_image", image_url: args.imageDataUrl, detail: "auto" });
    const response = await getMuseClient().responses.create({
      model: MUSE_MODEL,
      store: false,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: args.schemaName, strict: true, schema: args.schema } },
    });
    if (!response.output_text) throw new MuseError("MUSE_EMPTY_RESPONSE");
    let decoded: unknown;
    try {
      decoded = JSON.parse(response.output_text);
    } catch {
      throw new MuseError("MUSE_INVALID_JSON");
    }
    return {
      value: args.parse(decoded),
      metadata: { provider: "meta", model: response.model, responseId: response.id },
    };
  } catch (error) {
    if (error instanceof MuseError) throw error;
    if (error instanceof ZodError) throw new MuseError("MUSE_INVALID_OUTPUT");
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401 || error.status === 403) throw new MuseError("MUSE_AUTH_FAILED");
      if (error.status === 429) throw new MuseError("MUSE_RATE_LIMITED");
      throw new MuseError("MUSE_PROVIDER_ERROR");
    }
    if (error instanceof Error && (error.name === "APIConnectionTimeoutError" || error.name === "TimeoutError")) {
      throw new MuseError("MUSE_TIMEOUT");
    }
    throw new MuseError("MUSE_UNAVAILABLE");
  }
}

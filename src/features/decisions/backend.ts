import "server-only";
import { ZodError } from "zod";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

export class BackendError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function getBackendContext(write = false) {
  if (!isDatabaseConfigured()) {
    throw new BackendError(
      503,
      "database_unavailable",
      "The database is not configured.",
    );
  }
  const env = getServerEnv();
  if (write && env.DEMO_WRITES_ENABLED !== "true") {
    throw new BackendError(
      403,
      "writes_disabled",
      "Shared demo changes are disabled.",
    );
  }
  return { db: createServerSupabase(), workspaceId: env.STYLORA_WORKSPACE_ID };
}

export function checkDatabase(
  error: { code?: string } | null,
  message: string,
) {
  if (!error) return;
  if (error.code === "P0429") {
    throw new BackendError(
      429,
      "search_limit",
      "The shared search limit was reached. Try again later.",
    );
  }
  if (error.code === "40001") {
    throw new BackendError(
      409,
      "stale_revision",
      "The outfit changed. Refresh and try again.",
    );
  }
  if (["22023", "22P02", "23503", "23514"].includes(error.code ?? "")) {
    throw new BackendError(422, "invalid_reference", message);
  }
  throw new BackendError(
    503,
    "database_unavailable",
    "The database request could not be completed.",
  );
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export async function backendRoute(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse(
        {
          error: {
            code: "invalid_request",
            message: "Check the request fields and try again.",
          },
        },
        400,
      );
    }
    if (error instanceof BackendError) {
      return jsonResponse(
        { error: { code: error.code, message: error.message } },
        error.status,
      );
    }
    return jsonResponse(
      {
        error: {
          code: "internal_error",
          message: "The request could not be completed.",
        },
      },
      500,
    );
  }
}

export async function readJson(
  request: Request,
  limit = 16384,
): Promise<unknown> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new BackendError(
      403,
      "invalid_origin",
      "Submit changes from this application.",
    );
  }
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase() !== "application/json"
  ) {
    throw new BackendError(
      415,
      "invalid_content_type",
      "Send an application/json request.",
    );
  }
  const reader = request.body?.getReader();
  if (!reader)
    throw new BackendError(400, "invalid_json", "Send a JSON request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new BackendError(
        413,
        "request_too_large",
        "The request body is too large.",
      );
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new BackendError(400, "invalid_json", "Send valid JSON.");
  }
}

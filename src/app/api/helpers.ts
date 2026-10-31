import { z } from "zod";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { MetaAiError } from "@/lib/ai/meta";
import { ConflictError, InvalidInputError, NotFoundError } from "@/lib/errors";

export function jsonError(
  code: string,
  status: number,
  message?: string,
  details?: unknown,
) {
  return Response.json(
    {
      error: {
        code,
        ...(message ? { message } : {}),
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function checkDatabase() {
  if (!isDatabaseConfigured()) {
    return jsonError("NOT_CONFIGURED", 503, "Database is not configured.");
  }
  return null;
}

export function checkWrites() {
  if (getServerEnv().DEMO_WRITES_ENABLED !== "true") {
    return jsonError("WRITE_DISABLED", 403, "Demo writes are not enabled.");
  }
  return null;
}

export function invalidId() {
  return jsonError("INVALID_ID", 400, "Invalid identifier.");
}

export function isUuid(value: string) {
  return z.uuid().safeParse(value).success;
}

export function mapRouteError(error: unknown) {
  if (error instanceof NotFoundError) {
    return jsonError("NOT_FOUND", 404, error.message);
  }
  if (error instanceof InvalidInputError) {
    return jsonError("INVALID_INPUT", 400, error.message);
  }
  if (error instanceof ConflictError) {
    return jsonError("CONFLICT", 409, error.message);
  }
  if (error instanceof MetaAiError) {
    return jsonError(error.code, error.status, error.message);
  }
  return jsonError("DATABASE_UNAVAILABLE", 503, "Database is unavailable.");
}

export async function parseJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return undefined;
  }
}

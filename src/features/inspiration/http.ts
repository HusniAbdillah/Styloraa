import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { MuseError } from "./muse";

export function jsonError(code: string, status: number, message?: string) {
  return Response.json({ error: { code, ...(message ? { message } : {}) } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function requireWritableWorkspace() {
  if (!isDatabaseConfigured()) return { response: jsonError("DATABASE_NOT_CONFIGURED", 503) } as const;
  const env = getServerEnv();
  if (env.DEMO_WRITES_ENABLED !== "true") return { response: jsonError("DEMO_WRITES_DISABLED", 403) } as const;
  return { workspaceId: env.STYLORA_WORKSPACE_ID } as const;
}

export function providerErrorResponse(error: unknown) {
  const code = error instanceof MuseError ? error.code : "INTERNAL_ERROR";
  const status = code === "MUSE_NOT_CONFIGURED" ? 503
    : code === "MUSE_AUTH_FAILED" ? 502
      : code === "MUSE_RATE_LIMITED" ? 503
        : code === "MUSE_TIMEOUT" ? 504
          : code.startsWith("MUSE_") ? 502 : 500;
  return jsonError(code, status);
}

export function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { InvalidInputError } from "@/lib/errors";
import type { VerifiedCombination } from "./generator";

function signature(payload: string) {
  const env = getServerEnv();
  return createHmac("sha256", env.SUPABASE_SECRET_KEY)
    .update(`stylora:verified-combination:v1:${payload}`)
    .digest("base64url");
}

export function signCombination(
  capsuleId: string,
  combination: VerifiedCombination,
  sourceRevision = 1,
) {
  const payload = Buffer.from(
    JSON.stringify({
      workspace: getServerEnv().STYLORA_WORKSPACE_ID,
      capsuleId,
      combination,
      sourceRevision,
      expires: Date.now() + 15 * 60_000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function requireVerifiedCombination(
  capsuleId: string,
  combination: VerifiedCombination,
  token?: string,
  sourceRevision = 1,
) {
  if (!token || token.length > 24000)
    throw new InvalidInputError(
      "Generate a verified AI suggestion before saving it as AI-assisted.",
    );
  const [payload, mac, extra] = token.split(".");
  const expected = signature(payload ?? "");
  if (
    !payload ||
    !mac ||
    extra ||
    !/^[A-Za-z0-9_-]{43}$/.test(mac) ||
    mac.length !== expected.length ||
    !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  )
    throw new InvalidInputError(
      "This suggestion could not be verified. Generate it again.",
    );
  let parsed: {
    workspace: string;
    capsuleId: string;
    combination: VerifiedCombination;
    expires: number;
    sourceRevision: number;
  };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new InvalidInputError("This suggestion could not be verified.");
  }
  if (
    parsed.workspace !== getServerEnv().STYLORA_WORKSPACE_ID ||
    parsed.capsuleId !== capsuleId ||
    parsed.sourceRevision !== sourceRevision ||
    parsed.expires < Date.now() ||
    JSON.stringify(parsed.combination) !== JSON.stringify(combination)
  ) {
    throw new InvalidInputError(
      "The suggestion has changed or expired. Generate it again before saving.",
    );
  }
}

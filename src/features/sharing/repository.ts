import "server-only";
import { createHash } from "node:crypto";
import {
  BackendError,
  checkDatabase,
  getBackendContext,
} from "@/features/decisions/backend";
import {
  createShareSchema,
  projectPublicShare,
  shareResourceIdSchema,
  shareTokenSchema,
} from "./schema";

const unavailable = () =>
  new BackendError(
    404,
    "share_unavailable",
    "This shared look is unavailable.",
  );

export async function createShare(savedLookId: string, input: unknown) {
  const id = shareResourceIdSchema.parse(savedLookId);
  const payload = createShareSchema.parse(input);
  const { db, workspaceId } = getBackendContext(true);
  const { data: saved, error: readError } = await db
    .from("saved_look_snapshots")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  checkDatabase(readError, "The saved look is unavailable.");
  if (!saved) {
    throw new BackendError(
      404,
      "saved_look_not_found",
      "The saved look is unavailable.",
    );
  }

  const expiresAt = new Date(
    Date.now() + payload.expires_in_hours * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await db.rpc("create_share_link", {
    p_workspace_id: workspaceId,
    p_saved_look_id: id,
    p_catchphrase: payload.catchphrase,
    p_expires_at: expiresAt,
  });
  checkDatabase(error, "The saved look can no longer be shared.");
  const share = data?.[0];
  if (
    !share ||
    !shareResourceIdSchema.safeParse(share.share_id).success ||
    !shareTokenSchema.safeParse(share.share_token).success
  ) {
    throw new BackendError(
      503,
      "share_unavailable",
      "A share link could not be created.",
    );
  }
  return {
    share_id: share.share_id,
    share_token: share.share_token,
    path: `/shared/${share.share_token}`,
    expires_at: expiresAt,
  };
}

export async function revokeShare(shareId: string) {
  const id = shareResourceIdSchema.parse(shareId);
  const { db, workspaceId } = getBackendContext(true);
  const { data: share, error: readError } = await db
    .from("share_links")
    .select("id,revoked_at")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  checkDatabase(readError, "The share link is unavailable.");
  if (!share) throw unavailable();
  if (!share.revoked_at) {
    const { error } = await db
      .from("share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .is("revoked_at", null);
    checkDatabase(error, "The share link could not be revoked.");
  }
  return { revoked: true as const };
}

export async function readPublicShare(rawToken: string) {
  const token = shareTokenSchema.safeParse(rawToken);
  if (!token.success) throw unavailable();
  const { db, workspaceId } = getBackendContext();
  const hash = createHash("sha256").update(token.data).digest("hex");
  const { data, error } = await db
    .from("share_links")
    .select("public_snapshot,catchphrase")
    .eq("workspace_id", workspaceId)
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  checkDatabase(error, "The shared look is unavailable.");
  const result = projectPublicShare(data);
  if (!result) throw unavailable();
  return result;
}

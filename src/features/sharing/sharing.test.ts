import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

vi.mock("server-only", () => ({}));
vi.mock("@/features/decisions/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/decisions/backend")>();
  return { ...actual, getBackendContext: vi.fn() };
});

import { getBackendContext } from "@/features/decisions/backend";
import { DELETE } from "@/app/api/shares/[shareId]/route";
import { GET } from "@/app/api/shared/[shareToken]/route";
import { createShare, readPublicShare, revokeShare } from "./repository";
import { createShareSchema } from "./schema";

const workspaceId = "00000000-0000-4000-8000-000000000001";
const savedId = "10000000-0000-4000-8000-000000000001";
const shareId = "20000000-0000-4000-8000-000000000001";
const token = "a".repeat(64);
let row: unknown;

const query = {
  error: null,
  select: vi.fn(),
  eq: vi.fn(),
  is: vi.fn(),
  gt: vi.fn(),
  update: vi.fn(),
  maybeSingle: vi.fn(async () => ({ data: row, error: null })),
};
const db = { from: vi.fn(() => query), rpc: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  row = null;
  for (const method of [
    query.select,
    query.eq,
    query.is,
    query.gt,
    query.update,
  ]) {
    method.mockReturnValue(query);
  }
  vi.mocked(getBackendContext).mockReturnValue({
    workspaceId,
    db: db as unknown as ReturnType<typeof getBackendContext>["db"],
  });
});

describe("sharing backend boundary", () => {
  it("bounds the expiry and refuses caller-supplied workspace or public snapshots", () => {
    expect(createShareSchema.parse({})).toEqual({
      catchphrase: "",
      expires_in_hours: 168,
    });
    for (const payload of [
      { workspace_id: workspaceId },
      { public_snapshot: { title: "Injected" } },
      { expires_in_hours: 0 },
      { expires_in_hours: 721 },
      { catchphrase: "x".repeat(241) },
    ]) {
      expect(createShareSchema.safeParse(payload).success).toBe(false);
    }
  });

  it("publishes only an actual scoped snapshot and returns a relative share path", async () => {
    row = { id: savedId };
    db.rpc.mockResolvedValue({
      data: [{ share_id: shareId, share_token: token }],
      error: null,
    });
    const result = await createShare(savedId, {
      catchphrase: "My outfit",
      expires_in_hours: 1,
    });
    expect(getBackendContext).toHaveBeenCalledWith(true);
    expect(query.eq).toHaveBeenCalledWith("workspace_id", workspaceId);
    expect(query.eq).toHaveBeenCalledWith("id", savedId);
    expect(db.rpc).toHaveBeenCalledWith("create_share_link", {
      p_workspace_id: workspaceId,
      p_saved_look_id: savedId,
      p_catchphrase: "My outfit",
      p_expires_at: expect.any(String),
    });
    expect(result).toEqual({
      share_id: shareId,
      share_token: token,
      path: `/shared/${token}`,
      expires_at: expect.any(String),
    });
  });

  it("gives malformed tokens the same unavailable response without querying", async () => {
    const response = await GET(
      new Request("http://localhost/api/shared/invalid"),
      {
        params: Promise.resolve({ shareToken: "invalid" }),
      },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "share_unavailable",
        message: "This shared look is unavailable.",
      },
    });
    expect(getBackendContext).not.toHaveBeenCalled();
  });

  it("filters token hash, workspace, expiry and revocation on public lookup", async () => {
    await expect(readPublicShare(token)).rejects.toMatchObject({
      status: 404,
      code: "share_unavailable",
    });
    expect(query.select).toHaveBeenCalledWith("public_snapshot,catchphrase");
    expect(query.eq).toHaveBeenCalledWith("workspace_id", workspaceId);
    expect(query.eq).toHaveBeenCalledWith(
      "token_hash",
      createHash("sha256").update(token).digest("hex"),
    );
    expect(query.is).toHaveBeenCalledWith("revoked_at", null);
    expect(query.gt).toHaveBeenCalledWith("expires_at", expect.any(String));
  });

  it("independently strips internal and nested fields from public responses", async () => {
    row = {
      workspace_id: workspaceId,
      token_hash: "hidden-hash",
      catchphrase: "A synthetic outfit",
      public_snapshot: {
        title: "Synthetic look",
        source_type: "sample",
        profile: { body: "private-test-profile" },
        storage_path: "private-test-storage",
        items: [
          {
            name: "Synthetic shirt",
            category: "top",
            color: null,
            kind: "owned",
            wardrobe_item_id: savedId,
            image_url: "https://example.com/private?token=secret",
          },
        ],
      },
    };
    const response = await GET(
      new Request(`http://localhost/api/shared/${token}`),
      {
        params: Promise.resolve({ shareToken: token }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      public_snapshot: {
        title: "Synthetic look",
        source_type: "sample",
        items: [
          {
            name: "Synthetic shirt",
            category: "top",
            color: null,
            kind: "owned",
          },
        ],
      },
      catchphrase: "A synthetic outfit",
    });
  });

  it("revokes only an active scoped row and keeps repeated revoke idempotent", async () => {
    row = { id: shareId, revoked_at: null };
    expect(await revokeShare(shareId)).toEqual({ revoked: true });
    expect(query.update).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("workspace_id", workspaceId);
    expect(query.eq).toHaveBeenCalledWith("id", shareId);
    expect(query.is).toHaveBeenCalledWith("revoked_at", null);
    row = { id: shareId, revoked_at: "2026-10-31T00:00:00.000Z" };
    expect(await revokeShare(shareId)).toEqual({ revoked: true });
    expect(query.update).toHaveBeenCalledOnce();
  });

  it("rejects a foreign Origin before a bodyless revoke reaches the database", async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/shares/${shareId}`, {
        method: "DELETE",
        headers: { Origin: "https://unrelated.example" },
      }),
      { params: Promise.resolve({ shareId }) },
    );
    expect(response.status).toBe(403);
    expect(getBackendContext).not.toHaveBeenCalled();
  });
});

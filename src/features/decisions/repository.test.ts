import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./backend", () => ({
  BackendError: class extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
  getBackendContext: () => ({
    db: { from: mocks.from, rpc: mocks.rpc },
    workspaceId: "server-workspace",
  }),
  checkDatabase: (error: unknown) => {
    if (error) throw new Error("Sanitized database failure");
  },
}));
import { saveSelectedLook, wardrobeImagePath } from "./repository";

const lookId = "43000000-0000-4000-8000-000000000001";
const optionId = "44000000-0000-4000-8000-000000000001";
const snapshotId = "47000000-0000-4000-8000-000000000001";

describe("saved decision boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = {
      select: mocks.select,
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
    };
    mocks.from.mockReturnValue(query);
    mocks.select.mockReturnValue(query);
    mocks.eq.mockReturnValue(query);
  });

  it("rejects an option outside the requested look before invoking the save RPC", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(
      saveSelectedLook(lookId, { option_id: optionId, expected_revision: 1 }),
    ).rejects.toMatchObject({ status: 404, code: "option_not_found" });
    expect(mocks.eq.mock.calls).toEqual([
      ["workspace_id", "server-workspace"],
      ["look_id", lookId],
      ["id", optionId],
    ]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns the real snapshot ID and sends only server workspace and validated references", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: optionId },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: snapshotId, error: null });
    expect(
      await saveSelectedLook(lookId, {
        option_id: optionId,
        expected_revision: 3,
      }),
    ).toEqual({
      saved_look_id: snapshotId,
      look_id: lookId,
      option_id: optionId,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("save_outfit_option", {
      p_workspace_id: "server-workspace",
      p_option_id: optionId,
      p_expected_revision: 3,
    });
  });
});

describe("selected wardrobe image access", () => {
  const workspaceId = "00000000-0000-4000-8000-000000000001";
  const assetId = "42000000-0000-4000-8000-000000000001";
  const path = `${workspaceId}/synthetic-shirt.png`;
  const asset = {
    id: assetId,
    workspace_id: workspaceId,
    bucket: "wardrobe",
    storage_path: path,
    deleted_at: null,
  };

  it("uses an active actual wardrobe asset scoped to this workspace", () => {
    expect(
      wardrobeImagePath(
        { asset_id: assetId, image_path: null },
        asset,
        workspaceId,
      ),
    ).toBe(path);
  });

  it("does not fall back to a legacy path when the referenced asset is missing or deleted", () => {
    const item = { asset_id: assetId, image_path: path };
    expect(wardrobeImagePath(item, undefined, workspaceId)).toBeNull();
    expect(
      wardrobeImagePath(
        item,
        { ...asset, deleted_at: "2026-10-31T00:00:00Z" },
        workspaceId,
      ),
    ).toBeNull();
    expect(
      wardrobeImagePath(item, { ...asset, bucket: "inspiration" }, workspaceId),
    ).toBeNull();
  });

  it("only accepts a legacy image path when there is no asset reference and the prefix matches", () => {
    expect(
      wardrobeImagePath(
        { asset_id: null, image_path: path },
        undefined,
        workspaceId,
      ),
    ).toBe(path);
    expect(
      wardrobeImagePath(
        { asset_id: null, image_path: "other-workspace/shirt.png" },
        undefined,
        workspaceId,
      ),
    ).toBeNull();
    expect(
      wardrobeImagePath(
        { asset_id: null, image_path: `${workspaceId}/../other/shirt.png` },
        undefined,
        workspaceId,
      ),
    ).toBeNull();
    expect(
      wardrobeImagePath(
        { asset_id: null, image_path: `${workspaceId}/%2e%2e/other/shirt.png` },
        undefined,
        workspaceId,
      ),
    ).toBeNull();
    expect(
      wardrobeImagePath(
        { asset_id: assetId, image_path: path },
        { ...asset, workspace_id: "other-workspace" },
        workspaceId,
      ),
    ).toBeNull();
  });
});

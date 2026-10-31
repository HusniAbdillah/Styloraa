import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  configured: true,
  writes: "true",
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/env", () => ({
  isDatabaseConfigured: () => mocks.configured,
  getServerEnv: () => ({ DEMO_WRITES_ENABLED: mocks.writes }),
}));
vi.mock("./repository", () => ({
  insertWardrobeItemWithImage: mocks.insert,
  WardrobeItemNotFoundError: class WardrobeItemNotFoundError extends Error {},
  WardrobeAssetConflictError: class WardrobeAssetConflictError extends Error {},
}));
import { addWardrobeItem } from "./actions";

const imageAssetId = "00000000-0000-4000-8000-000000000001";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    name: "Linen shirt",
    category: "top",
    color: "Cream",
    image_asset_id: imageAssetId,
    ...overrides,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
describe("public demo mutation boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.configured = true;
    mocks.writes = "true";
    mocks.insert.mockResolvedValue(undefined);
  });
  it("does not forward a caller supplied workspace", async () => {
    const result = await addWardrobeItem(
      { ok: false, message: "" },
      form({ workspace_id: "foreign-workspace" }),
    );
    expect(result.ok).toBe(true);
    expect(mocks.insert).toHaveBeenCalledWith(
      { name: "Linen shirt", category: "top", color: "Cream" },
      imageAssetId,
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/wardrobe");
  });
  it("rejects invalid inputs before any database write", async () => {
    const result = await addWardrobeItem(
      { ok: false, message: "" },
      form({ category: "unsupported" }),
    );
    expect(result.ok).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("requires an uploaded image before saving", async () => {
    const result = await addWardrobeItem(
      { ok: false, message: "" },
      form({ image_asset_id: "" }),
    );
    expect(result.ok).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("blocks writes when the deployment write gate is disabled", async () => {
    mocks.writes = "false";
    const result = await addWardrobeItem({ ok: false, message: "" }, form());
    expect(result.ok).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not expose provider errors or secrets", async () => {
    mocks.insert.mockRejectedValue(new Error("secret-service-key"));
    const result = await addWardrobeItem({ ok: false, message: "" }, form());
    expect(result.ok).toBe(false);
    expect(result.message).not.toContain("secret-service-key");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const c = "00000000-0000-4000-8000-000000000003";
const mocks = vi.hoisted(() => ({
  configured: true,
  writes: "true",
  build: vi.fn(),
  inventory: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  isDatabaseConfigured: () => mocks.configured,
  getServerEnv: () => ({ DEMO_WRITES_ENABLED: mocks.writes }),
}));
vi.mock("./generation", () => ({ generateOwnedPreview: mocks.generate }));
vi.mock("./repository", () => ({
  buildItemPreview: mocks.build,
  buildLookPreview: mocks.build,
  buildOutfitPreview: mocks.build,
}));
vi.mock("@/features/wardrobe/repository", () => ({
  listWardrobeItems: mocks.inventory,
}));
vi.mock("@/features/capsules/repository", () => ({
  getCapsuleInventory: mocks.inventory,
}));
import { requestOwnedPreview } from "./request-handler";
const piece = {
  id: a,
  name: "Owned shirt",
  category: "top",
  color: "ivory",
  available: true,
};
function request(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/wardrobe/item/preview", {
    method: "POST",
    body: JSON.stringify({
      subject_type: "wardrobe_item",
      subject_id: a,
      mode: "single",
      item_ids: [a],
      consent_acknowledged: true,
      limitations_acknowledged: true,
      ...body,
    }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured = true;
  mocks.writes = "true";
  mocks.build.mockResolvedValue({ items: [piece] });
  mocks.inventory.mockResolvedValue([piece]);
  mocks.generate.mockResolvedValue({
    id: b,
    status: "succeeded",
    image_url: "https://example.com/generated.png",
  });
});
describe("preview request route boundary", () => {
  it("invokes generation only after validating a real owned selection", async () => {
    const response = await requestOwnedPreview(request(), {
      type: "wardrobe_item",
      id: a,
    });
    expect(response.status).toBe(201);
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ subject_id: a, mode: "single", item_ids: [a] }),
    );
  });
  it("rejects a body pointing at another subject before querying", async () => {
    expect(
      (
        await requestOwnedPreview(request({ subject_id: b }), {
          type: "wardrobe_item",
          id: a,
        })
      ).status,
    ).toBe(400);
    expect(mocks.build).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("rejects archived and unowned pieces instead of returning provider unavailable", async () => {
    mocks.build.mockResolvedValueOnce({
      items: [{ ...piece, available: false }],
    });
    expect(
      (await requestOwnedPreview(request(), { type: "wardrobe_item", id: a }))
        .status,
    ).toBe(400);
    expect(
      (
        await requestOwnedPreview(request({ item_ids: [c] }), {
          type: "wardrobe_item",
          id: a,
        })
      ).status,
    ).toBe(400);
  });
  it("requires explicit consent", async () => {
    expect(
      (
        await requestOwnedPreview(request({ consent_acknowledged: false }), {
          type: "wardrobe_item",
          id: a,
        })
      ).status,
    ).toBe(400);
  });
  it("validates capsule route identity", async () => {
    expect(
      (
        await requestOwnedPreview(
          request({ subject_type: "capsule_outfit", capsule_id: c }),
          { type: "capsule_outfit", id: a, capsuleId: b },
        )
      ).status,
    ).toBe(400);
  });
  it("honors database and write configuration before reading any data", async () => {
    mocks.writes = "false";
    expect(
      (await requestOwnedPreview(request(), { type: "wardrobe_item", id: a }))
        .status,
    ).toBe(403);
    mocks.configured = false;
    expect(
      (await requestOwnedPreview(request(), { type: "wardrobe_item", id: a }))
        .status,
    ).toBe(503);
    expect(mocks.build).not.toHaveBeenCalled();
  });
});

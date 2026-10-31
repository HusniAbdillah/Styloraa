import { loadEnvConfig } from "@next/env";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const online = process.env.OWNER1_STORAGE_VARIANTS_TESTS === "true";
const fixtureName = "Codex Owner1 Storage variants fixture 2026-10-31";
const jpegBytes = Buffer.from(
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKjAB//Z",
  "base64",
);
const webpBytes = Buffer.from(
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vy8AAA=",
  "base64",
);
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
  "base64",
);

describe.skipIf(!online)("Owner 1 hosted Storage variants", () => {
  let supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>
  >;
  let workspaceId = "";
  let ownsFixture = false;
  let itemId = "";
  let repository: typeof import("./repository");
  let prepareRoute: typeof import("@/app/api/wardrobe/[itemId]/image-uploads/route");
  let finalizeRoute: typeof import("@/app/api/wardrobe/[itemId]/image-uploads/[assetId]/finalize/route");

  beforeAll(async () => {
    loadEnvConfig(process.cwd());
    const env = await import("@/lib/env");
    workspaceId = env.getServerEnv().STYLORA_WORKSPACE_ID;
    if (!process.env.SUPABASE_URL?.includes("njjopdhdksycdgjbywrh"))
      throw new Error(
        "Storage variant tests require the approved hosted project.",
      );

    const server = await import("@/lib/supabase/server");
    supabase = server.createServerSupabase();
    repository = await import("./repository");
    prepareRoute =
      await import("@/app/api/wardrobe/[itemId]/image-uploads/route");
    finalizeRoute =
      await import("@/app/api/wardrobe/[itemId]/image-uploads/[assetId]/finalize/route");

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id,name")
      .eq("id", workspaceId)
      .maybeSingle();
    if (error || workspace?.name !== fixtureName)
      throw new Error(
        "Refusing to write: configured workspace is not the isolated Storage fixture.",
      );
    ownsFixture = true;

    const item = await repository.insertWardrobeItem({
      name: "Synthetic storage variants item",
      category: "top",
      color: "Synthetic",
    });
    itemId = item.id;
  }, 30_000);

  afterAll(async () => {
    if (!supabase || !ownsFixture) return;
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("storage_path")
      .eq("workspace_id", workspaceId)
      .eq("bucket", "wardrobe");
    if (assetsError)
      throw new Error("Could not inspect Storage test fixtures for cleanup.");
    if (assets?.length) {
      const { error } = await supabase.storage
        .from("wardrobe")
        .remove(assets.map((asset) => asset.storage_path));
      if (error) throw new Error("Could not remove Storage test objects.");
    }
    const { error: workspaceError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);
    if (workspaceError)
      throw new Error("Could not delete the Storage test workspace.");
  }, 30_000);

  async function prepareAndFinalize(
    mimeType: "image/jpeg" | "image/webp" | "image/png",
    bytes: Buffer,
    expectedAssetId: string | null,
  ) {
    const preparedResponse = await prepareRoute.POST(
      new Request("http://localhost/api/wardrobe/item/image-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType, byteSize: bytes.byteLength }),
      }),
      { params: Promise.resolve({ itemId }) },
    );
    expect(preparedResponse.status).toBe(201);
    const prepared = (await preparedResponse.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
      expectedAssetId: string | null;
    };
    expect(prepared.expectedAssetId).toBe(expectedAssetId);

    const { error: uploadError } = await supabase.storage
      .from("wardrobe")
      .uploadToSignedUrl(prepared.storagePath, prepared.uploadToken, bytes, {
        contentType: mimeType,
        upsert: false,
      });
    expect(uploadError).toBeNull();

    const response = await finalizeRoute.POST(
      new Request("http://localhost/api/wardrobe/item/image-uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedAssetId }),
      }),
      { params: Promise.resolve({ itemId, assetId: prepared.assetId }) },
    );
    return { prepared, response };
  }

  it("accepts JPEG and WebP, then allows exactly one concurrent replacement to win", async () => {
    const jpeg = await prepareAndFinalize("image/jpeg", jpegBytes, null);
    expect(jpeg.response.status).toBe(200);
    const jpegItem = await repository.getWardrobeItem(itemId);
    expect(jpegItem?.asset_id).toBe(jpeg.prepared.assetId);
    expect(jpegItem?.image_path).toBe(jpeg.prepared.storagePath);

    const webp = await prepareAndFinalize(
      "image/webp",
      webpBytes,
      jpeg.prepared.assetId,
    );
    expect(webp.response.status).toBe(200);
    const webpItem = await repository.getWardrobeItem(itemId);
    expect(webpItem?.asset_id).toBe(webp.prepared.assetId);

    const [left, right] = await Promise.all([
      prepareRoute.POST(
        new Request("http://localhost/api/wardrobe/item/image-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mimeType: "image/png",
            byteSize: pngBytes.byteLength,
          }),
        }),
        { params: Promise.resolve({ itemId }) },
      ),
      prepareRoute.POST(
        new Request("http://localhost/api/wardrobe/item/image-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mimeType: "image/png",
            byteSize: pngBytes.byteLength,
          }),
        }),
        { params: Promise.resolve({ itemId }) },
      ),
    ]);
    expect(left.status).toBe(201);
    expect(right.status).toBe(201);
    const leftUpload = (await left.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
      expectedAssetId: string | null;
    };
    const rightUpload = (await right.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
      expectedAssetId: string | null;
    };
    expect(leftUpload.expectedAssetId).toBe(webp.prepared.assetId);
    expect(rightUpload.expectedAssetId).toBe(webp.prepared.assetId);

    const uploaded = await Promise.all([
      supabase.storage
        .from("wardrobe")
        .uploadToSignedUrl(
          leftUpload.storagePath,
          leftUpload.uploadToken,
          pngBytes,
          {
            contentType: "image/png",
            upsert: false,
          },
        ),
      supabase.storage
        .from("wardrobe")
        .uploadToSignedUrl(
          rightUpload.storagePath,
          rightUpload.uploadToken,
          pngBytes,
          {
            contentType: "image/png",
            upsert: false,
          },
        ),
    ]);
    expect(uploaded.every(({ error }) => error === null)).toBe(true);

    const [leftFinalize, rightFinalize] = await Promise.all([
      finalizeRoute.POST(
        new Request(
          "http://localhost/api/wardrobe/item/image-uploads/finalize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedAssetId: webp.prepared.assetId }),
          },
        ),
        { params: Promise.resolve({ itemId, assetId: leftUpload.assetId }) },
      ),
      finalizeRoute.POST(
        new Request(
          "http://localhost/api/wardrobe/item/image-uploads/finalize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedAssetId: webp.prepared.assetId }),
          },
        ),
        { params: Promise.resolve({ itemId, assetId: rightUpload.assetId }) },
      ),
    ]);
    expect([leftFinalize.status, rightFinalize.status].sort()).toEqual([
      200, 409,
    ]);

    const winnerId =
      leftFinalize.status === 200 ? leftUpload.assetId : rightUpload.assetId;
    const finalItem = await repository.getWardrobeItem(itemId);
    expect(finalItem?.asset_id).toBe(winnerId);
    const references = await supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("asset_id", winnerId);
    expect(references.error).toBeNull();
    expect(references.count).toBe(1);
  }, 60_000);
});

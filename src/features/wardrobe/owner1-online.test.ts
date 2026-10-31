import { loadEnvConfig } from "@next/env";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const online = process.env.OWNER1_ONLINE_TESTS === "true";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe.skipIf(!online)("Owner 1 hosted Supabase end-to-end", () => {
  let supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>
  >;
  let workspaceId = "";
  let foreignWorkspaceId = "";
  let itemId = "";
  let foreignItemId = "";
  let actions: typeof import("./actions");
  let repository: typeof import("./repository");
  let preferenceRepository: typeof import("@/features/preferences/repository");
  let profileRepository: typeof import("@/features/profile/repository");
  let preferences: typeof import("@/features/preferences/actions");
  let profile: typeof import("@/features/profile/actions");
  let uploadRoute: typeof import("@/app/api/wardrobe/[itemId]/image-uploads/route");
  let finalizeRoute: typeof import("@/app/api/wardrobe/[itemId]/image-uploads/[assetId]/finalize/route");
  let cleanupRoute: typeof import("@/app/api/wardrobe/assets/cleanup/route");

  beforeAll(async () => {
    loadEnvConfig(process.cwd());
    const env = await import("@/lib/env");
    workspaceId = env.getServerEnv().STYLORA_WORKSPACE_ID;
    if (!process.env.SUPABASE_URL?.includes("njjopdhdksycdgjbywrh"))
      throw new Error(
        "Online Owner 1 tests require the configured hosted project.",
      );

    const server = await import("@/lib/supabase/server");
    supabase = server.createServerSupabase();
    actions = await import("./actions");
    repository = await import("./repository");
    preferenceRepository = await import("@/features/preferences/repository");
    profileRepository = await import("@/features/profile/repository");
    preferences = await import("@/features/preferences/actions");
    profile = await import("@/features/profile/actions");
    uploadRoute =
      await import("@/app/api/wardrobe/[itemId]/image-uploads/route");
    finalizeRoute =
      await import("@/app/api/wardrobe/[itemId]/image-uploads/[assetId]/finalize/route");
    cleanupRoute = await import("@/app/api/wardrobe/assets/cleanup/route");

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id,name")
      .eq("id", workspaceId)
      .maybeSingle();
    if (
      workspaceError ||
      workspace?.name !== "Codex Owner1 E2E fixture 2026-10-31"
    )
      throw new Error(
        "Refusing to write: configured workspace is not the isolated Owner 1 test fixture.",
      );

    const { data: foreignWorkspace, error: foreignWorkspaceError } =
      await supabase
        .from("workspaces")
        .insert({ name: "Codex Owner1 foreign-scope fixture" })
        .select("id")
        .single();
    if (foreignWorkspaceError || !foreignWorkspace)
      throw new Error("Could not create the isolated foreign-scope fixture.");
    foreignWorkspaceId = foreignWorkspace.id;
    const { data: foreignItem, error: foreignItemError } = await supabase
      .from("wardrobe_items")
      .insert({
        workspace_id: foreignWorkspaceId,
        name: "Synthetic foreign item",
        category: "top",
        color: "Blue",
      })
      .select("id")
      .single();
    if (foreignItemError || !foreignItem)
      throw new Error("Could not create the isolated foreign item fixture.");
    foreignItemId = foreignItem.id;
  }, 30_000);

  afterAll(async () => {
    if (!supabase) return;
    for (const id of [foreignWorkspaceId, workspaceId].filter(Boolean)) {
      const { data: assets } = await supabase
        .from("assets")
        .select("storage_path")
        .eq("workspace_id", id)
        .eq("bucket", "wardrobe");
      if (assets?.length)
        await supabase.storage
          .from("wardrobe")
          .remove(assets.map((asset) => asset.storage_path));
      await supabase.from("workspaces").delete().eq("id", id);
    }
  }, 30_000);

  it("keeps the empty state valid, completes CRUD, preferences and profile, and rejects foreign IDs", async () => {
    const empty = await repository.listWardrobePage({
      search: "",
      limit: 20,
      offset: 0,
    });
    expect(empty.total).toBe(0);
    expect(empty.items).toEqual([]);

    const initialState = { ok: false, message: "" };
    const created = await actions.addWardrobeItem(
      initialState,
      form({
        name: "Synthetic owner one item",
        category: "top",
        color: "Cream",
        workspace_id: foreignWorkspaceId,
      }),
    );
    expect(created.ok).toBe(true);

    const listed = await repository.listWardrobePage({
      search: "synthetic owner one",
      limit: 10,
      offset: 0,
    });
    expect(listed.total).toBe(1);
    itemId = listed.items[0].id;
    expect(Object.hasOwn(listed.items[0], "workspace_id")).toBe(false);

    const edited = await actions.editWardrobeItem(
      initialState,
      form({
        id: itemId,
        name: "Synthetic owner one item edited",
        category: "outerwear",
        color: "Olive",
        subcategory: "jacket",
        attributes: JSON.stringify({ fit: "relaxed", style_tags: ["casual"] }),
        workspace_id: foreignWorkspaceId,
      }),
    );
    expect(edited.ok).toBe(true);
    const editedItem = await repository.getWardrobeItem(itemId);
    expect(editedItem).toMatchObject({
      name: "Synthetic owner one item edited",
      category: "outerwear",
      color: "Olive",
      attributes: { fit: "relaxed", style_tags: ["casual"] },
    });

    const invalid = await actions.addWardrobeItem(
      initialState,
      form({ name: "x", category: "invalid", color: "" }),
    );
    expect(invalid.ok).toBe(false);
    const foreignRead = await repository.getWardrobeItem(foreignItemId);
    expect(foreignRead).toBeNull();
    const foreignEdit = await actions.editWardrobeItem(
      initialState,
      form({
        id: foreignItemId,
        name: "Changed foreign item",
        category: "top",
        color: "Red",
      }),
    );
    expect(foreignEdit).toEqual({
      ok: false,
      message: "Wardrobe item not found.",
    });

    const savedPreferences = await preferences.savePreferences(
      initialState,
      form({
        style_dna: JSON.stringify({
          style_tags: ["minimalist"],
          preferred_color_families: ["neutral"],
          contrast_level: "low",
          undertone: "unsure",
          skin_depth: "unsure",
        }),
        fit_preferences: JSON.stringify({
          preferred_fit: ["relaxed"],
          coverage: ["medium"],
        }),
        body_profile: "{}",
      }),
    );
    expect(savedPreferences.ok).toBe(true);
    const savedName = await profile.saveProfileName(
      initialState,
      form({ display_name: "Synthetic Owner 1" }),
    );
    expect(savedName.ok).toBe(true);

    const afterName = await preferenceRepository.getPreferences();
    expect(afterName.style_dna).toMatchObject({ style_tags: ["minimalist"] });
    expect(afterName.fit_preferences).toMatchObject({
      preferred_fit: ["relaxed"],
    });
    const profileRecord = await profileRepository.getProfile();
    expect(profileRecord.display_name).toBe("Synthetic Owner 1");

    expect(
      await preferences.savePreferences(
        initialState,
        form({ style_dna: "{}", fit_preferences: "{}", body_profile: "{}" }),
      ),
    ).toMatchObject({ ok: true });
    expect(
      await profile.saveProfileName(initialState, form({ display_name: "" })),
    ).toMatchObject({ ok: true });
    expect(await preferenceRepository.getPreferences()).toMatchObject({
      style_dna: {},
      fit_preferences: {},
      body_profile: {},
    });
    expect(await profileRepository.getProfile()).toEqual({
      display_name: null,
    });

    expect(
      await actions.removeWardrobeItem(initialState, form({ id: itemId })),
    ).toMatchObject({ ok: true });
    expect(
      await repository.listWardrobePage({ search: "", limit: 20, offset: 0 }),
    ).toMatchObject({ total: 0, items: [] });
    const archived = await supabase
      .from("wardrobe_items")
      .select("archived_at")
      .eq("id", itemId)
      .eq("workspace_id", workspaceId)
      .single();
    expect(archived.data?.archived_at).toBeTruthy();
  }, 60_000);

  it("cleans up an archived image after a transient detach failure", async () => {
    const initialState = { ok: false, message: "" };
    expect(
      await actions.addWardrobeItem(
        initialState,
        form({
          name: "Synthetic archive recovery item",
          category: "top",
          color: "Ivory",
        }),
      ),
    ).toMatchObject({ ok: true });
    const listed = await repository.listWardrobePage({
      search: "Synthetic archive recovery item",
      limit: 10,
      offset: 0,
    });
    const archivedItemId = listed.items[0].id;
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
      "base64",
    );
    await repository.attachWardrobeImage(archivedItemId, {
      bytes: png,
      mimeType: "image/png",
    });
    const attached = await repository.getWardrobeItem(archivedItemId);
    expect(attached?.asset_id).toBeTruthy();
    const assetId = attached!.asset_id!;

    const realFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      if (
        request.method === "PATCH" &&
        request.url.includes("/rest/v1/wardrobe_items") &&
        /"asset_id"\s*:\s*null/.test(await request.clone().text())
      )
        return Response.json(
          { message: "temporary database outage" },
          { status: 503 },
        );
      return realFetch(input, init);
    };
    let archiveResult;
    try {
      archiveResult = await actions.removeWardrobeItem(
        initialState,
        form({ id: archivedItemId }),
      );
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(archiveResult).toMatchObject({ ok: true });
    const stillReferenced = await supabase
      .from("wardrobe_items")
      .select("asset_id,archived_at")
      .eq("id", archivedItemId)
      .eq("workspace_id", workspaceId)
      .single();
    expect(stillReferenced.data?.archived_at).toBeTruthy();
    expect(stillReferenced.data?.asset_id).toBe(assetId);

    const staleTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("assets")
      .update({ created_at: staleTime })
      .eq("id", assetId)
      .eq("workspace_id", workspaceId);
    const cleanupResponse = await cleanupRoute.POST(
      new Request("http://localhost/api/wardrobe/assets/cleanup", {
        method: "POST",
      }),
    );
    expect(cleanupResponse.status).toBe(200);
    expect((await cleanupResponse.json()).data).toMatchObject({
      scanned: 1,
      deleted: 1,
      skipped: 0,
      failed: 0,
    });
    const detached = await supabase
      .from("wardrobe_items")
      .select("asset_id,image_path")
      .eq("id", archivedItemId)
      .eq("workspace_id", workspaceId)
      .single();
    expect(detached.data).toMatchObject({ asset_id: null, image_path: null });
    const retiredAsset = await supabase
      .from("assets")
      .select("deleted_at")
      .eq("id", assetId)
      .eq("workspace_id", workspaceId)
      .single();
    expect(retiredAsset.data?.deleted_at).toBeTruthy();
  }, 60_000);

  it("completes signed upload and server finalization while preserving workspace and bucket boundaries", async () => {
    const initialState = { ok: false, message: "" };
    expect(
      await actions.addWardrobeItem(
        initialState,
        form({
          name: "Synthetic image upload item",
          category: "top",
          color: "Ivory",
        }),
      ),
    ).toMatchObject({ ok: true });
    const itemList = await repository.listWardrobePage({
      search: "Synthetic image upload item",
      limit: 10,
      offset: 0,
    });
    expect(itemList.total).toBe(1);
    const uploadItemId = itemList.items[0].id;

    const invalidOversize = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/png",
          byteSize: 10 * 1024 * 1024 + 1,
        }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(invalidOversize.status).toBe(400);
    const invalidEmpty = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: "image/png", byteSize: 0 }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(invalidEmpty.status).toBe(400);
    const invalidType = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: "image/gif", byteSize: 68 }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(invalidType.status).toBe(400);
    const foreignUpload = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: "image/png", byteSize: 68 }),
      }),
      { params: Promise.resolve({ itemId: foreignItemId }) },
    );
    expect(foreignUpload.status).toBe(404);

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
      "base64",
    );
    const preparedResponse = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/png",
          byteSize: png.byteLength,
          workspace_id: foreignWorkspaceId,
        }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(preparedResponse.status).toBe(201);
    const prepared = (await preparedResponse.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
      expectedAssetId: string | null;
    };
    expect(prepared.storagePath.startsWith(`${workspaceId}/wardrobe/`)).toBe(
      true,
    );
    expect(prepared.uploadToken.length).toBeGreaterThan(10);

    const { error: uploadError } = await supabase.storage
      .from("wardrobe")
      .uploadToSignedUrl(prepared.storagePath, prepared.uploadToken, png, {
        contentType: "image/png",
        cacheControl: "300",
      });
    expect(uploadError).toBeNull();

    const forgedWorkspaceFinalize = await finalizeRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedAssetId: null,
          workspace_id: foreignWorkspaceId,
        }),
      }),
      {
        params: Promise.resolve({
          itemId: uploadItemId,
          assetId: prepared.assetId,
        }),
      },
    );
    expect(forgedWorkspaceFinalize.status).toBe(400);

    const finalizedResponse = await finalizeRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedAssetId: prepared.expectedAssetId }),
      }),
      {
        params: Promise.resolve({
          itemId: uploadItemId,
          assetId: prepared.assetId,
        }),
      },
    );
    expect(finalizedResponse.status).toBe(200);
    expect(await finalizedResponse.json()).toMatchObject({
      data: { assetId: prepared.assetId },
    });

    const linkedItem = await repository.getWardrobeItem(uploadItemId);
    expect(linkedItem?.asset_id).toBe(prepared.assetId);
    expect(linkedItem?.image_path).toBe(prepared.storagePath);
    const signedUrl = await repository.getWardrobeImageUrl(prepared.assetId);
    expect(signedUrl).toBeTruthy();
    const signedResponse = await fetch(signedUrl!);
    expect(signedResponse.status).toBe(200);
    expect(Buffer.from(await signedResponse.arrayBuffer())).toEqual(png);

    const supabaseUrl = new URL(process.env.SUPABASE_URL!);
    const unsignedUrl = `${supabaseUrl.origin}/storage/v1/object/public/wardrobe/${prepared.storagePath}`;
    const unsignedResponse = await fetch(unsignedUrl);
    expect(unsignedResponse.status).not.toBe(200);

    const { data: asset } = await supabase
      .from("assets")
      .select("source_type,byte_size,mime_type,deleted_at")
      .eq("id", prepared.assetId)
      .eq("workspace_id", workspaceId)
      .single();
    expect(asset).toMatchObject({
      source_type: "manual",
      byte_size: png.byteLength,
      mime_type: "image/png",
      deleted_at: null,
    });

    const spoofedBytes = Buffer.from("not a png image");
    const spoofPreparedResponse = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/png",
          byteSize: spoofedBytes.byteLength,
        }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(spoofPreparedResponse.status).toBe(201);
    const spoofPrepared = (await spoofPreparedResponse.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
    };
    const { error: spoofUploadError } = await supabase.storage
      .from("wardrobe")
      .uploadToSignedUrl(
        spoofPrepared.storagePath,
        spoofPrepared.uploadToken,
        spoofedBytes,
        { contentType: "image/png" },
      );
    expect(spoofUploadError).toBeNull();
    const spoofFinalizeResponse = await finalizeRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedAssetId: prepared.assetId }),
      }),
      {
        params: Promise.resolve({
          itemId: uploadItemId,
          assetId: spoofPrepared.assetId,
        }),
      },
    );
    expect(spoofFinalizeResponse.status).toBe(422);

    const largePng = Buffer.alloc(10 * 1024 * 1024);
    png.copy(largePng);
    const largePreparedResponse = await uploadRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/png",
          byteSize: largePng.byteLength,
        }),
      }),
      { params: Promise.resolve({ itemId: uploadItemId }) },
    );
    expect(largePreparedResponse.status).toBe(201);
    const largePrepared = (await largePreparedResponse.json()).data as {
      assetId: string;
      storagePath: string;
      uploadToken: string;
      expectedAssetId: string | null;
    };
    const { error: largeUploadError } = await supabase.storage
      .from("wardrobe")
      .uploadToSignedUrl(
        largePrepared.storagePath,
        largePrepared.uploadToken,
        largePng,
        { contentType: "image/png" },
      );
    expect(largeUploadError).toBeNull();
    const largeFinalizeResponse = await finalizeRoute.POST(
      new Request("http://localhost/api/wardrobe/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedAssetId: largePrepared.expectedAssetId,
        }),
      }),
      {
        params: Promise.resolve({
          itemId: uploadItemId,
          assetId: largePrepared.assetId,
        }),
      },
    );
    expect(largeFinalizeResponse.status).toBe(200);
    const largeItem = await repository.getWardrobeItem(uploadItemId);
    expect(largeItem?.asset_id).toBe(largePrepared.assetId);
    const expiringSignedUrl = await repository.getWardrobeImageUrl(
      largePrepared.assetId,
    );
    expect(expiringSignedUrl).toBeTruthy();
    const expiringResponse = await fetch(expiringSignedUrl!);
    expect(expiringResponse.status).toBe(200);
    const signedToken = new URL(expiringSignedUrl!).searchParams.get("token");
    expect(signedToken).toBeTruthy();
    const tokenPayload = JSON.parse(
      Buffer.from(signedToken!.split(".")[1], "base64url").toString(),
    ) as { exp?: number };
    expect(tokenPayload.exp).toBeTypeOf("number");
    const expiresAt = tokenPayload.exp! * 1000;
    expect(expiresAt - Date.now()).toBeGreaterThan(0);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, expiresAt - Date.now() + 1000)),
    );
    const expiredSignedResponse = await fetch(expiringSignedUrl!);
    expect(expiredSignedResponse.status).not.toBe(200);

    // Make a linked asset stale: the recovery endpoint must preserve references.
    const staleTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("assets")
      .update({ created_at: staleTime })
      .in("id", [prepared.assetId, largePrepared.assetId])
      .eq("workspace_id", workspaceId);

    const referenceTime = new Date(
      Date.now() - 5 * 60 * 60 * 1000,
    ).toISOString();
    const { data: referencedAssets, error: referenceAssetsError } =
      await supabase
        .from("assets")
        .insert(
          Array.from({ length: 10 }, () => {
            const storagePath = `${workspaceId}/wardrobe/${crypto.randomUUID()}.png`;
            return {
              workspace_id: workspaceId,
              bucket: "wardrobe",
              storage_path: storagePath,
              mime_type: "image/png",
              byte_size: png.byteLength,
              source_type: "manual",
              created_at: referenceTime,
            };
          }),
        )
        .select("id,storage_path");
    expect(referenceAssetsError).toBeNull();
    expect(referencedAssets).toHaveLength(10);
    const { error: referenceItemsError } = await supabase
      .from("wardrobe_items")
      .insert(
        referencedAssets!.map((asset, index) => ({
          workspace_id: workspaceId,
          name: `Synthetic referenced cleanup item ${index}`,
          category: "top",
          color: "Synthetic",
          asset_id: asset.id,
          image_path: asset.storage_path,
        })),
      );
    expect(referenceItemsError).toBeNull();
    const referenceUploads = await Promise.all(
      referencedAssets!.map((asset) =>
        supabase.storage.from("wardrobe").upload(asset.storage_path, png, {
          contentType: "image/png",
          upsert: false,
        }),
      ),
    );
    expect(referenceUploads.every(({ error }) => error === null)).toBe(true);

    const orphanPath = `${workspaceId}/wardrobe/${crypto.randomUUID()}.png`;
    const { data: orphan, error: orphanInsertError } = await supabase
      .from("assets")
      .insert({
        workspace_id: workspaceId,
        bucket: "wardrobe",
        storage_path: orphanPath,
        mime_type: "image/png",
        byte_size: png.byteLength,
        source_type: "manual",
        created_at: staleTime,
      })
      .select("id")
      .single();
    expect(orphanInsertError).toBeNull();
    expect(orphan).toBeTruthy();
    const { error: orphanUploadError } = await supabase.storage
      .from("wardrobe")
      .upload(orphanPath, png, { contentType: "image/png", upsert: false });
    expect(orphanUploadError).toBeNull();

    const realFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const request = input instanceof Request ? input : undefined;
      const url =
        request?.url ??
        (typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url);
      const method = init?.method ?? request?.method;
      if (method === "DELETE" && url.endsWith("/storage/v1/object/wardrobe"))
        return Response.json(
          { message: "temporary storage outage" },
          { status: 503 },
        );
      return realFetch(input, init);
    };
    const initialCleanup = await cleanupRoute.POST(
      new Request("http://localhost/api/wardrobe/assets/cleanup", {
        method: "POST",
      }),
    );
    expect(initialCleanup.status).toBe(200);
    const initialCleanupData = (await initialCleanup.json()).data as {
      scanned: number;
      skipped: number;
      nextCursor: { createdAt: string; id: string } | null;
    };
    expect(initialCleanupData).toMatchObject({ scanned: 10, skipped: 10 });
    expect(initialCleanupData.nextCursor).toBeTruthy();
    const cursorQuery = new URLSearchParams({
      cursorCreatedAt: initialCleanupData.nextCursor!.createdAt,
      cursorId: initialCleanupData.nextCursor!.id,
    });
    const cleanupRetryRequest = () =>
      new Request(
        `http://localhost/api/wardrobe/assets/cleanup?${cursorQuery.toString()}`,
        { method: "POST" },
      );
    try {
      const failedCleanup = await cleanupRoute.POST(cleanupRetryRequest());
      expect(failedCleanup.status).toBe(200);
      const failedResult = (await failedCleanup.json()).data;
      expect(failedResult).toMatchObject({
        scanned: 3,
        deleted: 0,
        skipped: 1,
        failed: 2,
      });
    } finally {
      globalThis.fetch = realFetch;
    }

    const retainedAfterFailure = await supabase.storage
      .from("wardrobe")
      .download(orphanPath);
    expect(retainedAfterFailure.error).toBeNull();
    const activeAfterFailure = await supabase
      .from("assets")
      .select("deleted_at")
      .eq("id", orphan!.id)
      .eq("workspace_id", workspaceId)
      .single();
    expect(activeAfterFailure.data?.deleted_at).toBeNull();

    const retriedCleanup = await cleanupRoute.POST(cleanupRetryRequest());
    expect(retriedCleanup.status).toBe(200);
    expect((await retriedCleanup.json()).data).toMatchObject({
      scanned: 3,
      deleted: 2,
      skipped: 1,
      failed: 0,
    });
    const removedObject = await supabase.storage
      .from("wardrobe")
      .download(orphanPath);
    expect(removedObject.error).toBeTruthy();
    const retiredOrphan = await supabase
      .from("assets")
      .select("deleted_at")
      .eq("id", orphan!.id)
      .eq("workspace_id", workspaceId)
      .single();
    expect(retiredOrphan.data?.deleted_at).toBeTruthy();
  }, 360_000);
});

import { loadEnvConfig } from "@next/env";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const online = process.env.OWNER1_ONLINE_TESTS === "true";
const fixtureName = "Codex Owner1 consumer E2E fixture 2026-10-31";

describe.skipIf(!online)("Owner 1 backend consumer integration", () => {
  let supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>
  >;
  let workspaceId = "";
  let fixtureOwned = false;
  let foreignWorkspaceId = "";
  let localItemId = "";
  let foreignItemId = "";
  let repository: typeof import("./repository");
  let previewRepository: typeof import("@/features/preview/repository");
  let capsuleQueries: typeof import("@/features/capsules/queries");
  let matching: typeof import("@/features/matching/engine");

  beforeAll(async () => {
    loadEnvConfig(process.cwd());
    const env = await import("@/lib/env");
    workspaceId = env.getServerEnv().STYLORA_WORKSPACE_ID;
    if (!process.env.SUPABASE_URL?.includes("njjopdhdksycdgjbywrh"))
      throw new Error(
        "Hosted consumer tests require the configured Supabase project.",
      );

    const server = await import("@/lib/supabase/server");
    supabase = server.createServerSupabase();
    repository = await import("./repository");
    previewRepository = await import("@/features/preview/repository");
    capsuleQueries = await import("@/features/capsules/queries");
    matching = await import("@/features/matching/engine");

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id,name")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceError || workspace?.name !== fixtureName)
      throw new Error(
        "Refusing hosted consumer writes outside the named disposable workspace.",
      );
    fixtureOwned = true;

    const { data: foreignWorkspace, error: foreignWorkspaceError } =
      await supabase
        .from("workspaces")
        .insert({ name: "Codex Owner1 consumer foreign fixture" })
        .select("id")
        .single();
    if (foreignWorkspaceError || !foreignWorkspace)
      throw new Error("Could not create the foreign-scope fixture.");
    foreignWorkspaceId = foreignWorkspace.id;

    const { data: foreignItem, error: foreignItemError } = await supabase
      .from("wardrobe_items")
      .insert({
        workspace_id: foreignWorkspaceId,
        name: "Synthetic foreign consumer item",
        category: "top",
        color: "Red",
      })
      .select("id")
      .single();
    if (foreignItemError || !foreignItem)
      throw new Error("Could not create the foreign item fixture.");
    foreignItemId = foreignItem.id;
  }, 30_000);

  afterAll(async () => {
    if (!supabase) return;
    for (const id of [
      foreignWorkspaceId,
      fixtureOwned ? workspaceId : "",
    ].filter(Boolean)) {
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

  it("feeds scoped Wardrobe records to matching, Capsule Studio and Preview", async () => {
    const { data: item, error } = await supabase
      .from("wardrobe_items")
      .insert({
        workspace_id: workspaceId,
        name: "Synthetic Owner 1 consumer item",
        category: "top",
        color: "Navy",
        attributes: {
          pattern: "solid",
          material: "cotton",
          texture: "smooth",
          silhouette: "straight",
          fit: "regular",
          length: "hip",
          styleTags: ["minimal"],
        },
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(item).toBeTruthy();
    localItemId = item!.id;

    const wardrobeItems = await repository.listWardrobeItems();
    const matchingInput = wardrobeItems.find(
      (entry) => entry.id === localItemId,
    );
    expect(matchingInput).toMatchObject({
      name: "Synthetic Owner 1 consumer item",
      category: "top",
      color: "Navy",
    });
    expect(wardrobeItems.some((entry) => entry.id === foreignItemId)).toBe(
      false,
    );

    const match = matching.rankWardrobeMatches(
      [
        {
          id: "synthetic-owner1-piece",
          name: "Navy minimal top",
          category: "top",
          confidence: 0.9,
          attributes: {
            colors: ["Navy"],
            pattern: "solid",
            apparentMaterial: "cotton",
            texture: "smooth",
            silhouette: "straight",
            fit: "regular",
            length: "hip",
            styleTags: ["minimal"],
          },
        },
      ],
      wardrobeItems,
    );
    expect(match[0]).toMatchObject({
      matchType: "owned_match",
      wardrobeItemId: localItemId,
      sourceType: "live",
    });

    const studioInventory = await capsuleQueries.loadStudioInventory();
    expect(
      studioInventory.find((entry) => entry.id === localItemId),
    ).toMatchObject({
      id: localItemId,
      name: "Synthetic Owner 1 consumer item",
      available: true,
    });
    expect(studioInventory.some((entry) => entry.id === foreignItemId)).toBe(
      false,
    );

    const capsuleIndex = await capsuleQueries.loadCapsuleIndex();
    expect(capsuleIndex.error).toBeNull();
    expect(
      capsuleIndex.inventory.some((entry) => entry.id === localItemId),
    ).toBe(true);

    const preview = await previewRepository.buildItemPreview(localItemId);
    expect(preview).toMatchObject({
      subject: { type: "wardrobe_item", id: localItemId },
      items: [
        {
          id: localItemId,
          name: "Synthetic Owner 1 consumer item",
          available: true,
        },
      ],
      provenance: "manual",
    });
    await expect(
      previewRepository.buildItemPreview(foreignItemId),
    ).rejects.toMatchObject({ message: "Wardrobe item not found." });
  }, 60_000);
});

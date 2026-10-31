import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { smokeOwner3 } from "./owner3-smoke.mjs";

process.loadEnvFile(".env.local");
const baseUrl = process.env.OWNER2_API_URL || "http://127.0.0.1:3001";
const workspaceId = process.env.STYLORA_WORKSPACE_ID;
const supabaseUrl = process.env.SUPABASE_URL;
assert.equal(new URL(supabaseUrl).hostname, "njjopdhdksycdgjbywrh.supabase.co");
assert.equal(process.env.DEMO_WRITES_ENABLED, "true");
assert.ok(
  workspaceId && process.env.SUPABASE_SECRET_KEY && process.env.SERPAPI_API_KEY,
);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname));
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const lookId = randomUUID();
const assetId = randomUUID();
const pieces = [
  { id: randomUUID(), name: "Black chino trousers", category: "bottom" },
  { id: randomUUID(), name: "White sneakers", category: "shoes" },
].map((piece) => ({
  ...piece,
  attributes: {},
  provenance: {},
  corrections: {},
  confidence: null,
  source_type: "sample",
}));
async function db(result, step) {
  const value = await result;
  assert.ok(!value.error, `${step}: ${value.error?.code || "database error"}`);
  return value.data;
}
try {
  await db(
    supabase.from("assets").insert({
      id: assetId,
      workspace_id: workspaceId,
      bucket: "inspiration",
      storage_path: `${workspaceId}/${assetId}.png`,
      mime_type: "image/png",
      byte_size: 1,
      source_type: "sample",
    }),
    "fixture asset metadata",
  );
  await db(
    supabase.rpc("persist_inspiration_revision", {
      p_workspace_id: workspaceId,
      p_look_id: lookId,
      p_expected_revision: 0,
      p_asset_id: assetId,
      p_title: "Synthetic Owner 2 to Owner 3 integration",
      p_notes:
        "Labelled persistence fixture; no Vision AI call or photo upload.",
      p_provider_metadata: { provider: "integration-fixture" },
      p_pieces: pieces,
      p_source_type: "sample",
    }),
    "Owner 2 inspiration persistence",
  );
  const items = pieces.map((piece, position) => ({
    slot_id: piece.category,
    piece_id: piece.id,
    item_kind: "missing",
    wardrobe_item_id: null,
    product_id: null,
    missing_brief: piece.name,
    rationale: "Synthetic integration fixture",
    position,
  }));
  await db(
    supabase.rpc("persist_look_results", {
      p_workspace_id: workspaceId,
      p_look_id: lookId,
      p_expected_revision: 1,
      p_replace_matches: true,
      p_matches: pieces.map((piece) => ({
        piece_id: piece.id,
        wardrobe_item_id: null,
        match_type: "missing",
        rationale: "Synthetic integration fixture",
        shared_attributes: {},
        differences: {},
        confidence: null,
        is_manual_override: false,
        source_type: "sample",
      })),
      p_options: ["closest", "from_wardrobe", "fresh_alternative"].map(
        (option_type) => ({
          option_type,
          title: `Synthetic ${option_type}`,
          rationale: "Why this? Synthetic integration fixture.",
          inputs_used: {},
          uncertainty: "Synthetic input; live marketplace tested separately.",
          provider_metadata: { provider: "integration-fixture" },
          source_type: "sample",
          items: option_type === "from_wardrobe" ? [] : items,
        }),
      ),
    }),
    "Owner 2 recommendation persistence",
  );
  const response = await fetch(new URL(`/api/looks/${lookId}`, baseUrl), {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200);
  const { data: look } = await response.json();
  assert.equal(look.options.length, 3);
  assert.equal(look.source_type, "sample");
  console.log(
    "PASS: labelled fixture persisted by Owner 2 RPCs and loaded through Owner 2 HTTP endpoint",
  );
  await smokeOwner3({ baseUrl, look, supabase, workspaceId });
} finally {
  await db(
    supabase
      .from("looks")
      .update({ selected_option_id: null })
      .eq("workspace_id", workspaceId)
      .eq("id", lookId),
    "fixture deselection",
  );
  await db(
    supabase
      .from("outfit_options")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId),
    "fixture options cleanup",
  );
  await db(
    supabase
      .from("looks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", lookId),
    "fixture look cleanup",
  );
  await db(
    supabase
      .from("assets")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", assetId),
    "fixture asset cleanup",
  );
  console.log(
    "CLEANUP: temporary fixture look and asset metadata removed; no Storage object was created",
  );
}

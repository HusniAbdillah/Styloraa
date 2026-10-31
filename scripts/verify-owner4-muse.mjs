import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createClient } from "@supabase/supabase-js";

const base = process.env.STYLORA_TEST_BASE_URL || "http://localhost:3104";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.SUPABASE_URL).hostname,
  ),
  "Live-provider verification must use a disposable local database.",
);
assert(
  process.env.MODEL_API_KEY,
  "The local app must have the shared Muse credential.",
);
const workspace = process.env.STYLORA_WORKSPACE_ID;
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const stateFile = path.join(os.tmpdir(), "stylora-muse-e2e.json");
const state = process.argv.includes("--resume")
  ? JSON.parse(readFileSync(stateFile, "utf8"))
  : { items: [], requests: {}, jobs: {} };
function checkpoint() {
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}
async function api(route, method = "GET", body, status = 200) {
  const response = await fetch(`${base}/api/${route}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(220000),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${route}: ${result.error?.code ?? "unexpected status"}`,
  );
  return result.data ?? result.error;
}
function data(result) {
  assert(!result.error, result.error?.message);
  return result.data;
}
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const fixtures = [
  {
    name: "Live Muse verification shirt",
    category: "top",
    color: "Ivory",
    svg: '<path d="M220 150 L130 190 L55 330 L160 380 L220 290 L220 640 L550 640 L550 290 L610 380 L720 330 L640 190 L550 150 L475 185 Q385 250 295 185Z" fill="#f0e6ce" stroke="#564b42" stroke-width="6"/><path d="M295 185 L385 285 L475 185 M385 285 L385 640" fill="none" stroke="#8a7c69" stroke-width="5"/>',
  },
  {
    name: "Live Muse verification trousers",
    category: "bottom",
    color: "Charcoal",
    svg: '<path d="M230 120 L550 120 L570 680 L410 680 L385 350 L365 680 L205 680Z" fill="#343333" stroke="#222121" stroke-width="6"/><path d="M230 180 L550 180 M385 180 L385 350" stroke="#77716d" stroke-width="5"/>',
  },
  {
    name: "Live Muse replacement jacket",
    category: "outerwear",
    color: "Oxblood",
    svg: '<path d="M240 140 L140 190 L65 600 L175 620 L235 350 L235 660 L545 660 L545 350 L600 620 L705 600 L630 190 L530 140 L445 200 L385 300 L320 200Z" fill="#642e3b" stroke="#48212b" stroke-width="6"/><path d="M320 200 L385 300 L445 200 M385 300 L385 660" stroke="#c6a8a5" fill="none" stroke-width="7"/>',
  },
];
if (!state.lookId) {
  for (const item of fixtures) {
    const bytes = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768"><rect width="768" height="768" fill="#fffefc"/>${item.svg}</svg>`,
      ),
    )
      .png()
      .toBuffer();
    const storagePath = `${workspace}/${randomUUID()}.png`;
    data(
      await db.storage
        .from("wardrobe")
        .upload(storagePath, bytes, { contentType: "image/png" }),
    );
    const asset = data(
      await db
        .from("assets")
        .insert({
          workspace_id: workspace,
          bucket: "wardrobe",
          storage_path: storagePath,
          mime_type: "image/png",
          byte_size: bytes.length,
          source_type: "manual",
        })
        .select("id")
        .single(),
    );
    const owned = data(
      await db
        .from("wardrobe_items")
        .insert({
          workspace_id: workspace,
          name: item.name,
          category: item.category,
          color: item.color,
          image_path: storagePath,
          asset_id: asset.id,
        })
        .select("id")
        .single(),
    );
    state.items.push(owned.id);
  }
  const brief = {
    purpose: "A compact, comfortable workweek",
    notes: "Use the real selected pieces; keep the styling restrained.",
    style_preferences: "Minimal",
    fit_preferences: "Relaxed",
    color_preferences: "Ivory and charcoal",
    avoid: "Formal tailoring",
  };
  state.capsuleId = (
    await api(
      "capsules",
      "POST",
      {
        title: "Live Muse verification capsule",
        brief,
        item_ids: state.items.slice(0, 2),
      },
      201,
    )
  ).id;
  checkpoint();
  const textBody = {
    request_id: randomUUID(),
    count: 2,
    required_item_ids: [state.items[0]],
    excluded_item_ids: [],
  };
  const suggestions = await api(
    `capsules/${state.capsuleId}/combinations`,
    "POST",
    textBody,
  );
  assert(suggestions.combinations.length > 0);
  for (const outfit of suggestions.combinations) {
    assert(outfit.item_ids.includes(state.items[0]));
    assert(outfit.item_ids.every((id) => state.items.slice(0, 2).includes(id)));
    assert(outfit.draft_token);
  }
  assert.deepEqual(
    (
      await api(`capsules/${state.capsuleId}/combinations`, "POST", textBody)
    ).combinations.map((x) => x.item_ids),
    suggestions.combinations.map((x) => x.item_ids),
  );
  const saved = await api(
    `capsules/${state.capsuleId}/outfits`,
    "POST",
    { ...suggestions.combinations[0], source_type: "live" },
    201,
  );
  assert.equal(saved.source_type, "live");
  const persisted = await api(`capsules/${state.capsuleId}`);
  assert.deepEqual(persisted.missing_additions, suggestions.missing_additions);
  state.outfitId = (
    await api(
      `capsules/${state.capsuleId}/outfits`,
      "POST",
      {
        title: "Two owned references",
        rationale: "Explicit local composition for live visual verification.",
        source_type: "manual",
        item_ids: state.items.slice(0, 2),
      },
      201,
    )
  ).id;
  state.lookId = data(
    await db.rpc("save_look", {
      p_workspace_id: workspace,
      p_title: "Live Muse owned look",
      p_notes: "Local verification input",
      p_item_ids: state.items.slice(0, 2),
    }),
  );
  checkpoint();
  console.log(
    "Muse Spark passed: real combinations, required IDs, signed save, replay and persisted missing additions.",
  );
}
const cases = [
  [
    "wardrobe",
    `wardrobe/${state.items[0]}/preview`,
    {
      subject_type: "wardrobe_item",
      subject_id: state.items[0],
      mode: "single",
      item_ids: [state.items[0]],
    },
  ],
  [
    "capsule",
    `capsules/${state.capsuleId}/outfits/${state.outfitId}/preview`,
    {
      subject_type: "capsule_outfit",
      subject_id: state.outfitId,
      capsule_id: state.capsuleId,
      mode: "combo",
      item_ids: state.items.slice(0, 2),
    },
  ],
  [
    "look",
    `looks/${state.lookId}/preview`,
    {
      subject_type: "look",
      subject_id: state.lookId,
      mode: "combo",
      item_ids: state.items.slice(0, 2),
    },
  ],
  [
    "replacement",
    `looks/${state.lookId}/preview`,
    {
      subject_type: "look",
      subject_id: state.lookId,
      mode: "single",
      item_ids: [state.items[2]],
    },
  ],
];
for (const [label, route, subject] of cases) {
  const body = state.requests[label] ?? {
    ...subject,
    request_id: randomUUID(),
    model_source: "mannequin",
    consent_acknowledged: true,
    limitations_acknowledged: true,
  };
  state.requests[label] = body;
  checkpoint();
  const result = await api(route, "POST", body, 201);
  assert.equal(result.status, "succeeded");
  assert.equal(result.stale, false);
  assert(result.image_url);
  assert.deepEqual(result.input.item_ids, subject.item_ids);
  assert.equal(
    (await api(route, "POST", body, 201)).id,
    result.id,
    "Replay must reuse the existing result.",
  );
  assert.equal((await api(`preview/jobs/${result.id}`)).status, "succeeded");
  const url = new URL(result.image_url);
  assert.equal(url.origin, new URL(process.env.SUPABASE_URL).origin);
  const image = await fetch(url);
  assert(image.ok);
  const bytes = Buffer.from(await image.arrayBuffer());
  assert(bytes.length > 100);
  writeFileSync(path.join(os.tmpdir(), `stylora-muse-${label}.png`), bytes);
  state.jobs[label] = result.id;
  checkpoint();
  console.log(
    `Muse Image passed: ${label}, private result, persisted status and idempotent replay.`,
  );
}
await api(`preview/jobs/${state.jobs.wardrobe}`, "DELETE");
const removed = data(
  await db
    .from("ai_jobs")
    .select("status,error_code,output_asset_id")
    .eq("workspace_id", workspace)
    .eq("id", state.jobs.wardrobe)
    .single(),
);
assert.equal(removed.error_code, "RESULT_DELETED");
assert.equal(removed.output_asset_id, null);
data(
  await db
    .from("wardrobe_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", workspace)
    .eq("id", state.items[2]),
);
assert.equal(
  (await api(`preview/jobs/${state.jobs.replacement}`)).stale,
  true,
  "Server must invalidate changed inventory.",
);
await api(
  `looks/${state.lookId}/preview`,
  "POST",
  { ...state.requests.replacement, request_id: randomUUID() },
  400,
);
data(
  await db
    .from("wardrobe_items")
    .update({ archived_at: null })
    .eq("workspace_id", workspace)
    .eq("id", state.items[2]),
);
checkpoint();
console.log(
  "Live provider walkthrough passed. Inputs are labelled synthetic garment references in local PostgreSQL; all AI responses/images came from Muse. No hosted fixture data was written.",
);

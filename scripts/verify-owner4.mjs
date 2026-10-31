import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const app = process.env.STYLORA_TEST_BASE_URL || "http://127.0.0.1:3104";
const database = process.env.SUPABASE_URL;
assert(
  database && ["localhost", "127.0.0.1"].includes(new URL(database).hostname),
  "Verification must use a disposable local database.",
);
assert(
  ["localhost", "127.0.0.1"].includes(new URL(app).hostname),
  "Verification must use a local app.",
);
const workspace = process.env.STYLORA_WORKSPACE_ID;
const key = process.env.SUPABASE_SECRET_KEY;
assert(workspace && key, "Local verification environment is incomplete.");

async function db(resource, method = "GET", body) {
  const response = await fetch(`${database}/rest/v1/${resource}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert(
    response.ok,
    `Local fixture request failed (${response.status}) for ${resource.split("?")[0]}.`,
  );
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function api(resource, method = "GET", body, expected = 200) {
  const response = await fetch(`${app}/api/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${resource}: ${result.error?.code || "unexpected status"}`,
  );
  return result.data ?? result.error;
}

const ids = [randomUUID(), randomUUID(), randomUUID()];
const foreignWorkspace = randomUUID();
const foreignItem = randomUUID();
const foreignCapsule = randomUUID();
await db("workspaces", "POST", {
  id: foreignWorkspace,
  name: "Owner 4 isolated verification",
});
await db("wardrobe_items", "POST", [
  {
    id: ids[0],
    workspace_id: workspace,
    name: "Verification ivory shirt",
    category: "top",
    color: "Ivory",
  },
  {
    id: ids[1],
    workspace_id: workspace,
    name: "Verification dark trousers",
    category: "bottom",
    color: "Charcoal",
  },
  {
    id: ids[2],
    workspace_id: workspace,
    name: "Verification neutral jacket",
    category: "outerwear",
    color: "Stone",
  },
  {
    id: foreignItem,
    workspace_id: foreignWorkspace,
    name: "Foreign scope piece",
    category: "top",
    color: "Blue",
  },
]);
await db("capsules", "POST", {
  id: foreignCapsule,
  workspace_id: foreignWorkspace,
  title: "Foreign verification capsule",
});
const brief = {
  purpose: "A week of workdays",
  notes: "Walkable, comfortable layers.",
  style_preferences: "Relaxed and considered",
  fit_preferences: "Room to move",
  color_preferences: "Quiet neutrals",
  avoid: "Nothing restrictive",
};
const capsule = await api(
  "capsules",
  "POST",
  {
    title: "A considered workweek",
    description: "Local persistence verification",
    brief,
    item_ids: ids.slice(0, 2),
    timeframe: "Five days",
    season: "Cool mornings",
    occasion: "Work",
  },
  201,
);
let detail = await api(`capsules/${capsule.id}`);
assert.deepEqual(detail.brief, brief);
assert.deepEqual(
  new Set(detail.items.map((item) => item.id)),
  new Set(ids.slice(0, 2)),
);
assert.equal(detail.timeframe, "Five days");
assert.equal(detail.season, "Cool mornings");
assert.equal(detail.occasion, "Work");
assert((await api("capsules")).some((item) => item.id === capsule.id));
await api(`capsules/${capsule.id}`, "PATCH", {
  expected_revision: detail.revision,
  title: "A considered workweek, refined",
  item_ids: ids,
});
detail = await api(`capsules/${capsule.id}`);
assert.equal(detail.items.length, 3);
assert.equal(detail.brief.notes, brief.notes);
const outfit = await api(
  `capsules/${capsule.id}/outfits`,
  "POST",
  {
    title: "Light top, dark foundation",
    rationale: "My chosen shirt with comfortable trousers.",
    item_ids: ids.slice(0, 2),
    source_type: "manual",
  },
  201,
);
assert.deepEqual(
  new Set(outfit.items.map((item) => item.id)),
  new Set(ids.slice(0, 2)),
);
await api(
  `capsules/${capsule.id}`,
  "PATCH",
  {
    expected_revision: detail.revision,
    title: "Must roll back",
    item_ids: ids.slice(1),
  },
  409,
);
assert.equal((await api(`capsules/${capsule.id}`)).title, detail.title);
await api(
  `capsules/${capsule.id}`,
  "PATCH",
  { expected_revision: 999, title: "Stale update" },
  409,
);
await api(
  `capsules/${capsule.id}/outfits`,
  "POST",
  {
    title: "Unsigned AI claim",
    rationale: "This is not provider output.",
    item_ids: [ids[0]],
    source_type: "live",
  },
  400,
);
await api(`capsules/${foreignCapsule}`, "GET", undefined, 404);
await api(
  "capsules",
  "POST",
  { title: "Foreign inventory", brief, item_ids: [foreignItem] },
  400,
);
const ai = await api(
  `capsules/${capsule.id}/combinations`,
  "POST",
  {
    source: "ai",
    required_item_ids: [ids[0]],
    excluded_item_ids: [ids[1]],
    count: 2,
  },
  503,
);
assert.equal(ai.code, "AI_NOT_CONFIGURED");
const lookId = await db("rpc/save_look", "POST", {
  p_workspace_id: workspace,
  p_title: "Verification owned look",
  p_notes: "Two owned pieces",
  p_item_ids: ids.slice(0, 2),
});
const snapshots = await db(
  `saved_look_snapshots?workspace_id=eq.${workspace}&look_id=eq.${lookId}&select=id`,
);
assert.equal(snapshots.length, 1);
const copied = await api(
  "capsules",
  "POST",
  {
    title: "From my owned look",
    brief,
    item_ids: [],
    from_saved_look_id: snapshots[0].id,
  },
  201,
);
assert.equal((await api(`capsules/${copied.id}`)).items.length, 2);
const jobsBefore = await db(
  `ai_jobs?workspace_id=eq.${workspace}&kind=eq.preview&select=id`,
);
for (const [route, subject] of [
  [
    `wardrobe/${ids[0]}/preview`,
    {
      subject_type: "wardrobe_item",
      subject_id: ids[0],
      mode: "single",
      item_ids: [ids[0]],
    },
  ],
  [
    `looks/${lookId}/preview`,
    {
      subject_type: "look",
      subject_id: lookId,
      mode: "combo",
      item_ids: ids.slice(0, 2),
    },
  ],
  [
    `capsules/${capsule.id}/outfits/${outfit.id}/preview`,
    {
      subject_type: "capsule_outfit",
      subject_id: outfit.id,
      capsule_id: capsule.id,
      mode: "combo",
      item_ids: ids.slice(0, 2),
    },
  ],
]) {
  assert((await api(route)).items.length > 0);
  const result = await api(
    route,
    "POST",
    {
      ...subject,
      model_source: "mannequin",
      consent_acknowledged: true,
      limitations_acknowledged: true,
    },
    503,
  );
  assert.equal(result.code, "VISUAL_PROVIDER_NOT_CONFIGURED");
}
assert.equal((await api(`looks/${snapshots[0].id}/preview`)).items.length, 2);
const optionId = randomUUID();
await db("outfit_options", "POST", {
  id: optionId,
  workspace_id: workspace,
  look_id: lookId,
  option_type: "closest",
  title: "The current owned selection",
  rationale: "An explicit local verification selection.",
  source_type: "manual",
  source_revision: 1,
});
await db("outfit_option_items", "POST", {
  workspace_id: workspace,
  look_id: lookId,
  option_id: optionId,
  slot_id: "selected-top",
  item_kind: "owned",
  wardrobe_item_id: ids[0],
});
const lookFilter = `looks?id=eq.${lookId}&workspace_id=eq.${workspace}`;
await db(lookFilter, "PATCH", { selected_option_id: optionId });
assert.deepEqual(
  (await api(`looks/${lookId}/preview`)).items.map((item) => item.id),
  [ids[0]],
  "Preview must follow the selected option rather than legacy look membership.",
);
const missingId = randomUUID();
await db("outfit_option_items", "POST", {
  id: missingId,
  workspace_id: workspace,
  look_id: lookId,
  option_id: optionId,
  slot_id: "missing-shoes",
  item_kind: "missing",
  missing_brief: "Shoes that are not owned",
});
await api(`looks/${lookId}/preview`, "GET", undefined, 400);
await api(
  `looks/${lookId}/preview`,
  "POST",
  {
    subject_type: "look",
    subject_id: lookId,
    mode: "single",
    item_ids: [ids[0]],
    model_source: "mannequin",
    consent_acknowledged: true,
    limitations_acknowledged: true,
  },
  400,
);
await db(
  `outfit_option_items?id=eq.${missingId}&workspace_id=eq.${workspace}`,
  "DELETE",
);
await db(lookFilter, "PATCH", { revision: 2 });
await api(`looks/${lookId}/preview`, "GET", undefined, 409);
await db(lookFilter, "PATCH", { revision: 1, source_type: "sample" });
await api(`looks/${lookId}/preview`, "GET", undefined, 400);
await db(lookFilter, "PATCH", {
  source_type: "manual",
  selected_option_id: null,
});
assert.equal(
  (await db(`ai_jobs?workspace_id=eq.${workspace}&kind=eq.preview&select=id`))
    .length,
  jobsBefore.length,
);
await api(
  `wardrobe/${foreignItem}/preview`,
  "POST",
  {
    subject_type: "wardrobe_item",
    subject_id: foreignItem,
    mode: "single",
    consent_acknowledged: true,
    limitations_acknowledged: true,
  },
  404,
);
await db(
  `wardrobe_items?id=eq.${ids[2]}&workspace_id=eq.${workspace}`,
  "PATCH",
  { archived_at: new Date().toISOString() },
);
await api(
  `wardrobe/${ids[2]}/preview`,
  "POST",
  {
    subject_type: "wardrobe_item",
    subject_id: ids[2],
    mode: "single",
    consent_acknowledged: true,
    limitations_acknowledged: true,
  },
  400,
);
writeFileSync(
  path.join(os.tmpdir(), "stylora-owner4-fixtures.json"),
  JSON.stringify({
    capsuleId: capsule.id,
    outfitId: outfit.id,
    lookId,
    snapshotId: snapshots[0].id,
    itemIds: ids,
    copiedCapsuleId: copied.id,
  }),
);
console.log(
  "Owner 4 API flow passed: persistence, exact selection, atomic rollback, stale edits, AI provenance, workspace boundaries and all preview contexts.",
);

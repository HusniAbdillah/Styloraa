import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const baseUrl = process.env.OWNER2_API_URL || "http://127.0.0.1:3000";
const supabaseUrl = process.env.SUPABASE_URL;
const workspaceId = process.env.STYLORA_WORKSPACE_ID;
const secret = process.env.SUPABASE_SECRET_KEY;
const imagePath =
  process.env.OWNER2_IMAGE_PATH || "src/dummy/outfit inspiration.jpg";
const imageMimeType = /\.png$/i.test(imagePath)
  ? "image/png"
  : /\.webp$/i.test(imagePath)
    ? "image/webp"
    : "image/jpeg";
const expectedHost = "njjopdhdksycdgjbywrh.supabase.co";

if (!supabaseUrl || new URL(supabaseUrl).hostname !== expectedHost) {
  throw new Error(
    "E2E safety check failed: the configured Supabase project is not the approved Stylora project.",
  );
}
if (
  !workspaceId ||
  !secret ||
  !process.env.MODEL_API_KEY ||
  process.env.DEMO_WRITES_ENABLED !== "true"
) {
  throw new Error(
    "E2E needs the hosted Supabase, Muse key, workspace and demo writes enabled.",
  );
}

const image = await readFile(imagePath);
if (image.byteLength > 10 * 1024 * 1024)
  throw new Error("E2E image exceeds the storage limit.");
const supabase = createClient(supabaseUrl, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let assetId;
let storagePath;
let lookId;

async function api(path, method, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error?.code || `HTTP_${response.status}`;
    throw new Error(`${method} ${path} failed: ${code}`);
  }
  return payload.data;
}

async function expectApiError(path, method, body, expectedCode) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (response.ok || payload?.error?.code !== expectedCode) {
    throw new Error(`${method} ${path} did not return ${expectedCode}.`);
  }
}

try {
  await expectApiError(
    "/api/inspiration/uploads",
    "POST",
    {
      fileName: "unsupported.gif",
      mimeType: "image/gif",
      byteSize: image.byteLength,
    },
    "INVALID_UPLOAD",
  );
  await expectApiError(
    "/api/inspiration/analyze",
    "POST",
    {
      assetId: "00000000-0000-4000-8000-000000000000",
    },
    "ASSET_NOT_FOUND",
  );
  console.log("PASS: unsupported upload and missing asset are rejected");

  const upload = await api("/api/inspiration/uploads", "POST", {
    fileName: "outfit-inspiration.jpg",
    mimeType: imageMimeType,
    byteSize: image.byteLength,
  });
  assetId = upload.assetId;
  storagePath = upload.storagePath;
  const uploaded = await supabase.storage
    .from("inspiration")
    .uploadToSignedUrl(storagePath, upload.uploadToken, image, {
      contentType: imageMimeType,
      upsert: false,
    });
  if (uploaded.error) throw new Error("Signed Storage upload failed.");
  console.log("PASS: hosted signed upload and private Storage object");

  const analysis = await api("/api/inspiration/analyze", "POST", {
    assetId,
    occasion: "Everyday",
  });
  lookId = analysis.lookId;
  if (!analysis.pieces?.length || analysis.provider.model !== "muse-spark-1.3")
    throw new Error("Muse analysis contract failed.");
  console.log(
    `PASS: real Muse image analysis (${analysis.pieces.length} pieces)`,
  );

  const reviewState = await api(`/api/looks/${lookId}`, "GET");
  const revisedPieces = reviewState.pieces.map((piece) => ({
    id: piece.id,
    name: piece.name,
    category: piece.category,
    attributes: piece.attributes,
    provenance: piece.provenance,
    corrections: { ...piece.corrections, reviewStatus: "E2E-reviewed" },
    confidence: piece.confidence,
    sourceType: piece.source_type,
  }));
  const reviewed = await api(`/api/looks/${lookId}/pieces`, "PATCH", {
    expectedRevision: analysis.revision,
    pieces: revisedPieces,
  });
  if (reviewed.revision !== analysis.revision + 1)
    throw new Error("Review revision did not advance.");
  console.log("PASS: persisted correction and optimistic revision");
  await expectApiError(
    `/api/looks/${lookId}/pieces`,
    "PATCH",
    {
      expectedRevision: analysis.revision,
      pieces: revisedPieces,
    },
    "REVISION_CONFLICT",
  );
  console.log("PASS: stale review revision is rejected");

  const matched = await api(`/api/looks/${lookId}/matches`, "POST", {
    expectedRevision: reviewed.revision,
  });
  if (matched.matches.length !== reviewed.pieces.length)
    throw new Error("Matching did not return a result per active piece.");
  if (
    matched.matches.some(
      (match) =>
        match.match_type !== "missing" || match.wardrobe_item_id !== null,
    )
  ) {
    throw new Error("The empty hosted wardrobe was not represented honestly.");
  }
  console.log(
    "PASS: real Muse match explanations; empty wardrobe remains missing",
  );
  await expectApiError(
    `/api/looks/${lookId}/matches`,
    "POST",
    {
      expectedRevision: reviewed.revision - 1,
    },
    "REVISION_CONFLICT",
  );
  console.log("PASS: stale matching revision is rejected");

  const firstMatch = matched.matches[0];
  await api(`/api/looks/${lookId}/matches/${firstMatch.id}`, "PATCH", {
    expectedRevision: matched.revision,
    matchType: "missing",
    wardrobeItemId: null,
    rationale: "Manually confirmed missing during the integration test.",
  });
  console.log("PASS: manual match override");

  const generated = await api(`/api/looks/${lookId}/outfit-options`, "POST", {
    expectedRevision: matched.revision,
  });
  const types = generated.options.map((option) => option.option_type).sort();
  if (types.join(",") !== "closest,fresh_alternative,from_wardrobe")
    throw new Error("Three distinct option types were not persisted.");
  if (
    generated.options.some(
      (option) => !option.rationale.startsWith("Why this?"),
    )
  )
    throw new Error("Recommendation rationale is missing.");
  const ownWardrobeOption = generated.options.find(
    (option) => option.option_type === "from_wardrobe",
  );
  if (ownWardrobeOption.items.length !== 0)
    throw new Error("Empty wardrobe option must not invent owned items.");
  console.log(
    "PASS: real Muse generated and persisted three explained options",
  );

  const reloaded = await api(`/api/looks/${lookId}`, "GET");
  if (
    reloaded.options.length !== 3 ||
    reloaded.pieces.length !== revisedPieces.length
  )
    throw new Error("Persisted result reload failed.");
  console.log("PASS: full hosted flow reloaded from Supabase");
  if (process.env.OWNER3_INTEGRATION === "true") {
    if (
      !process.env.SERPAPI_API_KEY ||
      process.env.SERPAPI_API_KEY.includes("YOUR_")
    ) {
      throw new Error("Owner 3 integration requires a configured SerpAPI key.");
    }
    const { smokeOwner3 } = await import("./owner3-smoke.mjs");
    await smokeOwner3({ baseUrl, look: reloaded, supabase, workspaceId });
  }
} finally {
  if (storagePath)
    await supabase.storage.from("inspiration").remove([storagePath]);
  if (lookId) {
    const { error } = await supabase
      .from("outfit_options")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("look_id", lookId);
    if (error) throw new Error("Temporary recommendation cleanup failed.");
  }
  if (lookId)
    await supabase
      .from("looks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", lookId);
  if (assetId)
    await supabase
      .from("assets")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", assetId);
  console.log(
    "CLEANUP: temporary hosted look, asset record, and Storage object removed",
  );
}

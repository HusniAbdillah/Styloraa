# Capsule and preview API

All endpoints use server-only Supabase access and the environment workspace.
Mutations and paid generation require DEMO_WRITES_ENABLED=true. No auth or
per-user privacy is implied. JSON input is validated with Zod.

## Capsules

GET/POST /api/capsules lists or creates persisted capsules.
GET/PATCH/DELETE /api/capsules/:id reads, updates or removes one capsule.
The full brief, timeframe, season, occasion and exact owned inventory persist
atomically. PATCH requires the current revision for the interactive editor.
Referenced saved pieces cannot be silently removed.

POST can use from_saved_look_id for an entirely owned snapshot. The frontend
Save as Capsule flow also passes the actual current selected IDs and optional
source option, rather than copying a fixed default composition.

GET/POST /api/capsules/:id/outfits lists or saves combinations.
GET/DELETE /api/capsules/:id/outfits/:outfitId reads or deletes one.
AI saves require a server-issued draft_token bound to the current capsule
revision. source_type=sample is rejected. All member IDs must be owned and
available in that capsule.

## Muse Spark combinations

POST /api/capsules/:id/combinations

Body: request_id (UUID), count (1–6), optional item_ids, required_item_ids and
excluded_item_ids, source=ai. A generated UUID is accepted for older clients;
new clients should retain their request ID when replaying a network request.

Uses Muse Spark 1.3, shared MODEL_API_KEY, https://api.meta.ai/v1/responses.
Returns combinations with signed draft tokens, missing_additions, source=ai
and dropped count. Invalid IDs, violated constraints or duplicate combinations
are filtered or rejected. Missing additions have name, category, rationale,
related_item_ids and uncertainty; they never become owned capsule members.
They persist on the capsule and clear when its brief, metadata or revision changes.

The brief and selected profile inputs are sent as data. Generation reserves a
workspace-scoped job atomically. Failed attempts remain in the usage ledger.
Limits: one active text generation, 10 requests/hour and 30/day per workspace.
Identical request IDs with unchanged fingerprints reuse the existing result.
A changed fingerprint with the same request ID returns 409.

## Muse Image previews

GET/POST /api/wardrobe/:itemId/preview
GET/POST /api/looks/:lookId/preview
GET/POST /api/capsules/:capsuleId/outfits/:outfitId/preview

GET returns owned composition. Look GET accepts option_id to preserve the
actual selected option; saved snapshot IDs also work. Mixed, stale, sample,
foreign or unavailable compositions are rejected.

POST body: request_id, subject_type, subject_id, optional capsule_id/option_id,
mode (single/combo), item_ids, model_source=mannequin, and both
consent_acknowledged=true and limitations_acknowledged=true. Route identity
must match the body. Single mode selects one item; combo selects 2–6.
Replacements must be available owned pieces in the current capsule/workspace
pool. Every selected item needs a valid private garment photo.

Muse Image 1.0 receives inline PNG/JPEG/WebP references, at most 10 MB each
and 12 MB combined. External provider search/shell tools are disabled. Output
is accepted only as bounded inline image bytes, never an arbitrary URL.
Results are stored in private previews Storage with random workspace paths.

POST awaits generation and returns 201 with the persisted job; a replay can
return its existing running or completed job. Provider deadline is 150s and
the Node route maxDuration is 240s. No un-awaited background job is started.
One active image request is allowed, with 6/hour and 12/day per workspace.
A job left running beyond four minutes becomes failed when checked. This is
failure recovery for an interrupted request, not a durable executor.

GET /api/preview/jobs/:jobId returns status, sanitized input, stale flag and a
short-lived signed image_url for a valid successful result. The page restores
the latest matching context after reload. Server fingerprints and newer
selection checks prevent relabelling an old image as the new composition.

DELETE /api/preview/jobs/:jobId removes the terminal image, marks its asset
deleted, detaches parent references and retains the failed/RESULT_DELETED
ledger row. Active work cannot be deleted. Capsule/outfit deletion also cleans
its terminal preview images. A new request ID is required for a new generation.

## Failure states

Missing MODEL_API_KEY returns 503 AI_NOT_CONFIGURED. Invalid composition or
consent returns 400; changed context returns 409; shared rate/concurrency limits
return 429; provider timeout returns 504. Provider details, keys and signed URLs
are not logged. Display uncertainty and the approximate-fit limitation.

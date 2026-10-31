# Capsule + preview API contract

Backend reference for the frontend agent building Capsule Studio pages and
the single preview template. All routes are same-origin Next.js Route
Handlers; responses are `{ data }` or `{ error: { code, message?, details? } }`.
Reads send `Cache-Control: no-store`. IDs are UUIDs; anything else is 400
`INVALID_ID`. Unknown or out-of-workspace records are 404 `NOT_FOUND`
(existence is never leaked). Mutations require `DEMO_WRITES_ENABLED=true`
or they return 403 `WRITE_DISABLED`.

## Capsules

`GET /api/capsules` → `{ data: [{ id, title, description, occasion, season,
timeframe, revision, created_at, updated_at, item_count, outfit_count }] }`

`POST /api/capsules` → 201 `{ data: { id } }`
Body: `{ title, description?, brief: { purpose, notes?, style_preferences?,
fit_preferences?, color_preferences?, avoid? }, timeframe?,
season?, occasion?, item_ids: [uuid] (1-100, unique),
from_saved_look_id?: uuid }`. Provide owned `item_ids` or
`from_saved_look_id` (owned looks only; archived items rejected).

`GET /api/capsules/:id` → capsule + `items: [{ id, name, category, color,
available }]`. Unavailable members stay visible with `available: false`.

`PATCH /api/capsules/:id` → updated capsule. Body fields all optional
(`title?, description?, brief?, timeframe?, season?, occasion?, item_ids?, expected_revision?`);
member replacement returns 409 `CONFLICT` when removed items are used by
saved outfits.

Brief, metadata and members are saved atomically by `save_capsule_studio`.
An expected revision mismatch also returns 409. Reload before retrying a stale edit.

`DELETE /api/capsules/:id` → `{ data: { id } }` (outfits cascade).

## Outfits (capsule scope)

`GET /api/capsules/:id/outfits` → outfit summaries (newest first).

`POST /api/capsules/:id/outfits` → 201 full outfit with items.
Body: `{ title, rationale, item_ids?: [uuid], from_saved_look_id?: uuid,
source_type?: manual|live, uncertainty?, draft_token? }`. Item IDs must already be
capsule members; anything else is 400 with a plain message.
Live AI output requires the unmodified server-issued `draft_token`; sample
output is rejected. User-arranged combinations use `manual`.

`GET /api/capsules/:id/outfits/:outfitId` → `{ id, title, rationale,
uncertainty, source_type, source_revision, inputs_used, created_at,
items: [{ id, name, category, color, available, position }] }`.

## Combinations (generate, nothing persisted)

`POST /api/capsules/:id/combinations`
Body: `{ item_ids?: [uuid] (defaults to available members),
required_item_ids?: [uuid], excluded_item_ids?: [uuid], count?: 1-6
(default 3), source?: ai (default ai) }`.
Response: `{ data: { combinations: [{ title, rationale, item_ids,
uncertainty, draft_token }], source, dropped? } }`. `dropped` counts AI suggestions
rejected by ownership verification. Without `META_API_KEY +
META_TEXT_MODEL`, generation returns 503 `AI_NOT_CONFIGURED`. There is no
synthetic AI fallback. Malformed provider output returns 502. Users can
arrange their own pieces and save them as manual outfits. Save a generated
combination through `POST .../outfits` with unchanged contents and its token.

## Preview composition (read-only, never AI-labeled)

- `GET /api/wardrobe/:itemId/preview` → `{ subject, title, items: [1],
  provenance: manual }`
- `GET /api/looks/:lookId/preview` → `{ subject, title, notes, is_saved,
  items, provenance: manual }`
- `GET /api/capsules/:id/outfits/:outfitId/preview` → `{ subject, title,
  rationale, source_type, items, provenance }`

## Preview generation (visual provider: separate, not configured)

`POST /api/capsules/:id/outfits/:outfitId/preview`
Body: `{ subject_type: capsule_outfit, subject_id (= outfitId), capsule_id
(= id), mode: single|combo, model_source?: mannequin|provider_model,
item_ids?: [uuid], consent_acknowledged: true, limitations_acknowledged: true }`.
Subject must match the route. Today this returns 503
`VISUAL_PROVIDER_NOT_CONFIGURED` and creates no job row. Render the
unavailable state; do not poll.

`POST /api/looks/:lookId/preview` and
`POST /api/wardrobe/:itemId/preview` follow the same contract with their
matching subject types/IDs and no capsule ID. Single mode requires one
owned piece; combo mode requires at least two. Replacements must be available
owned pieces in the current capsule/workspace context. Archived, suggested,
foreign and duplicate pieces are rejected before provider configuration is checked.

`GET /api/preview/jobs/:jobId` → `{ id, kind, status, error_code,
preview_mode, model_source, input, image_url, stale, created_at, updated_at,
completed_at }`. Statuses: `queued|running|succeeded|failed`. Poll with
backoff only after a provider exists; stop on terminal states.

`DELETE /api/preview/jobs/:jobId` deletes a terminal preview and its scoped
private result asset. Active jobs return 409; no cancellation is implied.

## Frontend rules from the design spec

- Label provenance everywhere (`manual` vs `live` vs `sample`); never
  present manual/sample output as provider results.
- Replaced garments invalidate previews (mark stale, never relabel).
- No invented percentages, ETAs, prices, or ratings.
- Pending/error/empty states per `docs/design/desktop-ux-spec.md` §12, §15.
- No browser Supabase client; never accept a workspace ID from the user.

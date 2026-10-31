# Owner 2 Backend Implementation Plan

**Product:** Stylora
**Owner:** Owner 2 — Inspiration and Styling
**Scope:** Backend only; no page or component work
**Branch:** `feat/owner-2-backend-flow`
**Backend environment:** Hosted Supabase project `njjopdhdksycdgjbywrh` and the real Meta Muse API
**Status:** Implemented and verified on 2026-10-31. Test limitations are recorded in the verification section.

## 1. Outcome and product contract

Implement the backend that turns a saved outfit inspiration image into editable garment detections, wardrobe matches, and exactly three explained outfit recommendations. Every inference must be attributable to its source and confidence. Recommendation explanations must state which explicit preference signals were used and what remains uncertain. The implementation is shared-workspace demo software: all server routes use the configured workspace; authentication and per-user isolation are outside this owner’s current scope.

The workflow is:

1. Request a signed upload for a supported image and upload directly to the private Supabase `inspiration` bucket.
2. Ask Muse to analyze the stored image and persist a look plus detected pieces atomically.
3. Allow the user to review, correct, add, or remove detections using optimistic revisions.
4. Match each active piece against active wardrobe rows and persist one result per piece.
5. Generate and persist `closest`, `from_wardrobe`, and `fresh_alternative` options using only valid wardrobe/product IDs or explicit missing-item briefs.
6. Reload the complete persisted result; editing the review invalidates prior matches and options through revision-scoped data.

## 2. Boundaries and dependencies

### Included

- Node.js Next.js App Router Route Handlers for upload, analysis, review edits, matching, match overrides, option generation, and reloading a look.
- Server-only Supabase access, private storage, workspace scoping, persistence, input validation, provider error handling, matching and recommendation contracts.
- Two atomic RPCs for analysis/revision persistence and match/option persistence. A third follow-up migration qualifies a table column to fix a hosted PostgreSQL ambiguity discovered by E2E.
- Unit tests, hosted database assertions, hosted HTTP E2E with the supplied outfit image, and a written verification record.

### Excluded

- Frontend screens and visual components.
- Owner 1’s wardrobe CRUD and preference-form implementation; this backend reads the existing `wardrobe_items` and `user_preferences` contracts.
- Marketplace search, product comparison/value scoring, selected/saved outfit, sharing, capsule generation, and try-on previews. Those belong to other owners and may consume the persisted options later.
- Local Supabase runtime. The requested verification target is the already-configured hosted project.

### Shared-contract ownership

Owner 1 owns the shared wardrobe/preferences schema and generated database types. Owner 2 owns the endpoints, matching/recommendation behavior, and provides the additive SQL contract. Coordinate changes before altering shared tables. Never change an already-applied migration; add a follow-up migration and regenerate types after any RPC signature change.

## 3. Existing contract and implementation choices

- Runtime: Node.js 22, Next.js App Router, pnpm 10.26.2, TypeScript, Zod 4.
- Persistence: Supabase Postgres with the existing tables `assets`, `looks`, `inspiration_pieces`, `wardrobe_items`, `user_preferences`, `wardrobe_matches`, `outfit_options`, and `outfit_option_items`.
- Storage: private `inspiration` bucket; store object paths in Postgres and issue a short-lived signed upload URL. Never persist or trust a signed URL as an asset reference.
- AI: server-side official OpenAI-compatible TypeScript SDK pointed at `https://api.meta.ai/v1`, using `MODEL_API_KEY` and model `muse-spark-1.3`. Image understanding and strict JSON Schema output are validated again with Zod. AI output is never mocked in application behavior or the hosted E2E test.
- Workspace: use only server-configured `STYLORA_WORKSPACE_ID`; do not take a workspace ID or arbitrary remote image URL from a client request.
- Preferences: undertone, skin depth/tone, style DNA, fit preferences, and body profile are optional, user-selected signals. Never infer them from the inspiration image or claim they informed a result when they were absent.
- Garment categories: exactly the shared wardrobe categories `top`, `bottom`, `dress`, `outerwear`, `shoes`, and `accessory`.
- Image detection may describe visible color, pattern, apparent material/texture, silhouette, fit, length/cut, sleeve, neckline, rise, layering role, style tags, occasion, and season. Exact fiber content, brand/SKU, identity, and body measurements are out of scope.

## 4. API contract

All routes return a no-store JSON envelope and sanitized error codes; provider credentials and raw upstream error text must not reach a response.

| Method and route | Purpose | Main safeguards |
| --- | --- | --- |
| `POST /api/inspiration/uploads` | Create asset metadata and return asset ID, random storage path, signed upload URL/token | JPEG/PNG/WebP only, 10 MiB maximum, private bucket, workspace from server config |
| `POST /api/inspiration/analyze` | Verify uploaded private object, run real Muse image analysis, persist look and pieces | Verify actual bytes and MIME signature; strict schema; atomic RPC; time-bounded provider call |
| `GET /api/looks/[lookId]` | Reload the current look, active pieces, current-revision matches/options and ordered option items | UUID validation; workspace-scoped server query |
| `PATCH /api/looks/[lookId]/pieces` | Replace review set with edits/additions/removals | Expected revision; IDs must belong to the look; changes invalidate derived matches |
| `POST /api/looks/[lookId]/matches` | Rank active wardrobe candidates and request fashion-grounded explanations | Current revision; only active workspace inventory and selected preferences |
| `PATCH /api/looks/[lookId]/matches/[matchId]` | Apply user-selected match override | Match and candidate scoped to look/workspace; missing cannot reference an item |
| `POST /api/looks/[lookId]/outfit-options` | Generate and persist exactly three recommendation types | Current matches/revision required; exactly the allowed options and valid owned/product IDs |

### Garment record

Persist the canonical table fields: `name`, `category`, `attributes`, `provenance`, `corrections`, `confidence` (0–1 or null), `source_type`, and `position`. Keep granular details in JSON attributes and field-level source/confidence/evidence in provenance. User edits are stored in corrections. Use optimistic `looks.revision` checks to reject stale updates.

### Matching record

Persist `piece_id`, optional `wardrobe_item_id`, one of `owned_match`, `wardrobe_alternative`, or `missing`, rationale, shared attributes, differences, confidence, source revision, manual override flag, and source type. If the live wardrobe is empty, return `missing`; never claim synthetic test inventory is user-owned.

### Recommendation record

Persist exactly `closest`, `from_wardrobe`, and `fresh_alternative` with title, rationale (“Why this?”), explicit inputs used, uncertainty, provider metadata, source type/revision, and ordered item slots. `from_wardrobe` may be empty when the wardrobe is empty and must not contain invented items. Require unique option titles and non-empty item rationales. Validate all returned item/piece IDs against the look’s current rows and supplied inventory before persistence.

## 5. Phases, work breakdown, and gates

### Phase 1 — Branch, environment, and shared contract

- Fetch `origin/main`; create the feature branch from the fetched main commit.
- Preserve existing workspace edits and the supplied `src/dummy/outfit inspiration.jpg`.
- Validate required server-only env names without printing values; add `MODEL_API_KEY` to `.env.example`.
- Inspect live tables and RPC signatures before implementation; align generated types with the hosted schema.

**Gate:** frozen-lockfile install; environment validation; `pnpm check`; confirm branch ancestry.
**Status:** PASS. Branch was created from fetched `origin/main` at `44129c8`. Existing user file changes and sample image were retained. `corepack pnpm@10.26.2 check` passed after the final distinct-title guard: ESLint, Next route type generation, TypeScript, and 15 Vitest tests. Frozen-lockfile installation was not rerun because dependencies were already installed.

### Phase 2 — Secure hosted image upload

- Validate file metadata and enforce JPEG, PNG, or WebP up to 10 MiB.
- Generate an unguessable object path under the configured workspace in private `inspiration` storage.
- Insert an `assets` row and issue a short-lived signed upload credential.
- Verify asset ownership, object existence, actual size, and byte-signature MIME before model use.

**Gate:** supported/rejected MIME and size; invalid asset; missing object; private storage; sample-image signed upload and download; path persistence.
**Status:** PASS for the hosted signed upload using the supplied image and private object flow. Unsupported image MIME and missing asset requests are rejected by hosted HTTP tests. Oversize and missing-object tests are not included in the runner.

### Phase 3 — Real Muse analysis and editable persistence

- Call the real Muse provider with image input and strict JSON Schema output.
- Revalidate provider output with Zod; reject partial/invalid outputs.
- Normalize categories, attributes, field provenance, confidence, and uncertainty.
- Atomically save the look and pieces using `persist_inspiration_revision`.
- Support add/edit/remove and optimistic revision checks through the review endpoint.

**Gate:** real model response, valid categories/attributes, atomic persistence, review reload, revision conflict, timeout and safe retry.
**Status:** PASS for real Muse inference on the provided image, persisted review correction/revision, and stale revision rejection. Timeout, 401/429, and transport retry simulation are not yet separately exercised.

### Phase 4 — Wardrobe matching and outfit recommendations

- Read only active workspace wardrobe and current preference record.
- Rank candidates deterministically using category, color, pattern, material/texture, silhouette/fit/length, and style evidence.
- Ask Muse for grounded explanations; validate the explanation IDs and selected preference signals.
- Persist a complete match set and manual overrides.
- Ask Muse for three distinct options; validate every referenced item and piece; persist atomically.

**Gate:** all match classifications, empty inventory, manual override, stale revision, foreign IDs, three option types, no fabricated owned rows.
**Status:** PASS for the hosted empty-wardrobe path, real Muse explanations and options, missing classification, manual override, stale matching revision rejection, and distinct persisted option types. No live synthetic wardrobe rows were inserted. Full positive owned-item matching was covered by deterministic unit fixtures only; foreign wardrobe ID rejection is not yet part of the hosted E2E runner.

### Phase 5 — End-to-end verification and handoff

- Run `pnpm check`, production build, hosted migration/type verification, pgTAP, and HTTP E2E.
- E2E sequence: signed upload → real Muse analysis → correction/revision → real explanations/matching → manual override → real three-option generation → reload → hosted data cleanup.
- Confirm no test wardrobe fixtures were written to the shared hosted wardrobe; record failures and known limits honestly.
- Commit and push the feature branch after checks and documentation are complete.

**Gate:** all intended API stages persist and reload; temp data cleaned; all repository checks reported with actual results.
**Status:** E2E PASS after fixing a hosted RPC ambiguity; hosted cleanup verified. `corepack pnpm@10.26.2 check` and `corepack pnpm@10.26.2 build` both passed. The implementation and handoff documentation are pushed to `origin/feat/owner-2-backend-flow`.

## 6. Verification record

### Hosted environment

- Project: `njjopdhdksycdgjbywrh` (hosted Supabase; online project, not local Docker).
- Confirmed workspace REST query and private bucket availability before changes.
- Applied migrations: `owner2_inspiration_flow`, `owner2_inspiration_revision_inputs`, and `owner2_revision_ambiguous_columns`.
- Generated TypeScript types from the hosted schema.
- Muse model list endpoint returned HTTP 200 and `muse-spark-1.3` was available for the configured key.
- Live wardrobe was empty at verification time. No synthetic wardrobe rows were added to the hosted database.

### Checks and outcomes

| Check | Result | Notes |
| --- | --- | --- |
| `corepack pnpm@10.26.2 check` | PASS | Final run: ESLint, Next route type generation, TypeScript, 4 test files / 15 tests |
| Supabase migration application | PASS | Three additive migrations applied to hosted Supabase |
| Hosted pgTAP | PASS, 13 assertions | Tested invoker security, grants, atomic analysis, empty-wardrobe missing result, three options, status transition, and stale revision; transaction rolled back |
| Hosted E2E signed image upload | PASS | Used `src/dummy/outfit inspiration.jpg` |
| Real Muse image analysis | PASS | One run returned 7 pieces; another returned 8; results are naturally model-dependent |
| Persisted review edit/revision | PASS | First attempt revealed a PL/pgSQL ambiguous output column; fixed with follow-up migration |
| Hosted matching/explanation | PASS | Live empty wardrobe correctly returned missing; explanation came from Muse |
| Manual match override | PASS | Explicit missing override persisted |
| Three explained options | PASS | All three option types persisted from real Muse; empty `from_wardrobe` contains no invented items |
| Reload from hosted Supabase | PASS | Look, pieces, matches, and options reloaded successfully |
| Cleanup | PASS | Temporary look, asset row, and Storage object removed; hosted inventory unchanged |
| Hosted negative HTTP cases | PARTIAL PASS | Unsupported upload type, missing asset, stale review revision, and stale match revision rejected; oversize, missing object, foreign wardrobe ID, and provider failure injection are not covered by this runner |
| `corepack pnpm@10.26.2 build` | PASS | Final run after repository isolation fix; optimized Next.js build and route compilation completed |
| Push to origin | PASS | Implementation and handoff docs are published on `origin/feat/owner-2-backend-flow` |

## 7. Operational and privacy constraints

- Never log, return, or include secret values in browser bundles. `MODEL_API_KEY` and Supabase service-role credentials are server-only.
- Responses must not echo provider error bodies. Use stable error codes and no-store headers.
- Upload references must be workspace-scoped object paths. Signed URLs are temporary transport credentials only.
- Limit model data to the necessary image, extracted clothing descriptions, workspace wardrobe descriptions, and preferences explicitly selected by the user.
- Never guess a user’s undertone, skin depth, body shape, or fit preference from an inspiration photo. In every explanation, distinguish supplied inputs from missing data.
- Never represent a local sample fixture as a live wardrobe item. Keep demo fixtures tagged and confined to disposable test environments.

## 8. Known limitations and follow-up

- This is a shared-workspace demo backend; the existing project has no authentication boundary for individual users.
- Hosted E2E validated a live empty wardrobe. Positive matching across owned rows was tested through deterministic unit fixtures, not by writing synthetic garments into the shared hosted wardrobe.
- The backend does not implement Owner 3 marketplace search/value scoring or Owner 4 previews/capsules; those will consume the data contracts later.
- Negative provider/transport/storage/database failure cases still need automated HTTP coverage before a production release.
- Meta outputs can vary between calls. Validate each result and present confidence/uncertainty instead of promising identical detections.

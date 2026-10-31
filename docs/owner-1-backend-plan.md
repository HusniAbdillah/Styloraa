# Owner 1 Backend Completion Plan

**Scope:** wardrobe, Style DNA/preferences, shared profile label, and their
private Storage lifecycle. This plan covers backend work only. It does not
assign page/UI implementation.

**Plan baseline:** Owner 1 backend work continues on the current Owner 1 feature
branch; see the final verification record below for checks run on this pass.

## 1. Product and ownership contract

The Owner 1 feature assignment in `TASK.md` and the earlier Owner 1 plan covers
the shared wardrobe, optional preferences/body context, and a shared display
name. This project has no authentication: those values are shared by every
visitor using one configured workspace. A profile name is a workspace label,
not a per-person identity. Use synthetic data only and do not imply private
wardrobe storage.

There is an ownership mismatch in the repository: `docs/sprint-plan.md` assigns
the migration/generated-type stream and wardrobe to Developer 2, and
preferences to Developer 4; `TASK.md` makes Owner 1 accountable for wardrobe,
profile, and the single migration/type stream. This plan follows the user's
explicit Owner 1 scope and `TASK.md`. Before a new schema change, reconcile that
assignment with the team. Existing schema is sufficient for the remaining
Owner 1 work; do not add or edit migrations or generated types unless a
verified blocker requires it.

The supplied Figma node `41-505` is now readable through the connected Figma
plugin. Its title is **02 Product / Desktop and mobile**. The metadata contains
desktop Wardrobe `44:325`, desktop Preferences `44:549`, mobile Wardrobe
`44:830`, mobile Preferences `44:987`, desktop item editor `45:611`, and
mobile item editor `45:1173`. The active design sources in this repository are
`docs/design/streamlined-v2.md` and `docs/design/v2-handoff.md`; the older
page-by-page desktop specification is archived. The current design implies a
wardrobe collection with add/edit/archive and optional images, plus Preferences
for optional Style DNA/body/fit selections. Profile/preferences are shared
settings. The Figma page excludes profile preferences from the public look;
keep `display_name` out of public snapshots. Contextual item editor panels and
mobile sheets are UI concerns and are outside this backend plan.

## 2. Application and runtime model

This is one Next.js App Router application, not a separately running backend
service. Server Components load page data, Server Actions serve UI mutations,
and Route Handlers provide reusable HTTP contracts where needed. Feature logic
belongs in `src/features/<feature>`; routes stay thin. All Supabase access is
server-only through `src/lib/supabase/server.ts`. The service secret bypasses
RLS, so each parent and child query must explicitly use the environment's
`STYLORA_WORKSPACE_ID`. Never take workspace scope from a form, URL, or body.

### Run and check

Prerequisites are Node.js 22 and pnpm 10.26.2. Install and run the app with:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
# Fill the server-only Supabase settings, then:
pnpm dev
```

Open `http://localhost:3000`. `pnpm dev` runs the frontend and backend together;
Supabase is the remote data service configured by `.env.local`. Do not put
`SUPABASE_SECRET_KEY` in a `NEXT_PUBLIC_` variable. Set
`DEMO_WRITES_ENABLED=true` only for the shared demo after schema, workspace,
and online connectivity are confirmed. It enables writes for all visitors; it
is not access control.

The repository's current check/build wrappers are `pnpm check` (`lint`, Next
type generation + TypeScript, and Vitest) and `pnpm build` (Webpack build in
the current local config). `pnpm build:turbopack` runs the default Turbopack
path. Past local reports say `pnpm check` and Webpack `pnpm build` passed;
Turbopack's CSS worker failed in this Windows/OneDrive environment. Those are
local-code checks, not hosted backend proof. This plan's runtime tests must use
the hosted Supabase project as requested; no local Supabase reset is part of
this plan.

## 3. Current backend status

### Implemented and verified

- `wardrobe_items` reads are workspace-scoped, active-only by default, ordered,
  paginated and searchable by name, color, or category, with an exact category
  filter. Server Actions validate add, edit, archive, and
  image removal. Remove uses `archived_at` to preserve historical references.
- Wardrobe metadata supports an optional image; user facts remain separate
  from `inferred_attributes` and `attribute_provenance`.
- Preferences and profile have server-only repositories, Zod validation,
  write-gate checks, shared singleton reads/writes, and clear/reset semantics.
- The nullable `user_preferences.display_name` migration has been applied to
  the hosted project, and generated database types were reported to match the
  hosted schema. Do not rerun or edit that migration.
- Signed upload preparation and server-side finalization now bypass the
  Server Action body limit. Upload reservations use the hosted-valid
  `assets.source_type='manual'` value; no new enum value or remote migration is
  required. Finalize verifies workspace, item compare-and-set, stored size,
  declared type and image signature. Upload capability lifetime is bounded.
  Focused hosted Storage checks also passed JPEG and WebP finalize plus a
  simultaneous replacement race with exactly one 200 winner and one 409
  conflict.
- Orphan cleanup now scans at most 10 stale manual wardrobe assets in the
  configured workspace, rechecks references to wardrobe items, AI job inputs
  and outputs, and looks, removes from the fixed private bucket, and only then
  stamps `deleted_at`. Deterministic `(created_at,id)` cursor pagination lets
  later calls move past referenced assets without starving later orphans.
  Recent uploads are protected by a three-hour grace period, longer than the
  two-hour upload capability. If archive detach fails, a later eligible cleanup
  retry detaches the archived row before retiring the object. A retry route
  exposes bounded recovery with sanitized responses.
- Hosted E2E has passed in disposable workspaces: empty state; create/edit,
  search, archive; preferences/profile save and clear without overwriting;
  known foreign item read/edit/upload rejection; forged workspace values;
  invalid metadata; PNG upload/finalize; exactly 10 MiB upload; spoofed image
  signature rejection; signed read and unsigned private-object denial; and
  injected Storage DELETE outage followed by a successful retry. Linked stale
  assets were skipped. Each fixture workspace and its Storage objects were
  removed by test cleanup.
- Online smoke evidence already recorded in the prior Owner 1 plan: wardrobe
  create/edit/filter/reload/archive; preferences save/clear/reload; profile
  save/clear/reload; private image upload/replace/remove; invalid MIME, size,
  and byte-signature rejection; signed image response and 300-second token
  lifetime; RLS enabled and direct anon REST access denied; hosted SQL smoke
  rolled back and restored shared preferences/profile values.
- Unknown random IDs returned no record / generic not-found. This is not proof
  for a known ID from another workspace.
- A hosted wardrobe record was consumed successfully by matching, Capsule
  Studio, Capsule index, and Preview. A known foreign-workspace item was absent
  from those inventories and rejected by Preview.
- A production-mode local Next server passed an actual HTTP smoke against
  hosted Supabase: color/category page search, prepare upload, signed direct
  Storage upload, finalize, and rendering/reading the resulting private image.
  This is local process evidence, not a Vercel Preview deployment.

### Remaining verification

No Owner 1 backend or Supabase verification remains open. Hosted schema,
workspace-scope, RLS/grants, private Storage, CRUD/preferences/profile, upload,
cleanup-retry, and consumer integration results are recorded below. The
authenticated-role check is not applicable to this no-auth product. Vercel
deployment verification is outside this backend completion scope.

## 4. Actual table and bucket contract

Do not create parallel wardrobe/profile tables. `src/types/database.ts` is
generated from the schema and currently maps these Owner 1 records:

| Actual object                                 | Existing fields used by Owner 1                                                                                                                                                                             | Contract and constraints                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspaces`                                  | `id`, `name`, `created_at`                                                                                                                                                                                  | Fixed demo workspace is read from server environment; never from the client.                                                                                                                                                                                                                                                                                                                                            |
| `wardrobe_items`                              | `id`, `workspace_id`, `name`, `category`, `color`, `subcategory`, `notes`, `attributes`, `inferred_attributes`, `attribute_provenance`, `asset_id`, `image_path`, `archived_at`, `created_at`, `updated_at` | Category remains the existing text/check contract (`top`, `bottom`, `dress`, `outerwear`, `shoes`, `accessory`). `attributes` contains user-entered details; inferred fields/provenance remain separate. `(workspace_id,id)` is unique; item-to-asset FK includes workspace and restricts bad cross-workspace references. Read inventory with `workspace_id` and `archived_at IS NULL`. Archive instead of hard-delete. |
| `assets`                                      | `id`, `workspace_id`, `bucket`, `storage_path`, `mime_type`, `byte_size`, `source_type`, `created_at`, `deleted_at`                                                                                         | Permanent path only; no signed URL stored. Wardrobe object is under `{workspace_id}/wardrobe/{random-id}.{ext}`. Keep asset-row lookups scoped by both workspace and bucket.                                                                                                                                                                                                                                            |
| `user_preferences`                            | `workspace_id`, `style_notes`, `style_dna`, `fit_preferences`, `body_profile`, `display_name`, `updated_at`                                                                                                 | One row per workspace (workspace PK/FK). JSON fields are optional objects; `{}` means skipped/cleared. `display_name` is nullable, trimmed, and constrained to 1–80 characters when non-null. Preference updates must preserve profile name; profile updates must preserve JSON preferences.                                                                                                                            |
| `storage.buckets` / private `wardrobe` bucket | Bucket metadata, not an app table                                                                                                                                                                           | Existing hosted contract is private, JPEG/PNG/WebP, 10 MiB per file. There are intentionally no direct browser data policies. Keep this private and server-issued signed upload/read capabilities narrowly scoped.                                                                                                                                                                                                      |

All four public application tables retain RLS and deny direct `PUBLIC`, `anon`,
and `authenticated` Data API access. That database denial does not replace the
server predicate: `SUPABASE_SECRET_KEY`/secret credentials bypass RLS.

## 5. Page-to-backend contract

| Product surface             | Backend reads/writes                                                                                                                                                                                                                                            | Existing storage                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Wardrobe**                | List active items; bounded search/category filters and pagination; count; add metadata-only item; edit by stable ID; archive; attach/replace/remove optional image; resolve signed image on demand.                                                             | `wardrobe_items`, plus `assets` and private `wardrobe` bucket when an image exists. |
| **Preferences / Style DNA** | Read and save optional style tags, preferred color families, contrast, user-selected undertone/skin-depth, fit, coverage, lengths/layering, and optional body-shape/proportions/illustration references. Clear means empty JSON objects, not inferred defaults. | `user_preferences.style_dna`, `.fit_preferences`, `.body_profile`.                  |
| **Profile**                 | Read/save/clear one short shared demo display name.                                                                                                                                                                                                             | `user_preferences.display_name`; do not add a separate profile table.               |
| **Owner 2/4 consumers**     | Publish stable wardrobe item IDs and optional preference values actually saved. A consumer must state which preferences it used and cannot infer fields from photos.                                                                                            | Existing records only; no Owner 1 writes to look/capsule tables.                    |

## 6. Ordered completion plan

### Execution rule: test each major part before proceeding

Work proceeds in the following gates. A phase is complete only when its
focused checks and its integration checks against all earlier completed phases
pass. Keep test data in a separately created, temporary online workspace so
the shared demo stays unchanged. If the production demo has no wardrobe rows,
test that empty state first, then create synthetic rows in the temporary
workspace for positive CRUD, filtering, and Storage cases. Delete the temporary
workspace and verify its child rows/objects are gone at the end.

| Gate                                         | Small parts                                                                                                                                                              | Required focused checks                                                                                                                                | Integration with previous gates                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **G0 — Baseline and fixture**                | Confirm latest main/dirty files; read hosted schema, grants, bucket and migration state; create one disposable workspace and record its ID securely in the test process. | Online connection; empty-list response; no direct `anon`/`authenticated` access; no changes to shared workspace.                                       | Entry gate for all subsequent checks.                                                                  |
| **G1 — Metadata CRUD, preferences, profile** | Test empty wardrobe; add/edit/filter/paginate/archive; test invalid payload and forged workspace fields; save/clear preferences and display name.                        | Reload persisted values; preserve preference fields when profile changes and vice versa; unknown IDs return generic not-found.                         | Uses G0 workspace; archive retains history and does not interfere with the preference singleton.       |
| **G2 — Signed upload and finalize**          | Prepare scoped upload; upload bytes with the signed capability; finalize/verify bytes; read signed URL; replace/remove.                                                  | JPEG/PNG/WebP success; zero/oversize/unsupported/spoofed bytes rejection; unauthorized item/finalize rejection; token not logged or persisted as path. | Runs against G1-created item; confirms item metadata and preference/profile remain unchanged.          |
| **G3 — Asset cleanup recovery**              | Discover unreferenced assets; retry removal idempotently; bounded batch and reference checks.                                                                            | Inject Storage removal failure; verify object/asset remains retryable; retry successfully; referenced assets are skipped.                              | Uses G2 upload/remove/replacement and G1 archived item records; confirms no live item loses its image. |
| **G4 — Boundary and complete flow**          | Known foreign workspace/item fixture; direct private-object denial; 300-second signed-read expiry; full start-to-finish smoke; clean fixture.                            | Reads/mutations/uploads reject foreign IDs; unsigned GET denied; URL works before and fails after expiry; workspace and Storage cleanup verified.      | Replays G1 → G2 → G3 in order; compares before/after shared demo counts and preferences.               |
| **G5 — Regression/handoff**                  | Record existing project checks and hosted evidence; inspect diffs and update the handoff.                                                                                | Previously recorded `pnpm check`, `pnpm build`, hosted suites, and local production HTTP smoke; no secret exposure or schema drift.                   | Do not repeat completed checks for this handoff.                                                       |

**Execution status (2026-10-31):** G0 passed from hosted schema inspection.
G1–G4 passed in hosted tests, including actual signed URL rejection after 300
seconds, JPEG/WebP uploads, concurrent replacement, and consumer integration.
The shared demo workspace was not used for writes. Disposable fixture
workspaces and Storage objects were removed. G5 `pnpm check`, `pnpm build`,
and a separate production-mode local HTTP smoke passed against hosted Supabase.
This completes the Owner 1 backend scope; Vercel deployment verification is
not an acceptance requirement.

### P1 — Signed upload transport (implementation complete)

**Files:** `src/features/wardrobe/actions.ts`, `src/features/wardrobe/repository.ts`,
new/updated thin route under `src/app/api/wardrobe/`, wardrobe schema/tests,
and only necessary focused documentation. Keep all Supabase code in the
server-only feature repository.

Implemented in `src/features/wardrobe/repository.ts` and thin handlers under
`src/app/api/wardrobe/`. The prepare handler validates item and metadata,
records a workspace-scoped asset reservation, and issues a non-upsert signed
upload. The client receives only the short-lived signed capability. Finalize
downloads the exact object server-side, validates actual size/type/signature,
then attaches via compare-and-set against the previous asset ID. Reservations
use the existing allowed `manual` source type, because live schema inspection
confirmed that custom pending values violate `assets_source_type_check`.
Reservations older than the 3-hour grace (upload tokens last 2 hours) cannot
finalize and become eligible for orphan cleanup.

**Hosted exit gate:** passed for PNG/JPEG/WebP success, invalid/unsupported MIME,
zero/oversize metadata, forged workspace, foreign item, spoofed signature,
signed read/private unsigned denial, and an exactly 10 MiB file. A deployed
Vercel preview was not exercised. A hosted concurrent multi-client replacement
test passed with one winner and one conflict.

**Technical basis:** Next.js Server Actions accept a configurable request
body limit, but Vercel Functions cap request/response bodies at 4.5 MiB. A
larger client upload should bypass the function and go directly to Storage
using a short-lived signed capability. See [Next.js Server Action body limit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions),
[Vercel Function limits](https://vercel.com/docs/functions/limitations),
[Supabase signed upload URL](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl),
and [upload to signed URL](https://supabase.com/docs/reference/javascript/file-buckets-uploadtosignedurl).

### P2 — Safe retry path for orphaned wardrobe assets (implementation complete)

**Files:** `src/features/wardrobe/repository.ts`, a focused server-only cleanup
entry point (and its route only if an external scheduler needs it), and
Owner 1 tests. Avoid migrations unless schema review proves existing `assets`
fields cannot support retry.

Implemented in the repository and `src/app/api/wardrobe/assets/cleanup/route.ts`.
Each route call scans at most 10 stale candidates in the configured workspace
and returns a deterministic continuation cursor when more candidates remain.
The repository rechecks the exact asset, bucket, active state and references
across wardrobe items, AI job inputs/outputs and looks before removing from the
fixed bucket. It detaches residual links from archived wardrobe rows, then
stamps `deleted_at` only after successful removal or confirmed absence; failures
preserve the row for a later attempt. The 3-hour grace protects fresh upload
reservations and recent replacements.

**Hosted exit gate:** passed with an injected Storage DELETE outage: orphan rows
remained active and their objects remained present, while stale referenced
assets were skipped. A continuation cursor moved past 10 older referenced
assets to later candidates. After restoring Storage, retry removed orphan
objects and marked rows deleted. A separate hosted test injected an archive
detach failure and confirmed a later cleanup detached the archived row before
retiring its asset. This proves retry behavior but not a deployed
scheduler/preview. The endpoint has no user auth by product design; it is
workspace-scoped and only considers stale unreferenced assets. Deployment must
confirm the write gate is configured intentionally.

### P3 — Close the workspace and private-Storage verification gaps

Use the Supabase plugin once it is installed/connected, or the project's
approved secure CLI/runtime. Read-only schema inspection and rollback-scoped
SQL assertions are allowed. Do not apply remote migrations, reset hosted data,
or create/delete shared records without explicit test fixtures and cleanup.

1. **Passed:** checked against a deliberately provisioned, known
   foreign-workspace fixture
   using the app/server API; do not search another workspace with the
   privileged key. A foreign item detail/edit/upload returned generic not-found.
2. **Passed:** unsigned object GET was denied, signed download worked before
   expiry and the same URL was denied after its live 300-second expiration.
   The test fixture and its object were cleaned.
3. **Previously verified:** re-read live schema metadata for actual Owner 1 fields/constraints, RLS,
   grants, `(workspace_id, id)`/asset FK, workspace singleton constraint,
   and bucket privacy/size/MIME. Compare CLI-generated hosted types with
   `src/types/database.ts`; do not hand-edit types. No authenticated role
   check is required unless the product later adds auth.
4. **Passed in-process:** invoked actual Server Actions and Route Handler
   functions against hosted Supabase, rather than relying on raw SQL alone.
   The production-mode local HTTP smoke also passed against hosted Supabase.
   Client workspace scope, invalid payload rejection, archived-row filtering,
   and independent preference/profile updates are covered by the recorded
   hosted results.
5. **Passed for this run:** recorded disposable fixture outcomes and cleanup
   without recording keys, signed URLs or personal payloads. Project was the
   configured hosted Supabase project; temporary fixtures were removed.

**Exit gate:** server boundary, live grants, and private-object behavior passed,
including a local production-server HTTP smoke against hosted Supabase.

### P4 — Close the Supabase handoff (complete)

1. Accept the hosted Supabase results recorded in this plan; do not repeat the
   hosted tests, local reset, type generation, or build/check suites.
2. Preserve the existing server-only API contracts, schema, migrations, and
   generated database types. No backend API or database changes are required.
3. Keep the recorded fixture cleanup and local HTTP smoke as the completion
   evidence. No deployment action is part of this backend handoff.

**Exit gate:** all Owner 1 backend and Supabase checks are complete according
to the recorded results; no API, schema, or deployment work remains in scope.

## 7. Invariants for every phase

- Strict TypeScript; Zod validation occurs inside server entry points.
- Server-only Supabase client. Every root and child query/mutation constrains
  `workspace_id` from `STYLORA_WORKSPACE_ID`. Never accept it from clients.
- Keep RLS enabled and direct `anon`/`authenticated` table grants revoked;
  separately review the privileged server predicates because secret keys
  bypass RLS.
- Keep metadata-only wardrobe items valid. Never make preferences required or
  infer body, skin depth, undertone, or fit from an image.
- Preserve saved-look/capsule references by archiving wardrobe rows. Do not
  hard-delete linked rows or create parallel preference/profile tables.
- Keep buckets private; persist only random permanent paths and asset IDs.
  Signed upload/read URLs are temporary capabilities and never permanent IDs.
- No credentials, storage tokens, signed URLs, or personal data in client
  bundles, logs, Markdown or commits.
- No auth, queue, ORM, SDK, or long-running worker is introduced by this plan.

## 8. Verification record for this implementation pass (2026-10-31)

| Check                               | Outcome                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted project and isolated fixture | Supabase project `njjopdhdksycdgjbywrh` was accessed with the connected Supabase plugin. Every E2E run used a disposable workspace; a final query confirmed `0` fixture workspaces remain. Shared demo workspace was not written.                                                                                                  |
| Hosted Owner 1 end-to-end           | Full online run: 2 tests passed, covering CRUD/preferences/profile, foreign IDs, upload/finalize, exact 10 MiB, spoofed bytes, private read/expiry and cleanup cursor/retry. Follow-up hosted tests passed search semantics (1), archive-detach recovery (1), JPEG/WebP and concurrent replace (1), plus consumer integration (1). Tests invoke real actions/handlers in-process against hosted Supabase. |
| Standard regression suite           | Previously recorded as passed: `pnpm check`, lint, Next route type generation, `tsc --noEmit`, and the full Vitest suite. Not rerun for this handoff. Hosted online suites are recorded separately against isolated hosted fixtures. |
| Production build                    | `pnpm build` (`next build --webpack`): passed, including production compile, TypeScript, static page generation and route output.                                                                                                                                                                                                  |
| Formatting and diff                 | `git diff --check` and `prettier --check` passed for the Owner 1 plan, online test and repository.                                                                                                                                                                                                                                 |
| Signed URL expiry                   | Passed against hosted Storage: the signed read succeeded before the token's 300-second expiry and failed after expiry; unsigned access was denied.                                                                                                                                                                                 |
| Running app / hosted Supabase       | Local production-mode Next process passed HTTP page search, prepare, signed Storage upload, finalize, and private image render/read against hosted Supabase. Vercel deployment verification is out of scope and was not performed. |
| Schema and deployment changes       | No migration, reset, hosted schema edit, deployment, push or commit was performed. Disposable fixtures were cleaned.                                                                                                                                                                                                           |

## 9. Official technical references

- [Supabase API keys and secret-key handling](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage signed URL downloads](https://supabase.com/docs/guides/storage/serving/downloads)
- [Supabase signed upload URL API](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl)
- [Supabase upload-to-signed-URL API](https://supabase.com/docs/reference/javascript/file-buckets-uploadtosignedurl)
- [Next.js forms and server-side validation](https://nextjs.org/docs/app/guides/forms)
- [Next.js Server Action request-body setting](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [Vercel scheduled functions](https://vercel.com/docs/cron-jobs)

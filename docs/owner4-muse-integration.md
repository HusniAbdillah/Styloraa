# Owner 4 Muse integration

## Provider contract

Owner 4 now uses the same server-side `MODEL_API_KEY` and
`https://api.meta.ai/v1` endpoint as Owner 2. Shared constants are in
`src/lib/ai/muse.ts`; the inspiration adapter consumes those constants too.
The old Llama endpoint and separate META_* configuration were removed.

- Text: `muse-spark-1.3`, Responses API with a strict JSON schema.
- Image: `muse-image-1.0`, Responses API with interleaved owned garment references.
- Requests use `store: false`. Image/web search and shell tools are disabled
  for previews. No arbitrary provider URL is fetched.

Official references: [Meta overview](https://dev.meta.ai/docs/overview),
[Responses](https://dev.meta.ai/docs/api-reference/responses/create-response),
[Muse Image reference inputs and output](https://dev.meta.ai/docs/image-generation).

## Completed paths

Capsule brief, metadata and selection persist through the existing atomic RPC.
Muse receives the saved brief, selected inventory and explicitly saved style,
fit and body preferences. Names and notes are treated as data, not instructions.
Every returned combination is checked against available owned IDs, required
pieces, exclusions and duplicates. Server-signed drafts bind the exact result
to the workspace, capsule, current revision and a short expiry. The database
also checks the revision when saving an AI outfit, preventing a concurrent
edit from being relabelled as the suggestion's source.

Optional missing additions are returned separately with rationale, related
owned IDs and uncertainty. They persist on the capsule, display as unowned,
and never enter owned outfit membership. They may legitimately be empty.
Editing the capsule clears old suggestions; the UI asks users to regenerate
after changing preferences.

The shared preview template now generates, stores and restores actual images
for wardrobe, look and capsule contexts. Look previews preserve `option_id`
and also support saved snapshot IDs. Selected/saved-look entry links connect
the flow. Save as Capsule preserves the user's actual selection, including
replacements from available owned inventory.

Preview generation requires garment photos and explicit processing consent.
Only non-identifying mannequins are supported. Output is an illustrative
visualization; it does not establish garment fit, measurements, texture or
color accuracy. No personal photo uploader was added to the shared app.

Images are stored in the private previews bucket using random workspace paths.
The database stores asset identities, not signed URLs. Reads sign valid assets
for five minutes. Server fingerprints check the current inventory, photos,
profile and composition; a newer selection also invalidates older output.
The latest matching job is restored on reload. Changing client selection
immediately makes the previous image stale in the UI.

Deletion removes the result file, marks its asset deleted and detaches parent
references. The usage ledger remains, so deleting a result cannot bypass the
shared generation limit. Removing an outfit/capsule cleans terminal previews;
active generation blocks the deletion until it ends or expires.

## Request execution and limits

Generation is awaited by a bounded Node route. It is not a durable queue and
does not use un-awaited promises or timers to pretend a worker exists.

- Text provider deadline: 45 seconds; route maxDuration: 60 seconds.
- Image provider deadline: 150 seconds; route maxDuration: 240 seconds.
- A running job older than four minutes is marked failed when read/reserved.
- A lost request is not automatically charged again. Replays reuse the request
  identity; a new generation needs a new request ID.
- Text: one active request, 10/hour and 30/day per workspace.
- Image: one active request, 6/hour and 12/day per workspace.
- References: up to six PNG/JPEG/WebP photos, 10 MB each, 12 MB combined.
- Provider response/output bytes are bounded; images above 10 MB are rejected.

An advisory transaction lock makes reservation, idempotency and limits atomic
across Vercel instances. Failed attempts count toward usage. These are shared
demo limits, not per-user identity or billing controls. Keep Fluid Compute
enabled; see [Vercel duration configuration](https://vercel.com/docs/functions/configuring-functions/duration).

## Actual verification

- Model discovery confirmed access to both Muse Spark 1.3 and Muse Image 1.0.
- Live Muse Spark requests returned verified combinations and missing additions.
  The signed combination was saved as live output and reopened. Identical
  request IDs reused the result. A later valid response had no missing additions;
  the UI correctly allowed that empty state.
- Live Muse Image requests succeeded for a single wardrobe item, full capsule
  outfit, full legacy look, an owned-item replacement and an explicit selected
  outfit option. Results were read from private Storage and job endpoints.
- Replaying an image request returned the same job and image. A newer selection
  made its older result stale; archiving a selected item also invalidated output.
- Result deletion removed its asset identity; outfit deletion cleaned its real
  preview and kept the same number of usage-ledger rows.
- Browser checks passed for a real generated image after reload, desktop/mobile
  navigation, selected-option context, saved snapshot/back navigation and exact
  one-item Save as Capsule persistence. Mobile width 390px had no horizontal
  overflow or page errors.
- Local reset and type generation passed. Eight SQL suites passed 114 assertions,
  including all existing Owner 1–3 contract tests and new reservation/revision
  checks. Application tests passed 80 assertions across 19 files.

`scripts/verify-owner4-muse.mjs` exercises the real providers against a
disposable local database. Run with the local app and an ignored local
environment containing MODEL_API_KEY. It deliberately rejects a hosted database.
It creates labelled synthetic garment-reference inputs for QA; no AI outputs
are mocked. Running it consumes real provider requests and the shared local
quota. `--resume` is for an interrupted run with surviving local fixture state.
Do not use it after resetting that local database.

Screenshots and machine-readable browser results are in
`docs/design/qa/owner4-muse/`. The final local reset removed the disposable
fixture records after capturing evidence. The earlier implementation's
unconfigured-provider checks remain historical evidence, not this delivery's
completion claim. During verification, a valid result was initially marked
stale because nullable optional context fields were re-parsed incorrectly;
that bug was corrected and the live checks passed afterward.

The source checkout's ignored local environment was configured with the shared
Muse credential. Vercel environment metadata confirmed MODEL_API_KEY exists in
production; no encrypted value was printed and no Vercel variable was changed.
Preview deployments are not given production database credentials.

## Migration and rollout

The CLI-created migration `20261031105637_owner4_muse_generation.sql` adds
the reservation RPC, usage indexes, revision/suggestion triggers and support
for detached failed preview ledger rows. It retains server-only execution and
workspace predicates. It must be applied before deploying these API changes.

Two already-deployed migrations have later version numbers (`20261101...`).
Do not rename them or repair their history. Review `db push --include-all
--dry-run` and apply only the new pending file; never include seed/roles or
reset the hosted database. Hosted execution and final verification are recorded below.

This implementation has not been tested as a durable worker, with personal
photos, or against every provider/storage fault. It supports truthful failure
and retry states; success claims above refer to the actual tested paths.

## Hosted rollout record

The user-authorized migration was applied to Styloraaaa
(njjopdhdksycdgjbywrh) from feature commit 4592b7c. Preflight found no
preview jobs, capsules or capsule outfits, and no existing reservation RPC.
The CLI dry run with --include-all listed exactly the new migration; that
one file was applied with --skip-vault and without seeds, roles or reset.
History now contains 14 canonical migrations. Browser roles cannot execute
the new RPC; service_role can, and the function is security invoker.

All eight SQL suites passed 114 assertions on hosted PostgreSQL through the
Management API, inside rollback transactions with a guarded pgTAP finish
result, using the method documented in hosted-release-2026-10-31.md.
No hosted AI images or synthetic garment fixtures were persisted. The security
advisor still reports only the existing 20 INFO RLS-without-policy notices,
consistent with denied direct browser access. See the
[Supabase linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
Hosted database types were regenerated after the migration.

The production application switches to this implementation when its PR is
merged and deployed. Existing production MODEL_API_KEY configuration was
confirmed by metadata only; no Vercel secret was read or changed. Live provider
evidence above comes from the isolated local app using a real Muse credential.

The final code passed pnpm check (80 tests), production build and a browser
chunk scan with zero credential-value matches before hosted type generation.
The follow-up check/build with hosted-generated types is recorded in the PR.

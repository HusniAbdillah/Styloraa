# Shared demo database

This project intentionally has **no login or per-user privacy**. All visitors use
the same server-selected workspace. Use demo data only. The server's configured
workspace ID must never come from a request body, URL, cookie, or query parameter.

The twenty application tables have RLS enabled, no public policies, and all table
privileges revoked from `anon`, `authenticated`, and `PUBLIC`. Only the server's
service role can read/write them. Because that role bypasses RLS, every repository
query must also filter by the configured workspace ID. Composite foreign keys
prevent accidentally linking looks/capsules to another workspace's wardrobe.

`wardrobe`, `inspiration`, and `previews` are private buckets, limited to JPEG,
PNG, WebP and 10 MiB per file.
The server may issue short-lived signed URLs for paths it generates underneath
`<workspace-id>/<random-id>.<extension>`. Store the path, never an expiring URL.
There are no browser Storage policies. Signed URLs are bearer capabilities;
do not put personal files in the shared demo. Server upload APIs also need file
type/size validation and abuse limits before internet exposure.

## Commands

Run through the project's pinned CLI (`pnpm db:*` or `pnpm exec supabase`):

```sh
pnpm exec supabase start
pnpm db:reset
pnpm db:test
pnpm db:types
```

`db reset` clears **local** database data. Use a disposable local stack. For a
hosted project, review migrations and project identity before `supabase db push`.
The fixed workspace is created by the migration so hosted deployment does not
depend on seeds. `seed.sql` is intentionally safe and idempotent.

Database types are CLI-generated from the hosted schema. Set
`SUPABASE_PROJECT_ID` to generate types
from a hosted project; otherwise the script targets local Supabase. The script
captures output as UTF-8 rather than using shell redirection.

## Hosted connection handoff: 31 October 2026

This record supersedes the initial scaffold verification notes above. Project
`Styloraaaa` (`njjopdhdksycdgjbywrh`, region `eu-west-1`) is now linked with CLI
2.122.0. The user authorized hosted application. Five repository migrations were
applied through the CLI: `shared_workspace`, `atomic_save_look`,
`restrict_internal_function`, `private_image_buckets`, and
`full_product_data_contract`.

The ignored `.env.local` has the selected URL, project reference, fixed workspace
and server credentials. CLI temporary database login worked with the access token;
`SUPABASE_DB_PASSWORD` was not required and may remain empty for this workflow.
Never send credential values in chat or commit them. Local shared-demo writes are
enabled after the successful hosted smoke. This does not provide per-user privacy.

The [database contract](../docs/database-contract.md) maps the full PRD at commit
`34c3ca8` to the schema and describes server-only save, capsule and sharing RPCs.
The workspace argument always comes from server configuration. The functions use
`SECURITY INVOKER`; only `service_role` receives execution permission. Schema and
RPC availability do not mean the matching UI/provider integrations are complete.

Verification completed against hosted Supabase, without starting a local stack:

- All 52 pgTAP assertions passed: 10 workspace-security, 12 save-look and 30 full
  product-contract checks. The additive product migration first passed a
  rolled-back preflight with its 30 checks before actual application.
  Tests ran in rolled-back transactions through CLI `db query --linked`; their
  individual TAP outputs were aggregated to verify every assertion, not just the
  final row returned by the query tool.
- The actual server key returned HTTP 200. A synthetic wardrobe item and saved
  look survived separate write/read requests. A cross-workspace selection failed
  without a partial look. All temporary smoke records were deleted.
- All twenty application tables have RLS enabled. Direct client permissions remain
  revoked. The shared demo's privileged server must still enforce workspace scope.
- The internal hosted `rls_auto_enable()` event-trigger function no longer grants
  execution to `PUBLIC`, `anon`, or `authenticated`.
- CLI generated `src/types/database.ts` from the hosted `public` schema. It is no
  longer the handwritten bootstrap contract.
- `wardrobe`, `inspiration`, and `previews` buckets are private, accept JPEG/PNG/WebP
  and limit each object to 10 MiB. Each passed a synthetic upload, signed download
  and denied-public-download smoke. Temporary objects were deleted.

Security advisories report only informational [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
entries for the twenty tables, expected for the explicit deny-all browser-access
design. The product migration adds covering indexes for the previously reported
look/capsule membership foreign keys.

The latest upstream package manifest now supplies application dependencies and
the `db:*` scripts. CLI verification in this handoff used the pinned 2.122.0 binary
directly. No browser flow, deployment or upload endpoint is claimed by these
database/storage checks. Local Docker tests were not run, and the buckets alone
do not implement the upload feature. Existing data was not reset; previous manual
saves with members are backfilled into immutable snapshots.

# Architecture

## Core decisions

One Next.js app and one Supabase project per environment are enough for a
four-developer sprint. The App Router handles server UI, Server Actions, and
Route Handlers. Supabase provides PostgreSQL and private Storage. No extra
ORM is needed: supabase-js plus generated types cover the early queries.

The app has no auth and uses one shared demo workspace. All visitors have
the same app capabilities and share wardrobe/profile/preferences data. Never
treat the workspace ID as an identity or a secret. Use synthetic data; this
setup gives no per-user privacy.

## Structure and data flow

`src/app` composes features and handles routing. `src/features/<feature>`
owns its Zod schema, queries, actions, and UI. `components/ui` holds shared
primitives that are actually used. Do not build layers of empty
repository/service/hook wrappers.

Server Components fetch initial data. Client Components handle forms and
item picking. Server Actions fit UI mutations; Route Handlers fit HTTP
contracts/provider jobs. Both use the same server helpers so validation and
scope never diverge.

Browser → Server Action/Route Handler → Zod validation → Supabase query
with the fixed environment workspace → minimal response. The browser has no
Supabase client or secret. Private queries are irrelevant in this scope, but
the shared cache still needs invalidation after mutations so demo data does
not go stale.

## Database boundaries

Initial tables: wardrobe items, preferences, looks with their items,
capsules with their items, and AI jobs. Every aggregate and relation row is
workspace-scoped. Foreign keys/constraints prevent cross-workspace links; a
predicate on the child row alone is not enough.

RLS is on and direct `anon`/`authenticated` access is denied. The server
uses `SUPABASE_SECRET_KEY`, which bypasses RLS, so every query must include
`STYLORA_WORKSPACE_ID` from the environment. Never trust a workspace from
forms/URLs/bodies. Database tests and server scope tests check different
boundaries.

Save looks/capsules with their relations atomically when multiple writes
are needed. Separate HTTP inserts are not a transaction; use a reviewed SQL
function or a real transaction mechanism, still scoped. Avoid
`SECURITY DEFINER` without a specific need and review.

Generated types follow migrations. Generation blocked by Docker/environment
must be reported, not papered over with claims that types were generated.

## Files and AI

Buckets stay private. Non-sensitive inspiration images and non-identifying
try-on illustration inputs may be accepted through server-mediated upload
paths with size/MIME limits, random paths inside the fixed workspace, and
cleanup. Personal/sensitive photos are out of scope for the shared demo.
The database stores the storage path; signed URLs are minted on demand and
never stored permanently. Do not build arbitrary-URL fetch endpoints; they
open SSRF.

AI runs server-side only, with secret environment config. Muse analyzes
inspiration images; Gemini generates structured outfit/capsule rationale
and optional try-on imagery. Output validation, cost/rate limits, timeouts,
and clear errors are required before a provider goes live on a login-free
public demo. The current AI endpoint is disabled and returns unavailable
until a real bounded adapter is implemented. Sample data must be labeled.

Long jobs need a real executor. A PostgreSQL record stores status; that
record is not a queue that processes itself. Prefer the provider's async
API with polling where it fits. Add a queue/worker after duration and
reliability are proven; do not run background promises after a Vercel
response.

Social Fit shares a reviewed outfit snapshot, not internal look/wardrobe
rows. Use a random unguessable token, revocation, expiry where practical,
and a strict allowlist of public fields. Do not grant anon select on
internal tables just for a shared page. Keep the snapshot query server-side
and bounded to the requested token.

## Sprint tradeoffs

- No auth reduces setup and demo flow; every visitor can change the shared
  dataset as a consequence.
- Server-only Supabase keeps secrets on the server; every endpoint must get
  scope validation right, since RLS does not constrain the secret client.
- One owner for migrations/lockfile reduces integration conflicts. Features
  must not create alternate tables to dodge coordination.
- Server-first reduces state syncing; client components still cover
  interactions that need them.
- The complete PRD feature set is the seven-hour target. Provider-unavailable
  states preserve the user path but must not be presented as live AI/search.
- Tests focus on validation, workspace scope, constraints, and key failures;
  placeholder pages are not feature evidence.

Official references: [Next.js App Router](https://nextjs.org/docs/app),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase API keys](https://supabase.com/docs/guides/api/api-keys),
[Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

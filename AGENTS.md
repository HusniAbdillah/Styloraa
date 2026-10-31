# Stylora working instructions

## Language

English is the project language. Write docs, code comments, UI copy,
commit messages, and review notes in English. Translate leftover
non-English text when you touch a file instead of leaving mixed languages.

## Scope

Read `PRD.md`, `docs/architecture.md`, and `docs/sprint-plan.md`. The target
is a 7-hour demo with 4 developers. The app has no auth: one shared demo
workspace is used by everyone, and all visitors can change the data. Do not
add login, user ownership, or private-data promises without an explicit
scope change.

## Implementation

- Strict TypeScript, Server Components by default, `use client` only for
  browser interaction.
- Keep routes in `src/app` thin. Business code lives in
  `features/<feature>`; create schema/components/actions/queries subfolders
  only when needed.
- All Supabase access lives in server-only modules. Do not create a browser
  Supabase client or send secret keys to the browser.
- `SUPABASE_SECRET_KEY` is highly privileged and bypasses RLS. Every
  query/mutation must be scoped by the server-side `STYLORA_WORKSPACE_ID`
  from the environment, including child relations. Never accept a workspace
  ID from forms/clients.
- Enable RLS on public tables and grant no direct data access to
  `anon`/`authenticated`. RLS does not protect against server query bugs
  that use the secret key; audit the workspace predicate separately.
- Validate input on the server with Zod. Never assume data from a Server
  Action or Route Handler is safe.
- Do not add sensitive uploads to the identity-less demo. Buckets stay
  private; uploads/downloads go through the server later with workspace
  scope, MIME/size limits, and random names. Do not store signed URLs as
  permanent file identities.
- Do not log secrets, personal payloads, or signed URLs. Do not fetch
  arbitrary URLs from clients/providers without source restrictions.
- Database migrations are the source of truth. Create migrations via the
  Supabase CLI; never edit a migration the team already uses. Coordinate
  changes with the database owner.
- Generated database types are not edited by hand. Fix the schema,
  regenerate with `pnpm db:types`, and review the diff. If generation is
  blocked, report that limitation.
- Unconfigured AI must return a clear unavailable response. Never present
  mocks as real provider output.
- A Vercel request is not a durable worker. Do not use timers or un-awaited
  promises for long jobs. Recording `queued` alone does not run a job.
- Use project palette tokens, form labels, focus states, keyboard support,
  and loading/empty/error states. Add shadcn/ui only when it serves a real
  need.
- Do not add an ORM, state manager, queue, or AI SDK without a proven need.
  Do not create empty layers just to complete the structure.

## Parallel work and verification

Follow the file owners in `docs/sprint-plan.md`. One owner for the
lockfile/root CSS/layout/env, one for migrations/generated types. Share the
contract before editing another team's files. Agents only work on the
assigned scope; do not expand the task or add agents without need and
authorization.

Run `pnpm check` (`make check`) and `pnpm build` (`make build`). For the
database, run a local reset, `pnpm db:types`, and `pnpm db:test`. Verify
that other workspace scopes are rejected by the server layer and that
direct anon/authenticated access is rejected by the database. Record actual
results and checks that did not run. Do not present placeholder routes,
builds, or unit tests as end-to-end feature proof.

Do not commit/push/deploy or change the remote database just because local
verification passed. Do not modify memory or copy personal skills/caches
into the repo. See `docs/skills.md` for agent guide selection.

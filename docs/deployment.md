# Vercel and Supabase runbook

The hosted Styloraaaa project is selected and its 13 repository migrations
were applied through 31 October 2026. See
[the hosted release record](hosted-release-2026-10-31.md) for actual checks.
This runbook describes the repeatable deployment process. The login-free app gives every visitor change
access to the shared demo dataset; use synthetic data and do not open
sensitive uploads.

## Supabase

Pick development and production projects explicitly. Use the development
project for previews; never give preview branches access to production data.
Pick a Vercel region close to the Supabase region once the project location
is known.

For local work, install the CLI and start Docker. Check `supabase --help`
plus the subcommand help on the installed version before using commands. Run
`pnpm db:start`, `pnpm db:reset`, `pnpm db:types`, and `pnpm db:test` (or
`make db-start`, `make db-reset`, `make db-types`, `make db-test`). Reset
wipes local data; never use it against a remote database.

Schema comes from migrations. Test locally before applying to a confirmed
remote project. Do not apply migrations from `next build` or from every
preview deploy. Review SQL, compatibility, and recovery before production
changes.

## Environment

`.env.example` is the env name list. Keep `SUPABASE_SECRET_KEY` server-side
only and pin a fixed `STYLORA_WORKSPACE_ID`. The secret key bypasses RLS;
every server query must scope by workspace. Never send secrets via
responses, logs, or `NEXT_PUBLIC_`.

Fill Development, Preview, and Production separately. Never treat
placeholders as valid configuration. Never print environment values while
troubleshooting. Never commit `.env.local` or the `.vercel` directory.

`DEMO_WRITES_ENABLED` defaults to `false`. Keep it off until the schema,
workspace seed, and database connection are verified. Turn it `true`
deliberately for a demo environment that accepts shared changes; it is not
an identity control. A clean checkout is designed to build without a
database, with an empty state for the unconnected wardrobe.

## Vercel

Use Git integration for per-PR previews. Pick this repository, the Next.js
framework, the repository root, install `pnpm install --frozen-lockfile`,
build `pnpm build`; no custom output directory needed.

With the CLI, verify identity and available projects first:

```powershell
vercel --version
vercel whoami
vercel teams ls
vercel projects ls
```

Link only to the correct team/project, then pull the Development
environment:

```powershell
vercel link
vercel env pull .env.local
```

Correct cloud linking and env are required for live verification of cloud
resources. The foundation can still be reviewed via build/tests when
credentials are unavailable. Do not create paid resources or publish the app
just to test the boilerplate folder.

## Release gates

1. `pnpm check` and `pnpm build` pass on the same lockfile.
2. Migrations/seeds applied to the correct target; types match schema.
3. Database tests deny direct anon/authenticated access, and server tests
   prove the fixed workspace scope.
4. Preview smoke: wardrobe CRUD, save/reopen look, two browsers sharing the
   dataset, error states, keyboard/mobile.
5. Browser bundles/responses/logs contain no secrets; the AI provider stays
   disabled until cost and rate limits are enforced.
6. Promote the tested deployment; record URL/commit and check errors after
   release.

An app rollback does not revert database migrations. Use compatible schema
changes and corrective migrations. Do not ship destructive field
deletes/renames in the final demo hour.

Uploads later still use a private bucket and server-mediated APIs with
MIME/size limits, workspace paths, and cleanup. Without auth, a private
bucket does not create privacy between visitors sharing the app API.

Docker availability, local reset/RLS, cloud connectivity, Vercel
region/limits, and real providers must be recorded from actual runs. Never
call them verified just because the code exists.

References: [Vercel Git deployment](https://vercel.com/docs/deployments/git),
[Supabase local development](https://supabase.com/docs/guides/local-development),
[Supabase API keys](https://supabase.com/docs/guides/api/api-keys).

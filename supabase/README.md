# Shared demo database

This project intentionally has **no login or per-user privacy**. All visitors use
the same server-selected workspace. Use demo data only. The server's configured
workspace ID must never come from a request body, URL, cookie, or query parameter.

The eight public tables have RLS enabled, no public policies, and all table
privileges revoked from `anon`, `authenticated`, and `PUBLIC`. Only the server's
service role can read/write them. Because that role bypasses RLS, every repository
query must also filter by the configured workspace ID. Composite foreign keys
prevent accidentally linking looks/capsules to another workspace's wardrobe.

`wardrobe` is a private bucket, limited to JPEG, PNG, WebP and 10 MiB per file.
The server may issue short-lived signed URLs for paths it generates underneath
`<workspace-id>/<random-id>.<extension>`. Store the path, never an expiring URL.
There are no browser Storage policies. Signed URLs are bearer capabilities;
do not put personal files in the shared demo. Server upload APIs also need file
type/size validation and abuse limits before internet exposure.

## Commands

Run through the project's pinned CLI (`npm run db:*` or `npx supabase`):

```sh
npx supabase start
npx supabase db reset
npx supabase test db
npm run db:types
```

`db reset` clears **local** database data. Use a disposable local stack. For a
hosted project, review migrations and project identity before `supabase db push`.
The fixed workspace is created by the migration so hosted deployment does not
depend on seeds. `seed.sql` is intentionally safe and idempotent.

Database types are initially a labeled bootstrap contract. Replace them with CLI
output after a database is available. Set `SUPABASE_PROJECT_ID` to generate types
from a hosted project; otherwise the script targets local Supabase. The script
captures output as UTF-8 rather than using shell redirection.

## Verification status

The initial setup discovered CLI 2.122.0 via npm and generated `config.toml` and
the migration filename with the CLI. Docker initially answered `docker version`,
but starting the local database stalled; subsequent `docker ps` also stalled.
The start attempt was stopped. The migration and pgTAP tests therefore remain
**unexecuted**, and no hosted database was modified. Before integration, run the
commands above and require all ten database assertions to pass. `node --check`
passed for the type-generation script.

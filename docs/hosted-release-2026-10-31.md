# Hosted database release — 31 October 2026

## Target and applied change

Repository baseline: merged main `d9aa782` (PR #8). Target: existing
Styloraaaa project `njjopdhdksycdgjbywrh`, EU West, PostgreSQL 17.
The user explicitly requested the hosted migration. No new cloud resource
was created, and no remote reset, seed, migration-history repair or data
deletion was run.

The preflight found eleven migrations already applied. Only these two were
pending, and both RPC signatures were absent:

- `20261101000000_capsule_outfit_api.sql`
- `20261101000100_capsule_studio_atomic.sql`

Both migrations add server-only functions. They do not change existing
table contents. The committed SQL had already passed local reset and CI
before PR #8 merged. The release used the installed CLI's `db push` with an
explicit project ref and `--skip-vault`, following a matching dry run. No
`--include-all`, `--include-seed` or `--include-roles` was used. CLI credentials
were loaded from the ignored environment and never printed or committed.

After application, migration history contains all thirteen canonical
versions. A second dry run returned `upToDate: true` and no pending migrations.
Database types were regenerated from this hosted project, not edited by hand.
Its PostgREST metadata and JSON typing differ from the local generator;
the regenerated file passed application checks and the production build.

## Verification

| Check                         | Actual result                                                           |
| ----------------------------- | ----------------------------------------------------------------------- |
| Hosted migration history      | PASS: all 13 versions match repository files                            |
| Post-apply dry run            | PASS: no pending migrations or seeds                                    |
| New RPC execution permissions | PASS: service_role only; anon/authenticated denied                      |
| Function security             | PASS: both security invoker, fixed empty search_path                    |
| Public data tables            | PASS: 20 use RLS; no direct anon/authenticated CRUD grants              |
| Storage                       | PASS: all three image buckets remain private with MIME/size limits      |
| Hosted SQL suites             | PASS: 98 assertions in seven suites through Management API              |
| SQL fixture recovery          | PASS: rollback; no test workspace or pgTAP extension persisted          |
| Original workspace            | PASS: 2 wardrobe items, 8 assets, 1 preference row and 6 looks retained |
| `pnpm check`                  | PASS: lint, TypeScript, 76 tests in 18 files                            |
| `pnpm build`                  | PASS with hosted-generated types                                        |
| `git diff --check`            | PASS                                                                    |

The CLI pg_prove runner failed twice before assertions with `plan(integer)
does not exist`, including after explicitly setting the transaction search
path. These runs are not counted as passing hosted tests. The same seven SQL
files were then run through the Supabase Management API, each inside its
existing `BEGIN`/`ROLLBACK`, with `public, extensions` as the local search path.
For verification, the final `select * from finish()` was replaced in memory
with this guard and an explicit success result:

```sql
do $verification$
declare failure text;
begin
  select string_agg(line, E'\n') into failure from finish() as line;
  if failure is not null then
    raise exception 'pgTAP failed: %', failure;
  end if;
end $verification$;
-- Follow with the suite's declared assertion count, then ROLLBACK.
```

Every suite returned success: 7 + 10 + 30 + 13 + 16 + 12 + 10 assertions.
The guard fails on assertion failures or a mismatched test plan. No global
search-path, database role or pgTAP installation was changed. The repository
tests now set their transaction-local search path explicitly.

Other work was writing to separate workspace IDs during verification. Global
row totals therefore changed; they are not presented as an unchanged-data
proof. The original workspace counts matched the baseline, and the test
workspace IDs were absent afterward. Other processes' records were untouched.

Security advisors reported only the existing INFO notice for RLS without
policies on 20 tables. This is deliberate for this server-only shared app:
browser roles have no table access. Do not add permissive policies to remove
that notice. See the [Supabase linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Application and recovery

This release changes the hosted database, not Vercel environment variables
or AI provider configuration. No successful text AI or visual try-on call is
claimed by these SQL tests. Visual try-on remains a separate integration.
The data model still has no authentication and one shared app workspace.

Application rollback does not roll back schema. Leave the additive functions
in place when reverting an app deployment; ship a corrective migration if a
database fix is needed. Do not edit these applied migration files or reset the
hosted database. A destructive future migration needs a separately verified
backup/recovery plan; this function-only release was not a full data backup.

For future releases, one operator should fetch main, check the target ref,
compare history and schema, run a dry run, review the exact pending files,
apply with the CLI, and verify history, permissions, business behavior and
data afterward. See [Supabase's migration workflow](https://supabase.com/docs/guides/deployment/database-migrations).

## VS Code checkout recovery

`D:/Hackathon/Stylora-v2` is now on main at `d9aa782`, matching origin/main,
with a clean Git status. Old implementation/branding changes are retained in
two local stashes, not deleted:

- `4c964fbd06f98251ba513cb39e971445dd993750`: complete staged recovery snapshot.
- `80b6b565b9d6847213b9b91671dbb3cddc7bae84`: initial tracked/untracked snapshot.

Use `git stash list` and inspect a stash before restoring anything. Do not
apply these old snapshots wholesale onto main: the merged implementation is
newer. Restore a specific needed file onto a new branch if necessary.
The generated next-env file was preserved separately before restoring its
committed state. Dependency caches and backup folders were left untouched.
Provider skill copies and skills-lock.json are locally excluded through
`.git/info/exclude`; they were not committed or copied into the delivery branch.

Follow-up types, SQL test portability and this release record live on
`codex/hosted-capsule-migrations`, based on main. Keep main clean and review
that follow-up PR before merging its repository changes.

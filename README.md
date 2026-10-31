# Stylora

Next.js App Router + TypeScript starter for a 7-hour styling demo by
4 developers. UI uses React and Tailwind CSS; Zod validation; React Hook
Form is available for long forms. Data uses Supabase PostgreSQL, hosted on
Vercel.

In the current scope, the app has **no login** and uses one shared demo
workspace. All visitors can change the same data. Use synthetic data only;
no photos or personal information. This is not a private per-user wardrobe.

## Run it

Prerequisites: Node.js 22 LTS and pnpm (via `corepack enable`, or install
pnpm 9+/10 separately). Both plain `pnpm` commands and `make` shortcuts
work; every `make` target is a thin wrapper over the matching pnpm script.

```powershell
pnpm install
Copy-Item .env.example .env.local
```

or:

```powershell
make install
make env
```

Fill in the environment per `.env.example`. `SUPABASE_SECRET_KEY` is
server-only; `STYLORA_WORKSPACE_ID` pins the fixed server workspace. Never
prefix secrets with `NEXT_PUBLIC_`. No cloud project is selected or
deployed by this setup.

`DEMO_WRITES_ENABLED=false` is the default: demo forms and mutations accept
no writes. Flip it to `true` only after the database is migrated, the
workspace seed exists, and the team is ready to share one dataset. This
setting is not authentication; when on, every visitor can perform the
available mutations.

A clean checkout is designed to build with no database connection or
credentials. Wardrobe renders an empty state explaining the database is not
connected; no fake data is shown as stored data.

## Implementation status

This is a **partial scaffold, not a complete MVP**. Shell, UI tokens, route
boundaries, server env validation, the wardrobe repository/action pattern,
the metadata add form, and the AI-unavailable endpoint are the foundation.
A Supabase connection is required to try wardrobe persistence. Wardrobe
edit/delete, look composing and saving, preferences, capsules, sharing,
uploads, and a real AI provider still need implementation or integration.
The sprint plan below describes next targets, not finished features.

With local Supabase, start Docker first:

```powershell
make db-start
make db-reset
make db-types
make db-test
```

or with pnpm directly:

```powershell
pnpm db:start
pnpm db:reset
pnpm db:types
pnpm db:test
```

Reset is for disposable local databases only. Follow the
[deployment runbook](docs/deployment.md) for cloud linking and environment
before running the app against cloud resources.

```powershell
make dev
```

Open `http://localhost:3000`.

## Checks

```powershell
make check
make build
```

Individual scripts: `lint`, `typecheck`, `test`, plus `db:test` for
database policy. A passing build does not prove cloud connections, uploads,
or product flows passed end-to-end. Actual check results go in the handoff.

## Makefile targets

| Target       | Runs                 | Purpose                              |
| ------------ | -------------------- | ------------------------------------ |
| `make env`   | —                    | Create `.env.local` from the example |
| `make dev`   | `pnpm dev`           | Dev server                           |
| `make build` | `pnpm build`         | Production build                     |
| `make start` | `pnpm start`         | Serve the production build           |
| `make check` | `pnpm check`         | Lint + typecheck + tests             |
| `make test`  | `pnpm test`          | Unit tests                           |
| `make db-*`  | `pnpm db:*`          | Local Supabase lifecycle and DB tests |
| `make clean` | —                    | Remove build output and cache        |

Run `make help` for the full list with descriptions.

## Structure

```text
src/app/             thin routes/layouts and HTTP handlers
src/features/        schema, UI, queries, and actions per feature
src/components/ui/   shared primitives
src/lib/supabase/    server-only Supabase access
src/lib/env.ts       environment validation
src/types/           database contracts
supabase/            config, migrations, seed, policy tests
docs/                architecture, sprint, deployment, skills
Makefile             pnpm workflow shortcuts
```

Routes exist as foundation: `/create`, `/looks/[lookId]`, `/wardrobe`,
`/capsules`, `/saved-looks`, `/preferences`, `/profile`,
`/shared/[shareToken]`. Routes are not proof of complete features. Profile
implies no account identity; sharing and real AI are later work.

## Team docs

- [Product requirements and scope](PRD.md)
- [Arsitektur](docs/architecture.md)
- [Pembagian 4 developer dan jadwal 7 jam](docs/sprint-plan.md)
- [PRD and scope](PRD.md)
- [Architecture](docs/architecture.md)
- [4-developer split and 7-hour schedule](docs/sprint-plan.md)
- [Deployment](docs/deployment.md)
- [Agent instructions](AGENTS.md) and [skills](docs/skills.md)

## Visual tokens

| Token          | Hex       | Role                     |
| -------------- | --------- | ------------------------ |
| Porcelain      | `#F5F2EC` | Main background          |
| Paper          | `#FFFEFC` | Cards and panels         |
| Near-black     | `#211F20` | Text and navigation      |
| Oxblood        | `#642E3B` | CTA and selected state   |
| Deep wine      | `#48212B` | CTA hover/active         |
| Muted mauve    | `#A18483` | Small accents, not body text |
| Stone          | `#DCD6CE` | Borders/dividers         |
| Secondary text | `#706A66` | Supporting text          |

Use the CSS tokens; check contrast when adding combinations/opacity.
Selected and error states need a cue besides color.

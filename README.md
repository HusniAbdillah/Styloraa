# Stylora

Stylora turns a saved outfit image into a wardrobe-aware look: identify its pieces, match them to items already owned, compare three explained outfit combinations, and find considered options for anything missing.

This is a responsive web app for desktop and mobile, built with Next.js App Router, TypeScript, Supabase, Muse image analysis, Gemini generation, and a SERP shopping provider. The full product scope is planned for a seven-hour hackathon with four owners; see [PRD.md](PRD.md) and [TASK.md](TASK.md).

## Product flow

1. Upload or choose a labeled demo inspiration.
2. Review and correct AI-detected clothing pieces.
3. Match each piece to an owned item, wardrobe alternative, or missing item.
4. Compare three outfit combinations with a “Why this?” explanation for each.
5. Compare shopping results for missing items, then save, share, preview, or add the look to a capsule.

Style DNA and fit/body preferences are optional, editable inputs. Recommendations explain which preferences were used. Capsule Studio favors useful combinations from the existing wardrobe. Social Fit shares only a reviewed outfit snapshot. Try-on supports single pieces and combinations.

## Current implementation status

The repository is a partial scaffold, not a completed product. The landing route currently redirects to `/create`; the wardrobe supports adding and listing metadata only; the AI jobs endpoint returns `AI_NOT_CONFIGURED`; other product routes are placeholders. See [PROGRESS.md](PROGRESS.md) for inspected implementation status and actual verification notes.

The shared demo has no authentication. All visitors can modify the same synthetic workspace, and preferences/profile data are shared. Do not use real personal wardrobe data or personal photos in this demo. Outfit inspiration and try-on must use non-sensitive images and a non-identifying model/illustration path.

## Requirements and team docs

- [Product requirements](PRD.md)
- [Agent guide](AGENT.md) and [repository instructions](AGENTS.md)
- [Engineering and product rules](RULES.md)
- [Four-owner task assignments and 7-hour plan](TASK.md)
- [Progress and verification log](PROGRESS.md)
- [Architecture](docs/architecture.md)
- [Deployment runbook](docs/deployment.md)
- [Skills guidance](docs/skills.md)

## Run locally

Prerequisites: Node.js 22 and pnpm 9 or newer. Enable Corepack if needed.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Fill environment values only when using the corresponding service. Secrets stay server-side. `DEMO_WRITES_ENABLED=false` prevents shared demo mutations until the database and seed are ready. The app is designed to build without credentials and must show unavailable/empty states instead of pretending to return live provider results.

With Docker running, use local Supabase:

```powershell
make db-start
make db-reset
make db-types
make db-test
```

Start the app with `make dev` and open `http://localhost:3000`.

## Checks

```powershell
make check
make build
```

`make check` runs lint, type generation/typecheck, and unit tests. Database tests and builds do not establish that external AI, marketplace, upload, sharing, or try-on flows work end to end. Record only checks that actually ran in `PROGRESS.md`.

## Repository layout

```text
src/app/             routes, layouts, and HTTP handlers
src/features/        feature schemas, server data access, actions, and UI
src/components/ui/   shared interface primitives
src/lib/              environment and server-only Supabase helpers
src/types/            generated database contracts
supabase/             migrations, seed data, and policy tests
docs/                 architecture, sprint, deployment, and skills guidance
```

Use the project palette and accessible focus, validation, loading, empty, and error states. Keep route modules thin and business logic inside the owning feature.

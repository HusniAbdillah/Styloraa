# Owner 4 verification, 31 October 2026

Baseline: merged main `cee20b5`. Work was isolated from the shared checkout
after the user confirmed another dependency installation was active there.

| Check | Actual result |
| --- | --- |
| `pnpm check` | PASS: ESLint, TypeScript, 37 tests in 11 files |
| `pnpm build` | PASS: all eight requested UI routes and their APIs compile |
| Local database reset | PASS: all migrations, including atomic capsule save, applied |
| `pnpm db:types` | PASS: generated from the migrated local database; no hand-edited types |
| `pnpm db:test` | PASS: 82 assertions across six SQL test files |
| `node --env-file=.env.local scripts/verify-owner4.mjs` | PASS: actual browser-facing HTTP APIs and local PostgreSQL |
| Browser | PASS: eight routes, real selected-item save/reload, desktop rail, mobile drawer/Escape/focus, 390/360px geometry |
| Mobile refinement | PASS: native composition disclosure, no horizontal overflow at both widths |
| `git diff --check` | PASS |

The API walkthrough persisted a complete brief, timeframe/season/occasion,
and exact owned-item IDs. It verified updates, atomic rollback on referenced
piece removal, stale revision rejection, saved-look creation, forged AI
provenance rejection, foreign-workspace rejection, archived-piece rejection,
and all three preview contexts. Unconfigured preview requests returned 503
and created no queued jobs.

The browser selected a single owned piece from a two-piece look, used Save as
Capsule, submitted the real form, reloaded, and checked the persisted item ID
and brief through the API. Screenshot evidence and machine-readable browser
results are in `docs/design/qa/owner4/`. Data shown in those screenshots is
explicitly local verification inventory, not live AI or a customer wardrobe.

The first test pass exposed invalid empty-list validation for saved-look
creation, test-only server module guards, and malformed JSON classification.
Those were fixed before the final passing run. Browser checks also found
that a first click could arrive before hydration. Interactive controls now
remain disabled until their client handlers are ready.

The global Supabase executable was an unextracted archive. The installed
Windows CLI also needed direct shell execution rather than its Node launcher.
Project CLI scripts now resolve the installed binary. Docker's initial
registry request was rate-limited; the local run used the GHCR registry mirror.
The temporary local container project ID was restored before delivery.

No hosted migration, deployment, live text-model request or real visual
try-on request was performed. The visual provider is a separate integration;
its executor and successful result flow cannot be claimed as end-to-end
verified while it is unconfigured. No sample/manual result is presented as
live provider output.

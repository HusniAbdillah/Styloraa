# Owner 4 verification, 31 October 2026

Baseline: merged main `3905a6e`, including Owner 3's selection contract,
responsive product/saved-look flows and PWA shell.
Work was isolated from the shared checkout
after the user confirmed another dependency installation was active there.

| Check | Actual result |
| --- | --- |
| `pnpm check` | PASS: ESLint, TypeScript, 76 tests in 18 files |
| `pnpm build` | PASS: all eight requested UI routes and their APIs compile |
| Local database reset | PASS: all migrations, including atomic capsule save, applied |
| `pnpm db:types` | PASS: generated from the migrated local database; no hand-edited types |
| `pnpm db:test` | PASS: 98 assertions across seven SQL test files |
| `node --env-file=.env.local scripts/verify-owner4.mjs` | PASS: actual browser-facing HTTP APIs and local PostgreSQL |
| Browser | PASS: eight routes, real selected-item save/reload, desktop rail, mobile drawer/Escape/focus, 390/360px geometry |
| Mobile refinement | PASS: native composition disclosure, no horizontal overflow at both widths |
| `git diff origin/main --check` | PASS: Owner 4 changes; existing main migrations were retained byte-for-byte |

The API walkthrough persisted a complete brief, timeframe/season/occasion,
and exact owned-item IDs. It verified updates, atomic rollback on referenced
piece removal, stale revision rejection, saved-look creation, forged AI
provenance rejection, foreign-workspace rejection, archived-piece rejection,
and all three preview contexts. Unconfigured preview requests returned 503
and created no queued jobs.

After integrating Owner 3, the actual HTTP walkthrough also verified that
preview follows the selected option's wardrobe IDs rather than legacy look
membership. Missing pieces and sample sources were rejected; stale selected
options returned a conflict. The preview page presents a review state for
expected invalid or stale selections.

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

## Follow-up local audit and main integration

Audited all modified/untracked paths in the original checkout against the
PR and preserved new branding assets, license, tagline, and test refinements.
See docs/owner4-local-audit.md for the file-by-file disposition. The original
checkout was left unchanged; its local changes do not disappear when this
worktree commits. No new migrations or schema changes were needed.

After merging main 3905a6e, the production build and real local API walkthrough
passed again. Desktop/mobile browser checks passed for Capsules, selected look,
saved looks, drawer interaction and all linked brand/PWA assets, with no
horizontal overflow or page errors. Database results above remain from the
unchanged merged schema; database tests were not repeated for this UI merge.

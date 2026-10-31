# Boilerplate verification — 31 October 2026

Scope: no-auth, shared-demo starter. These checks verify the foundation, not
the complete product backlog in `PRD.md`.

| Check                                                             | Result                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm check`                                                      | Passed: ESLint, Next route type generation, TypeScript, 8 unit tests |
| `pnpm build`                                                      | Passed with default Turbopack; no database credentials required      |
| `pnpm install --lockfile-only --frozen-lockfile --ignore-scripts` | Passed with pnpm 10.26.2                                             |
| Production HTTP smoke                                             | 13 expected responses passed on localhost                            |
| Migration / pgTAP                                                 | Not run: Docker daemon timed out                                     |
| Generated database types                                          | Pending; current file is explicitly a bootstrap contract             |
| Hosted database / Vercel deployment                               | Not linked or deployed                                               |

HTTP smoke covered the root redirect, workspace scaffold routes, wardrobe
empty state with disabled writes, sharing returning 404, health returning
200, invalid job IDs returning 400, and unavailable AI/database job reads
returning 503. It did not verify browser interaction, live persistence,
uploads, or a real AI provider.

An incomplete Windows SWC binary was repaired during setup. The complete
native binding loaded successfully and the default production build passed;
no permanent Webpack workaround was added.

Dependencies were initially installed during npm bootstrap. The project was
then migrated to the requested pnpm workflow and its frozen lockfile was
validated. A clean pnpm dependency reinstall was not repeated locally; CI
uses `pnpm install --frozen-lockfile` with the pinned package manager.

## Database integration gate

Recover Docker, then run `pnpm db:start`, `pnpm db:reset`, `pnpm db:types`,
and `pnpm db:test`. Review the generated type diff and require all 10 pgTAP
assertions to pass. A database reset deletes local data; use a disposable
local stack. No hosted database was changed during this setup.

Set server environment variables using `.env.example`. Enable
`DEMO_WRITES_ENABLED=true` only after the schema is ready, then test
wardrobe add/reload against that database. Everyone shares this demo dataset;
it has no user identity or per-user privacy.

Create/save/reopen looks, update/delete wardrobe items, uploads, sharing,
capsule forms and real AI integration remain feature work. Follow the
owners and milestones in `docs/sprint-plan.md`.

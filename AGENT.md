# Stylora agent guide

This file describes how coding agents collaborate on Stylora. `AGENTS.md` remains the repository's automatically discovered engineering instruction file; follow both.

## Read before changing code

1. `PRD.md` for product behavior and complete seven-hour scope.
2. `RULES.md` for product, data, AI, and UX constraints.
3. `TASK.md` for the four owner boundaries and shared contracts.
4. `PROGRESS.md` for implementation state and checks actually run.
5. `docs/architecture.md` and `docs/sprint-plan.md` for system shape and integration cadence.

## Working agreement

- Write project artifacts, UI copy, code comments, commits, and handoffs in English.
- Work only within the assigned owner area. If a shared schema or file must change, agree the contract with its owner first.
- Keep Server Components as the default, routes thin, and Supabase/provider access server-only.
- Make provider state truthful. Clearly distinguish live output from labeled sample content and unavailable providers.
- Implement the full feature set in `PRD.md` in the seven-hour schedule. Parallelize by owner; do not redefine the work as an MVP or silently drop a feature.
- Do not add authentication, personal-data ownership, sensitive photo uploads, paid cloud resources, or remote database changes without an explicit scope decision.
- Do not commit, push, deploy, or change remote data unless the user explicitly requests that operation.

## Agent task brief

Every delegated task must specify:

```text
Goal: concrete result tied to PRD acceptance criteria.
Owner: one of the four owners in TASK.md.
Edit areas: files/folders this task may change.
Contract: agreed schema, payload, provider, and environment assumptions.
Dependencies: owner handoffs needed and their due checkpoints.
Limits: shared files and remote operations outside scope.
Verification: checks and user-visible flow evidence to gather.
Handoff: changed behavior, actual check results, limitations, and next owner.
```

Agents do not edit migrations/generated database types outside Owner 1's coordination. They do not expand scope or create additional agents without explicit authorization.

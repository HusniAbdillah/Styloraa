# 7-hour sprint, 4 developers

Goal: one stable wardrobe → create → save → reopen flow. 28 nominal
person-hours total, including integration, review, and setup. The app has no
login and uses one shared demo dataset.

## File owners

| Developer               | Responsibility                             | Owned areas                                          | Starting contract                |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------- | -------------------------------- |
| 1 — integrator          | Foundation, env, server client, shell, release | `lib/`, root layout/CSS, package/lockfile, CI      | Workspace scope, errors, UI tokens |
| 2 — data/wardrobe       | Schema, RLS, storage, wardrobe             | `supabase/`, generated types, wardrobe feature/route | Field names and scope query pattern |
| 3 — looks               | Item picking, save, detail, saved looks    | outfits/matching, create/look/saved routes           | Save payload and item relations  |
| 4 — preferences/capsule | Forms, empty/error states, QA              | preferences/capsules and agreed support modules      | Form validation and schema needs |

Developer 2 is the only owner of migrations and generated types. Developer 1
is the only owner of dependencies/lockfile and shared layout. Developer 4
helps with P0 QA before moving on to capsules. Agents may help with
subtasks that have explicit edit areas; developers still review results and
integration.

## Schedule

| Time        | Goal                                                      | Integration                                  |
| ----------- | --------------------------------------------------------- | -------------------------------------------- |
| 00:00–00:30 | Install, demo env, agreed schema/payloads                 | Freeze P0 fields and save contract           |
| 00:30–01:00 | Shell, server scope, migration, early forms               | Integrate the first foundation               |
| 01:00–02:00 | Wardrobe CRUD, item picking, simple preferences           | One item persisted after reload              |
| 02:00–03:00 | Save look, detail, saved looks, constraint tests          | First full P0 flow demo                      |
| 03:00–04:00 | Error/loading states, responsive, persistence fixes       | Shared preview and scope tests               |
| 04:00–05:00 | Close P0 gaps; minimum capsule if stable                  | Pick P1 items that are still realistic       |
| 05:00–06:00 | Final integration, focused tests, build, smoke            | Everything merged before hour 6              |
| 06:00–07:00 | Feature freeze, blocker fixes, demo/handoff               | No new dependencies/schemas except blockers  |

If saving and reopening a look is still impossible at hour 3, stop P1/P2. If
the provider has no validated output at hour 5, leave it unavailable and
demo the manual flow. The last hour is for stabilization, not for adding
queues or auth.

## Collaboration

Integrate small changes regularly. Before editing someone else's files,
share the contract need. Every PR states behavior changes, checks, and
remaining limits. Do not wait for all branches to finish before testing
integration.

Agent tasks must include a concrete goal, edit areas, input/output
contracts, remote-operation limits, checks, and handoff. An agent that hits
a schema mismatch coordinates with the database owner instead of creating a
second table.

## Smoke flow

1. Add an item with a valid payload, reload, confirm it persists.
2. Try empty/invalid payloads; the server rejects them with understandable
   errors.
3. Pick items, save a look, open detail and saved looks after reload.
4. Try foreign IDs/workspaces in requests; the server must not read/write
   outside the fixed workspace.
5. Test look/capsule relations with other-workspace items; constraints reject.
6. Direct Data API calls with anon/authenticated cannot read/write internal
   tables.
7. Try two browsers; both see the shared dataset per the demo scope.
8. Test AI unavailable, job not found, network errors, and mobile/keyboard
   views.

Record actual results with environment and commit. This list is not a claim
that the checks were run.

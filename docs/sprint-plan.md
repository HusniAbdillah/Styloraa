# Seven-hour sprint plan

The complete product in `../PRD.md` is in scope. The named owners, shared contracts, and detailed schedule live in [`../TASK.md`](../TASK.md). This document records the integration rhythm and demo verification checklist; it does not reduce the feature scope.

## Team and ownership

| Owner | Workstream | Coordination responsibility |
| --- | --- | --- |
| Owner 1 | Wardrobe CRUD, Style DNA/preferences, profile | Sole owner for database migrations and generated database types; publish profile and wardrobe contracts by 00:30. |
| Owner 2 | Landing, inspiration upload/analysis, garment breakdown, matching, three explained outfit options | Publish detected-piece and outfit option contracts by 00:30; coordinate use of Owner 1 profile/wardrobe types. |
| Owner 3 | Product comparison, SERP marketplace search, Value Score, selected/saved look, Social Fit | Publish selected-look, product, and public snapshot contracts by 00:30; coordinate with preview consumer. |
| Owner 4 | Capsule Studio and all previews (single item and combination try-on) | Publish capsule and preview input/status contracts by 00:30; consume shared wardrobe/profile/look contracts. |

Do not assign database ownership to multiple people. Other owners send schema proposals to Owner 1; Owner 1 reviews and applies migrations/regenerates types. Shared layouts, environment, dependency files, and contracts are agreed before parallel edits.

## Schedule and integration gates

| Time | Work and integration gate |
| --- | --- |
| 00:00–00:30 | Confirm provider/environment availability, demo data, server workspace boundaries, schemas, action/API contracts, and feature owner file boundaries. Publish the contracts listed above. |
| 00:30–02:00 | Build each workstream's vertical foundation in parallel: CRUD/profile persistence; landing/upload/analyze; compare/save/share; capsule/preview. Integrate route/navigation and display states early. |
| 02:00–04:00 | Connect inspiration analysis → wardrobe matching → three recommendations; connect selected look → shopping/save/share/preview; connect profile/preferences → all relevant recommendations; persist capsule and saved look. |
| 04:00–05:30 | Exercise configured Muse/Gemini/SERP/image providers. Finish correction/edit flows, value controls, public snapshot/revocation, capsule rationale, item replacement, and provider error/unavailable flows. |
| 05:30–06:00 | Integration lock. Resolve cross-feature, workspace-scope, and persistence failures. Any new shared schema/dependency requires team agreement and Owner 1 review. |
| 06:00–07:00 | Feature freeze. Run agreed checks and full smoke walk-through; verify desktop/mobile/keyboard states; prepare demo reset steps and record live/unavailable/sample provider status. |

All features stay in the schedule. When a provider cannot be used, show an honest unavailable state and a clearly labeled sample/manual path so the feature remains demonstrable without claiming live integration.

## Smoke flow

1. Open the landing page at mobile and desktop widths; navigate to upload and a labeled demo example.
2. Add, edit, and delete wardrobe metadata; reload and confirm persistence. Confirm the shared-workspace disclosure is visible.
3. Save/update optional Style DNA and fit/body preferences; skip/clear them; confirm recommendations disclose which selected values were applied.
4. Upload a supported non-sensitive outfit reference; reject invalid/oversized input; review and correct detected pieces.
5. Match each piece to an owned item, alternative, or missing state; inspect the explanation and confidence.
6. Compare all three generated outfit options and their “Why this?” reasoning; replace a piece and save/reopen the chosen outfit.
7. Search for missing items; verify product links, returned fields, retrieval time, Value Score inputs, and no fabricated result behavior.
8. Build a capsule from wardrobe items; inspect combinations, missing-item rationale, and reuse logic.
9. Run single-item and combo preview paths, replace an item, and verify consent/status/failure/retry/deletion states with a non-identifying model input.
10. Create a Social Fit catchphrase/snapshot link, open its public view, revoke it, and confirm no private profile/wardrobe fields are exposed.
11. Try provider unavailable, malformed output, timeout, invalid IDs, cross-workspace IDs, and database-unconfigured paths.
12. Verify direct anon/authenticated Data API access is denied and all server queries retain the fixed workspace scope.

Record actual environment, commit, commands, results, and limitations in `../PROGRESS.md`. This checklist is not evidence that checks have run.

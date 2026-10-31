# Stylora task assignments

All four workstreams are required for the same seven-hour hackathon delivery. Each owner ships a usable feature surface, integrates against shared contracts early, and reports actual verification. The product scope is defined in `PRD.md`; this file is the source of truth for task ownership.

## Owners

| Owner | Accountable scope | Primary areas |
| --- | --- | --- |
| **Owner 1 — Wardrobe and profile** | Wardrobe CRUD; Style DNA and preferences (skin depth/tone, undertone, body shape, fit/coverage); profile page and persistence. Coordinate the single database migration/generated-type stream. | `src/features/wardrobe/`, `src/features/preferences/`, `src/app/(workspace)/wardrobe/`, `/preferences/`, `/profile/`, `supabase/`, `src/types/database.ts` |
| **Owner 2 — Inspiration and styling** | Homepage/landing; inspiration upload; Muse image analysis and garment breakdown; review/edit detections; matching to wardrobe; three outfit recommendations with fashion-grounded “Why this?” explanations. | `src/app/page.tsx`, `src/app/(workspace)/create/`, `src/features/inspiration/`, `src/features/matching/`, `src/features/outfits/`, AI analysis/generation integration |
| **Owner 3 — Compare, shop, save, share** | Shopping comparison and SERP marketplace search; transparent Value Score; selected outfit state; save/reopen outfit; Social Fit snapshot, catchphrase, revocable share link/page. | `src/features/products/`, `src/features/decisions/`, `src/features/sharing/`, saved-look and shared routes |
| **Owner 4 — Capsule Studio and previews** | Capsule builder; wardrobe-based combinations and missing-item suggestions; every preview experience, including single-item and full-combination try-on; generated preview states and item replacement. | `src/features/capsules/`, `src/features/preview/`, capsule route, preview/generation integration |

Owner 1 is the sole migration and generated database type owner. Other owners send schema needs as short proposals (fields, constraints, access pattern, consuming flow) before implementation. No parallel migrations or hand-edited generated types.

## Shared contracts

- **Wardrobe/profile → all recommendations:** Owner 1 publishes the item and preference types by 00:30. Keep user-entered values distinct from AI inferences. For each recommendation, expose which optional profile fields were actually used.
- **Inspiration → match/generate:** Owner 2 publishes the structured detected-piece and outfit-option shapes by 00:30. Use stable item IDs; never invent wardrobe IDs. Detection remains editable.
- **Selected look → compare/save/share/preview:** Owner 3 publishes the selected-look contract by 00:30. Owner 4 consumes it for previews/capsules; Owner 2 consumes it for replacement/regeneration.
- **Marketplace result:** Owner 3 publishes normalized provider fields and Value Score inputs by 01:00. Keep source attribution, returned values, and retrieval time.
- **Provider status:** Every integration returns an explicit success/unavailable/error state. Seed/sample data must be labeled and must never masquerade as live provider output.
- **Shared demo scope:** Preferences, wardrobe, and profile are shared across visitors because there is no authentication. Do not imply per-person privacy. Use synthetic data and non-identifying try-on models.

## Seven-hour delivery schedule

| Time | Expected outcome |
| --- | --- |
| **00:00–00:30** | All owners agree data shapes, route/action contracts, provider availability, workspace boundaries, and integration cadence. Owner 1 publishes wardrobe/profile schema; Owner 2 publishes detection/outfit shapes; Owner 3 publishes selected-look/product/share shapes; Owner 4 publishes capsule/preview inputs. |
| **00:30–02:00** | Parallel feature foundations: wardrobe/profile persistence; responsive landing and inspiration review; shopping/selected-look/share interfaces; Capsule Studio and preview interfaces. Merge thin vertical paths continuously. |
| **02:00–04:00** | Connect garment detection → wardrobe matching → three explained outfits; connect selected outfit → save/compare/share/preview; wire profile fields into every recommendation; persist capsules and saved looks. |
| **04:00–05:30** | Exercise live Muse/Gemini/SERP/image providers when configured; finish user correction, Value Score controls, share revoke, capsule rationale, try-on variants, and truthful failure paths. |
| **05:30–06:00** | Integration lock: no new schema or dependencies without Owner 1 and team agreement. Resolve cross-feature and data-scope failures. |
| **06:00–07:00** | Feature freeze; run checks and the complete smoke flow; verify desktop/mobile and accessibility states; prepare reset steps and an honest walkthrough of all features/provider states. |

The schedule includes every feature in `PRD.md`. If an external service is unavailable, complete and demonstrate the feature path with an explicit unavailable state plus clearly labeled sample content; do not claim a live provider succeeded.

## Integration rules

- Keep changes small and integrate at least at the 02:00, 04:00, and 05:30 checkpoints.
- Each owner may edit owned feature areas. Shared layout, environment, package files, migrations, and generated types require coordination before edits.
- Do not create alternate tables, duplicate feature implementations, empty service layers, or hidden cross-owner dependencies.
- Each owner reports changes, open integration needs, actual checks, and remaining limitations at handoff.
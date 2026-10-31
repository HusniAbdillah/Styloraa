# Owner 4: Capsule Studio and previews

The implementation follows the active desktop/mobile Figma revision. Garment
images and saved cards come from persisted wardrobe/capsule records. Missing
photos have a labeled absence state. No fixture arrays, illustrated try-on
results, fabricated progress, or manual algorithm advertised as AI are used.

## Routes

| Route | Behavior |
| --- | --- |
| `/capsules` | Real saved capsules and an inline builder with owned-piece selection |
| `/capsules/:capsuleId` | Persisted brief, exact selected inventory and combination entry |
| `/capsules/:capsuleId/edit` | Edit the complete brief and inventory with revision conflict handling |
| `/capsules/:capsuleId/outfits` | Verified AI suggestions, required/excluded pieces, saved combinations and user-arranged outfits |
| `/capsules/:capsuleId/outfits/:outfitId` | Owned composition, rationale, provenance and uncertainty |
| `/capsules/:capsuleId/outfits/:outfitId/preview` | Shared preview template in capsule context |
| `/looks/:lookId/preview` | Same template, including Save as Capsule with the user's current selection |
| `/wardrobe/:itemId/preview` | Same template for a single owned piece |

The shared shell provides the Porcelain canvas, current project brand asset,
Instrument Serif headings, Inter labels, collapsible desktop navigation and a focus-managed mobile
drawer. Other feature screens are not redesigned by this work.

## Server contract

- Supabase remains server-only and scoped to the configured workspace.
- `save_capsule_studio` saves metadata, brief and membership atomically.
  Updates use an expected revision; removal of a piece referenced by a saved
  combination rolls back the entire edit.
- A saved-look source never silently discards suggested/unavailable pieces.
  The builder preserves explicit selected IDs rather than copying a fixed
  default outfit. The query string is checked against current owned inventory.
- AI output must use known capsule IDs, include all required pieces, exclude
  prohibited pieces, and avoid duplicates. Invalid/duplicate combinations are
  dropped or rejected. No deterministic fake AI fallback is exposed.
- A short-lived, workspace/capsule-bound signature protects AI provenance.
  Edited or unsigned browser payloads cannot be persisted as live AI output.
- Text generation uses the existing Meta adapter. Missing configuration gives
  a real unavailable response. User-arranged combinations remain manual.
- All three preview POST routes validate route identity, consent, selection,
  availability and ownership before reaching the visual-provider boundary.
  With no visual provider, they return `VISUAL_PROVIDER_NOT_CONFIGURED` and
  create no queued job. A record alone is not an executor.
- The common template supports real job polling with backoff and a time
  bound, terminal/error states, stale-selection handling and result deletion.
  Results are signed URLs for workspace-scoped private preview assets; no
  arbitrary provider URL is fetched or rendered as a trusted result.

## Integration

Owner 3 can use `SaveAsCapsule` with a real look ID and the current selected
owned-item IDs. Wardrobe/selected-look entry links should point to the preview
routes above. Look previews read Owner 3's selected-option contract, map actual
wardrobe IDs, and reject stale, suggested, missing or sample compositions.
Legacy owned looks and saved snapshot IDs remain supported.
A visual-provider integration must supply a real executor and
persist live jobs/results before enabling generation; the current endpoints
deliberately do not fabricate this work.

Local verification uses a disposable Docker Supabase stack and an isolated
worktree because another process is modifying dependencies in the shared
checkout. Hosted Supabase data is not migrated or mutated by these checks.
Actual verification results are recorded separately after the checks finish.

# capsules

Owner: Developer 4. The responsive Capsule Studio and server API are implemented.
See `docs/owner4-implementation.md` and `docs/api-capsule-preview.md`.

- `schema.ts`: brief, create/update validation, combination request, raw AI
  combination shape.
- `repository.ts`: server-only; workspace always comes from the environment.
  Create/update use `save_capsule_studio` to persist metadata, brief and exact
  membership atomically. Stale revisions and referenced-piece removal return 409.
- `src/features/outfits/`: capsule outfits, owned-look copy, combination
  generator with ownership verification.
- `src/features/preview/`: composition builders plus preview job create/read.
- `src/lib/ai/meta.ts`: Meta Llama-compatible text client (server-only).
- `components/`: owned-piece selector, brief, existing capsules, overview and
  combinations. Manual combinations use the user's own choices; AI has no
  synthetic fallback. Photos come only from persisted private wardrobe assets.

Never accept a workspace ID from the browser. Never import repositories or
secrets into Client Components.

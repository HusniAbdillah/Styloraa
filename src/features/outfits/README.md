# outfits

Owner: Developer 3, shared with Developer 4 for capsule combinations.
See `docs/owner4-implementation.md` and `docs/api-capsule-preview.md`.

- `schema.ts`: create validation (`item_ids` or `from_saved_look_id`).
- `repository.ts`: server-only capsule-scoped reads, atomic create through
  `create_capsule_outfit`, owned-look copy from `saved_look_snapshots`
  (owned + available items only).
- `generator.ts`: Meta text generation without a synthetic fallback.
  Every AI combination is ownership-verified before it leaves the server:
  IDs must be capsule members, required pieces included, exclusions obeyed.
- `combination-token.ts`: short-lived provenance verification before an AI
  suggestion is saved. Manual outfits contain the user's actual chosen IDs.

All database access uses the server workspace ID. Never accept a workspace
ID from the browser. Never import repositories or secrets into Client
Components.

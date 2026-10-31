# Supabase data contract

Target: PRD from `origin/main` commit `34c3ca8`. This document describes database
capabilities, not completed screens, provider integrations, or public endpoints.

## Shared demo access

There is no login or per-user ownership. All visitors use the same synthetic demo
workspace. Every server call derives `workspace_id` from `STYLORA_WORKSPACE_ID`;
RPC workspace arguments must never come directly from request payloads.

All 20 application tables enable RLS and deny direct `PUBLIC`, `anon`, and
`authenticated` access. The server secret bypasses RLS, so server scoping and
composite foreign keys are both required. Public sharing is resolved by the server,
not by granting public table access. No auth/client configuration is introduced.

## Feature coverage

| PRD area             | Tables and stored state                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation           | `workspaces`, `assets`: private bucket/path, MIME, size, source, deletion state                                                              |
| Wardrobe CRUD        | `wardrobe_items`: metadata, user facts, inferred attributes/provenance, optional asset, archive state                                        |
| Style DNA/body/fit   | `user_preferences`: optional, clearable `style_dna`, `fit_preferences`, `body_profile`                                                       |
| Inspiration/review   | `looks`: source asset, status, revision, provider/source; `inspiration_pieces`: stable IDs, attributes, corrections, confidence              |
| Matching             | `wardrobe_matches`: owned match/wardrobe alternative/missing, explanation, differences, manual override and source revision                  |
| Three options        | `outfit_options`, `outfit_option_items`: explained options and independent per-slot owned/product/missing choices                            |
| Shopping/Value Score | `products`, `shopping_searches`, `shopping_results`: provider evidence, nullable money/rating fields, query context, weights/factors/version |
| Saved looks          | `looks`, `look_items`, `saved_look_snapshots`: active context, owned relations and immutable historical decisions                            |
| Social Fit           | `share_links`: hash-only token storage, safe snapshot, catchphrase, expiry, one-way revocation                                               |
| Capsule builder      | `capsules`, `capsule_items`, `capsule_outfits`, `capsule_outfit_items`: selected inventory, detailed brief, combinations and rationale       |
| Single/combo try-on  | `ai_jobs`: contextual references, provider/model, acknowledgments, mannequin/provider model, output asset and completion                     |

The new option enum is `closest`, `from_wardrobe`, `fresh_alternative`. Do not reuse
the previous project's Closest/No-Buy enum as this repository's contract.

## Flexible attribute payloads

Use JSON objects for fashion attributes and personalization; validate nested values
with the owning feature's Zod schema before writes. The database enforces object
shape, while semantic validation remains a server responsibility.

- `wardrobe_items.attributes`: user-entered primary/secondary colors, pattern,
  material/texture, silhouette/fit, length, sleeve/neckline/rise, style tags,
  season/occasion and optional brand/size/care metadata.
- `inferred_attributes` and `attribute_provenance`: keep model inferences separate
  from facts, with source, confidence, evidence and correction provenance per field.
- `inspiration_pieces.attributes/provenance/corrections`: editable garment details
  from PRD section 9. Do not infer body measurements, identity, brand/SKU or exact
  material composition from reference pixels.
- `style_dna`: style tags, color families/contrast and optional user-selected
  undertone/skin-depth choices. `fit_preferences`: fit, coverage, lengths, layering.
  `body_profile`: optional self-selected body-shape, proportions, and illustration
  references. Empty objects mean skipped/reset; no gender or body classification is
  mandatory.
- `capsules.brief`: purpose, required/excluded pieces and user instructions;
  timeframe/season/occasion also have explicit nullable columns. Purchase suggestions
  stay in `missing_additions`, outside owned capsule membership.

All demo inputs must be synthetic and shown as shared. These fields do not authorize
collecting sensitive personal photos or imply user-private storage.

## Referential and lifecycle rules

- Composite foreign keys include workspace and, where applicable, the parent look
  or capsule. A same-workspace piece from a different look is still an invalid link.
- Exactly one item source is allowed per outfit slot: a wardrobe item, a product,
  or an explicit missing description. From-your-wardrobe options reject products
  and missing pieces. Option source/type is immutable; changed source needs a new
  option. A product selection never creates a wardrobe record.
- Shopping starts only for missing/product slots, not owned slots. URLs receive a
  basic HTTP(S) check in SQL; provider adapters must still sanitize destinations,
  reject credential/private hosts and restrict any server fetches.
- Known monetary values require currency; unknown price/rating/shipping/reviews
  stay null. Integers use currency minor units and remain JavaScript-safe.
  Price/rating/relevance weights must be numeric, nonnegative and sum to one.
  Missing score factors remain absent/null; the server explains available factors.
- Archive wardrobe rows using `archived_at`. Referenced physical deletions are
  restricted, preserving saved look/capsule references. Queries for available
  inventory filter `archived_at IS NULL`; historical views show unavailable items.
- Saved snapshots cannot be updated. They retain item names and product/wardrobe
  distinctions plus the rationale, applied inputs, uncertainty and provider metadata
  used at save time. Existing manual saves are backfilled where members exist.
- New option saves require current source revision and reject archived inventory.
  Child changes serialize through the same option lock while a snapshot is saved.
- Preview jobs accept only non-identifying mannequin/provider-model context and
  explicit consent/limitations timestamps. Successful previews require a result
  asset and completion time. A queued record is not an executor or generated image.

## Server-only RPCs

Functions use `SECURITY INVOKER`, a fixed empty search path and explicit qualified
table names. Only `service_role` gets execution permission.

| Function                         | Input and result                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `save_look`                      | Server workspace, title, notes, 1-20 distinct wardrobe IDs. Atomically creates a manual saved look, ordered members and snapshot; returns look ID.                    |
| `save_outfit_option`             | Server workspace, option ID, expected look revision. Saves current per-slot selections and snapshot atomically; returns snapshot ID.                                  |
| `create_share_link`              | Server workspace, saved snapshot ID, catchphrase, future expiry up to 30 days. Returns share ID and a raw token once; database stores SHA-256 hash.                   |
| `create_capsule`                 | Server workspace, title, description, JSON brief and 1-100 distinct wardrobe IDs. Validates current inventory and persists membership atomically; returns capsule ID. |
| `create_capsule_from_saved_look` | Server workspace, snapshot ID, title, description and brief. Rejects product/missing snapshots and rechecks actual inventory; returns capsule ID.                     |

The public share response may contain only snapshot title, source label, item
name/category/color/kind and the catchphrase. The insert trigger constructs this
allowlist regardless of a submitted `public_snapshot`. Never return internal IDs,
profile inputs, provider metadata, storage paths or signed URLs. Public lookup must
hash the presented token and enforce `revoked_at IS NULL` and future expiry. Updates
may only revoke a link; they cannot change its public snapshot or re-enable it.

## Storage and migrations

Private buckets: `wardrobe`, `inspiration`, `previews`, each limited to JPEG/PNG/WebP
and 10 MiB per object. Store permanent workspace-prefixed paths; signed URLs are
short-lived transport capabilities. Server routes must validate uploads and assets,
enforce source-purpose matching and clean up orphaned/deleted files. Bucket creation
does not implement those routes.

Migrations remain the source of truth. Do not edit already applied migrations.
The full-product migration adds tables/columns, backfills manual snapshots and
replaces the save RPC compatibly; it does not reset existing data. Regenerate
`src/types/database.ts` from Supabase after schema changes; never edit it manually.
Hosted CLI verification can run in rolled-back transactions without Docker.

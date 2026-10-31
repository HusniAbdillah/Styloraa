# Owner 3 backend work plan

Ownership source: the user-supplied [four-person feature assignment](https://markedb.in/45r6u).
Repository comparison baseline: commit `44129c8`.
The backend is implemented on `feat/owner3-backend`. See
[integration handoff](owner-23-backend-handoff.md) for current contracts,
executed checks and remaining frontend work.

## Ownership and existing foundation

The user's assignment places product comparison, per-item selection, selected
outfit, saved looks and public sharing with Owner 3. Inspiration analysis, reviewed
pieces, matching, option generation and the shared AI client belong to Owner 2.
The older repository sprint ownership differs; it must not expand Owner 3 into the
matching/AI pipeline or leave products/sharing unassigned for this handoff.

Owner 3 covers frames 05, 06, 13, 15, 18, 21, 25 and 26. Frames 06/15/25/26 share
one selected-outfit template. Frame 18's form belongs to Owner 3, while capsule
creation/persistence and all previews belong to Owner 4. Owner 3 also owns the
public shared-look page and its minimal data contract.

The hosted PostgreSQL schema, private buckets and generated database types already
exist. The previous database handoff records 52 passing SQL assertions. That does
not verify a Next.js feature endpoint or a live AI/shopping provider.

Available server-only RPCs:

- `save_look`: manual owned-item look, ordered membership and immutable snapshot.
- `save_outfit_option`: current option and revision to immutable saved snapshot.
- `create_share_link`: minimal snapshot, hashed token, expiry and revocation state.
- `create_capsule_from_saved_look`: validates an owned snapshot and current inventory.

Use these existing operations before proposing new schema or duplicate services.

## Ordered implementation checklist

| ID     | Task                                 | Done when                                                                                                                                        | Dependency                                         |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| P3-B01 | Read the actual outfit for Compare   | Resolve Owner 2's persisted look/option/slot IDs, show all outfit pieces and multiple missing slots, and enforce the server workspace            | Owner 2's composition contract                     |
| P3-B02 | Retrieve catalog/product candidates  | A server-only retrieval adapter returns truthful source labels and nullable provider fields; results associate with the actual missing slot      | Existing products/search tables; selected provider |
| P3-B03 | Persist independent per-slot choices | Replacing trousers does not change shoes; two missing slots can be chosen independently; references and source revision are validated atomically | P3-B01/P3-B02                                      |
| P3-B04 | Calculate estimated spend            | Sum selected suggested products in integer minor units only when price/currency evidence supports it; unknown/incompatible totals stay explicit  | Actual persisted product choices                   |
| P3-B05 | Save and reopen decisions            | `save_outfit_option` checks expected revision and current inventory; list/detail reopen immutable actual snapshots after reload                  | Existing save RPC and P3-B03                       |
| P3-B06 | Create and revoke public shares      | Publish a reviewed saved snapshot with a token, expiry and minimal fields; expired/revoked tokens return unavailable                             | Existing share RPC and P3-B05                      |
| P3-B07 | Hand off Save as Capsule             | Send the actual owned saved source and user brief to Owner 4; reject suggested sources; do not duplicate capsule generation                      | Owner 4's agreed capsule service contract          |
| P3-B08 | Complete the backend smoke           | Independent selections, reload, immutable saves, workspace rejection, unknown prices and share/revoke are checked with synthetic data            | Previous tasks                                     |

P3-B01 through P3-B06 are implemented. P3-B08 is verified through focused checks
and the bounded HTTP smoke documented in the handoff. P3-B07 remains an Owner 4
integration boundary: consume the actual saved snapshot ID and detailed brief;
this work does not implement a duplicate capsule generation service.

## Proposed frontend/backend contracts

Choose Server Actions for UI-only mutations or Route Handlers when a shared HTTP
contract is needed. Both must call the same server-only feature operation. The
following HTTP shapes are proposals to agree before frontend integration:

| Operation        | Proposed HTTP contract                                                                    | Server behavior                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Compare          | `GET /api/looks/:lookId/products`                                                         | Resolve the selected actual option and all slots with their candidates                      |
| Product search   | `POST /api/looks/:lookId/products/search` with option/item IDs and bounded query          | Search only a valid missing slot; normalize provider evidence; preserve existing selection  |
| Current detail   | `GET /api/looks/:lookId/selected?option_id=...`                                           | Read scoped selected composition, real source IDs, current availability and estimated spend |
| Select pieces    | `PUT /api/looks/:lookId/selection` with option ID, expected revision and per-slot choices | Validate the entire selection; persist atomically; never trust client ownership or price    |
| Save decision    | `POST /api/looks/:lookId/save` with option ID and expected revision                       | Call `save_outfit_option`; return immutable saved snapshot ID                               |
| Saved collection | `GET /api/saved-looks`, `GET /api/saved-looks/:savedLookId`                               | Read workspace-scoped immutable snapshots                                                   |
| Create share     | `POST /api/saved-looks/:savedLookId/shares`                                               | Publish only the reviewed snapshot and catchphrase; return token link once                  |
| Revoke share     | `DELETE /api/shares/:shareId`                                                             | Scope by server workspace and set revocation state                                          |
| Public share     | `GET /api/shared/:shareToken`                                                             | Hash token, enforce expiry/revocation and return only the safe snapshot                     |

Do not invent a create/list endpoint solely to complete a diagram. Implement the
smallest agreed contract with a real caller. Multi-row selection updates may need
a reviewed RPC; coordinate that migration with the database owner rather than
performing separate HTTP writes and calling them atomic.

## Shopping and sharing integration

These are Owner 3 responsibilities in the user-supplied assignment. Implement
their backend while using Owner 2's IDs/attributes and Owner 4's capsule contract:

- Products: query the selected missing slot through a server-only SERP adapter,
  normalize and persist provider evidence, and attach results to that search/slot.
  Keep absent prices/ratings unknown. API keys stay server-side. A missing provider
  returns unavailable; never substitute an unlabeled mock success.
- The current root PRD requires adjustable Value Score. The implemented score is
  deterministic from returned price, rating and category/query relevance, with
  explicit unknown factors, renormalized weights and saved explanations. It does
  not use another AI model or claim a verified best buy.
- Social Fit: create a link from a reviewed saved snapshot; public lookup hashes
  its token and checks expiry/revocation. Return only allowlisted fields. Never
  expose profile fields, internal IDs, storage paths or signed URLs.
- Save as Capsule: hand the exact saved snapshot and user brief to Owner 4's
  existing capsule RPC/service. Do not rebuild capsule generation in decisions.

## Rules to preserve

- The app has no login. The workspace is shared and synthetic, not private per user.
- All Supabase code is server-only. The browser cannot choose the workspace.
- Matching and outfit rationale are consumed from Owner 2. Do not regenerate the
  AI breakdown or rebuild matching inside Compare.
- Products never become owned through selection or saving; wardrobe entry is an
  explicit separate operation.
- Saved snapshot IDs, active look IDs and option IDs are different identities.
- Preserve inferred/user-provided/corrected attributes and live/sample/manual sources.
- The assignment uses three Closest variants plus No-Buy, whereas the repository
  schema currently uses `closest`, `from_wardrobe`, `fresh_alternative`. Agree the
  composition mapping with Owner 2 before changing enums or generating options;
  do not silently rename already-applied database values while reading this brief.
- Providers and free-tier/model availability belong to provider setup. Compare,
  selections, saved decisions and sharing do not require a new AI model.

## Focused verification and handoff

Use a small number of meaningful checks for workspace scope, real references,
independent selection, stale revisions, immutable saves and sanitized errors. Mock
providers in automated checks; run a bounded live smoke separately when configured.
Do not repeat all 52 database assertions for every form edit.

Run the project's check/build commands once the complete slice is ready and local
dependencies work. Record blocked checks honestly. Hand off request/response
examples, actual commands/results and remaining dependencies. Do not commit, push,
merge or change hosted schema solely because this plan exists.

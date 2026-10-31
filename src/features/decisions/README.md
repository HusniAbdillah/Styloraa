# Decisions backend

Owner 3's server-only repository resolves active looks separately from immutable
saved snapshot IDs. Every parent and child lookup uses the server workspace.
The browser cannot submit a workspace, ownership, or price in mutation payloads.

| Endpoint                                 | Contract                                                                                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/looks/:lookId/selected?option_id=...`   | Current actual composition, revision, availability, sources and spending. An optional explicit option must belong to this look.                                         |
| `PUT /api/looks/:lookId/selection`       | `{ option_id, expected_revision, choices: [{ option_item_id, product_id }] }`; atomically replace only specified missing-slot choices through `select_outfit_products`. |
| `POST /api/looks/:lookId/save`           | `{ option_id, expected_revision }`; call `save_outfit_option`, return actual `{ saved_look_id, look_id, option_id }`.                                                   |
| `GET /api/saved-looks?limit=20&offset=0` | Bounded saved snapshots; maximum page size 50.                                                                                                                          |
| `GET /api/saved-looks/:savedLookId`      | Reopen the immutable snapshot, not the current active composition.                                                                                                      |

All HTTP responses are non-cacheable. Mutations honor `DEMO_WRITES_ENABLED`; a
stale revision yields a recoverable conflict. Selection does not create wardrobe
ownership, and a selected product remains suggested in saved responses.

Spending sums current selected product prices in currency minor units, excluding
shipping. Missing selections, unknown prices, mixed currencies and unsafe integer
totals yield a null complete estimate with explicit reasons. Owned-only outfits
have zero additional item spending. Product search, public sharing, capsule
creation and AI generation stay in their owning modules.

Current selected detail includes short-lived wardrobe image URLs from scoped,
active wardrobe assets. A deleted/mismatched referenced asset never falls back to
the old path; legacy paths are used only when there is no asset ID and the path is
inside the configured workspace. Suggested product links/images pass the product
adapter's public-URL validator. Signed URLs are never persisted in saved snapshots.

Focused tests cover safe totals, mutation schemas and save reference scoping.
Their execution and end-to-end status must be recorded by the integration owner;
these source files alone do not prove a browser journey or provider integration.

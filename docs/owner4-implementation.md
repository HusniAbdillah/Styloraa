# Owner 4: Capsule Studio and Muse previews

All eight requested routes are implemented and use real persisted data.
The current provider implementation and verification are documented in
[Owner 4 Muse integration](owner4-muse-integration.md) and the
[API contract](api-capsule-preview.md).

| Route                                   | Behavior                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------- |
| /capsules                               | Persisted cards and builder with owned-piece selection                      |
| /capsules/:id                           | Complete brief, selected inventory and overview                             |
| /capsules/:id/edit                      | Atomic edit and revision conflict handling                                  |
| /capsules/:id/outfits                   | Muse Spark combinations, optional unowned additions and manual arrangements |
| /capsules/:id/outfits/:outfitId         | Owned composition, rationale, provenance and uncertainty                    |
| /capsules/:id/outfits/:outfitId/preview | Muse Image preview in capsule context                                       |
| /looks/:lookId/preview                  | Selected option or owned saved snapshot; actual Save as Capsule selection   |
| /wardrobe/:itemId/preview               | Single owned garment preview                                                |

The shared template supports real generated results, reload recovery, owned
replacement, stale input, errors/retry and deletion. Image processing uses
a non-identifying mannequin and requires garment photos and consent. All
Supabase access stays server-only and workspace-scoped, with private Storage.

The Porcelain/Paper/Oxblood palette, project logo, Instrument Serif/Inter,
collapsible desktop rail and focus-managed mobile drawer remain in place.

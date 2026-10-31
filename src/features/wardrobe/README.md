# Wardrobe

Owner: Owner 1 backend scope. The wardrobe is the first backend page because
its stable item IDs are consumed by outfit creation, saved looks, and capsules.

- `schema.ts` validates the category, display fields, notes, and bounded
  structured garment attributes. Caller supplied workspace IDs are stripped.
- `repository.ts` is server-only. Every operation reads the configured
  `STYLORA_WORKSPACE_ID`; list and detail hide archived rows, and edit/archive
  predicates include both item ID and workspace ID.
- `actions.ts` exposes validated add, edit, archive, image upload, and image
  removal server actions behind `DEMO_WRITES_ENABLED`. Item removal archives
  the row so saved history retains its reference. User-facing errors do not
  expose database details.
- `components/` renders the server-fetched active inventory with filters,
  pagination, edit/archive controls, image upload/removal, and signed image
  previews.

The repository supports search/category filtering and offset pagination with a
total count. Metadata-only items work without an image. Image files are capped
at 10 MiB, checked against JPEG/PNG/WebP signatures, uploaded to the private
workspace-prefixed bucket path, verified after upload, and associated through an
`assets` row. Read URLs are signed on demand for five minutes and never stored.
Image attachment uses the item's previous asset ID as a compare-and-set guard,
so concurrent uploads cannot silently overwrite each other or leave the losing
upload attached to the item. Image retirement removes the private object before
marking its asset row deleted, so a failed Storage removal leaves the row
available for a later cleanup retry.

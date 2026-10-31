# Wardrobe

Owner: Owner 1 backend scope. The wardrobe is the first backend page because
its stable item IDs are consumed by outfit creation, saved looks, and capsules.

- `schema.ts` validates the required name, category, and color fields, optional
  subcategory and notes, and bounded structured garment attributes. Caller
  supplied workspace IDs are stripped.
- `repository.ts` is server-only. Every operation reads the configured
  `STYLORA_WORKSPACE_ID`; list and detail hide archived rows, and edit/archive
  predicates include both item ID and workspace ID.
- `actions.ts` exposes validated add, edit, archive, image upload, and image
  removal server actions behind `DEMO_WRITES_ENABLED`. New items require a
  verified uploaded image before they can be saved. Item removal archives the
  row so saved history retains its reference.
- `components/` renders the server-fetched active inventory with category
  filtering, detail search, pagination, edit/archive controls, image upload and
  removal, and signed image previews.
- `demo-wardrobe.ts` maps every clothing photo in `src/assets` to a local
  static starter record. The default Wardrobe screen displays these bundled
  examples without uploading them to Supabase. `supabase/seed.sql` uses the
  same records for local resets and stores each image filename in seed
  provenance so seeded rows can display the matching bundled photo. Items
  added by visitors remain workspace-scoped in Supabase and their uploads stay
  in the private Storage bucket.

Search checks name, category, color, subcategory, notes, and every key/value in
the structured and inferred garment attributes. Category filtering is exact.
Search is applied to active rows in the configured workspace before pagination.

New-item photo flow: the browser asks a Route Handler to create a short-lived
signed upload capability; it uploads the JPEG/PNG/WebP directly to the private
workspace-prefixed bucket path; the Server Action validates the unexpired
asset and downloaded image bytes, then creates the wardrobe row with the image
attached. Reads use five-minute signed URLs on demand; URLs are never stored.
Existing-item image replacement uses the item's previous asset ID as a
compare-and-set guard, so concurrent uploads cannot silently overwrite each
other. Image retirement removes the private object before marking its asset
row deleted, leaving failed removals available for cleanup retry.

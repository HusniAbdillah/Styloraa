# Owned-piece previews

Owner 4. One responsive template serves wardrobe, look and capsule contexts.
Muse Image 1.0 receives owned garment references and explicitly selected style
preferences. The model is a faceless mannequin; personal photo uploads are
not part of this shared workspace.

Generation is awaited within a bounded Node request, recorded as running,
then succeeded/failed. It is not a durable queue. The server restores the
latest job after reload and invalidates changed input or superseded selections.
Results are workspace-scoped private Storage objects, exposed with short-lived
signed URLs. Delete removes the image and detaches context relations while
retaining the usage ledger.

Inputs: at most six PNG/JPEG/WebP references, 10 MB each and 12 MB combined.
Output: inline image bytes only, at most 10 MB; provider URLs are never fetched.
See docs/owner4-muse-integration.md and docs/api-capsule-preview.md.

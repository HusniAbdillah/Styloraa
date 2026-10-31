# Capsule outfits

Owner 4 owns capsule combinations; Owner 3 owns the general selected-look flow.
Muse Spark 1.3 produces explained combinations through the shared Meta Responses
endpoint. Every returned ID is checked against the available selected inventory,
required IDs and exclusions; repeated combinations are removed.

A short-lived signature binds each draft to its workspace, capsule, exact output
and capsule revision. Server validation and a database trigger reject stale AI
drafts; the database records the current source revision. Manual arrangements
remain explicitly manual. All queries and child relations use server workspace
scope. Deletion cleans terminal previews while retaining the generation ledger.

See docs/owner4-muse-integration.md.

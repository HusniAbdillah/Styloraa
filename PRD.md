# Stylora PRD — 7-hour demo

Status: initial working scope. The app has no login; one shared demo
workspace is used by everyone. All visitors can change the same data; use
synthetic data. Personal data and sensitive uploads are out of scope.

The current implementation is a partial scaffold. The table below is the
sprint acceptance target, not a list of finished features. The default
`DEMO_WRITES_ENABLED=false` disables mutations until the database and demo
dataset are ready; placeholder pages do not count as done.

## Priority flows

Add a wardrobe item → pick items → compose a look → save → reopen it. The
demo must show persistence after reload, not just browser state. Profile is
a scaffold page only and does not imply user accounts.

| Priority | Feature                  | Done criteria                                                                                                  |
| -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| P0       | Foundation               | Build, visual tokens, responsive shell, server env, error states                                                |
| P0       | Wardrobe                 | Create/read/update/delete item metadata in the fixed workspace; server validation; data survives reload        |
| P0       | Create/save look         | Pick same-workspace items, save look with relations, open detail/saved looks; other-workspace refs rejected    |
| P0       | Data boundaries          | No direct anon/authenticated access; secrets stay server-side; workspace scope on every query                   |
| P1       | Preferences              | Shared demo preferences persist and read back                                                                  |
| P1       | Capsule                  | Same-workspace item collection, validated form; React Hook Form for long forms                                  |
| P1       | AI matching              | Real server-side provider, validated output, honest timeout/status/errors; only after P0 is stable             |
| P2       | Storage upload           | Server-mediated upload, private bucket, MIME/size limits, cleanup; demo data only                               |
| P2       | Sharing                  | Separate snapshot/token/expiry/revoke contract; do not open private tables                                     |
| P2       | Preview/try-on           | Real provider and durable job executor; not an early-demo promise                                               |
| P2       | Products/inspiration/decisions | Growth-boundary modules; catalog/recommendation integrations come later                                  |

## Product limits

No auth, per-person ownership, payments, multi-tenant orgs, catalog
scraping, mandatory queues, or model training. The server workspace ID is a
dataset boundary, not an authentication replacement. Shared data can be
changed by other visitors; the UI must explain that behavior.

AI is not connected in the boilerplate. Disabled/unavailable endpoints must
not be labeled as AI results. Writing a `queued` job without an executor
does not count as a job implementation.

## Demo definition of done

- The P0 flow runs on a preview using a real Supabase backend, and data
  persists after reload.
- Client requests cannot pick another workspace or link cross-workspace items.
- Direct Data API access via anon/authenticated exposes no data; secrets
  stay out of bundles/logs/repository.
- Lint, typecheck, focused tests, production build, and database tests pass;
  blocked checks are recorded.
- Loading, empty, error, and focus states exist, and mobile layout is usable.
- The team has a preview URL, demo steps, feature limits, and a demo-data
  reset procedure.

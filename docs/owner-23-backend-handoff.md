# Owner 2 to Owner 3 backend integration

Implementation branch: `feat/owner3-backend`, integrated with `origin/main`
at `cee20b5`. This handoff covers backend contracts; feature pages are not
connected by this delivery.

## Data flow

1. Owner 2 persists inspiration pieces, matching and the three existing option
   types: `closest`, `from_wardrobe`, `fresh_alternative`.
2. `GET /api/looks/:lookId` keeps Owner 2's `{ data: look }` response, including
   revision, options and stable option-item IDs. It now includes
   `selected_option_id`, `is_saved`, `requested_brief` and `requested_category`.
3. Pass a real option ID to `GET /api/looks/:lookId/products?option_id=:optionId`.
   Compare includes every slot, owned availability/images, selected products,
   candidates, source labels and the latest search state.
4. `POST /api/looks/:lookId/products/search` accepts
   `{ option_id, option_item_id, q?, weights? }`. A query defaults to the original
   brief, normalized and capped at 240 characters. No wardrobe items or
   `from_wardrobe` options can be searched. Missing slots without a linked
   inspiration piece use a canonical garment category as their slot ID.
5. `PUT /api/looks/:lookId/selection` accepts
   `{ option_id, expected_revision, choices: [{ option_item_id, product_id }] }`.
   The atomic RPC validates the exact searched slot, current source revision and
   server workspace. Partial choices preserve other slots. Products remain
   suggested; selecting and saving never establishes ownership.
6. `GET /api/looks/:lookId/selected?option_id=:optionId` reads the current actual
   composition and spend. It is separate from Owner 2's inspiration endpoint.
7. `POST /api/looks/:lookId/save` accepts `{ option_id, expected_revision }`,
   returning `{ saved_look_id, look_id, option_id }` with HTTP 201. Use
   `/api/saved-looks` and `/api/saved-looks/:savedLookId` to reopen immutable
   snapshots. Active look, option and saved snapshot IDs are different identities.
8. `POST /api/saved-looks/:savedLookId/shares` accepts
   `{ catchphrase?, expires_in_hours? }`. HTTP 201 returns a token once, its
   relative `/shared/:token` path and expiry. `GET /api/shared/:token` returns
   only minimal snapshot fields. `DELETE /api/shares/:shareId` revokes
   idempotently. Expired/revoked/invalid tokens all return 404.

Owner 3 responses are plain JSON objects. Owner 2 responses retain their existing
`data` envelope. All reads are non-cacheable; mutation errors are sanitized.
Clients cannot submit workspace, ownership or price fields.

## Provider and database details

- Fill `SERPAPI_API_KEY` in ignored `.env.local`, then restart the server. Vision
  and recommendations separately require `MODEL_API_KEY`. Never use public env
  prefixes or commit keys.
- Shopping uses one Google Shopping batch per request with Indonesia locale,
  a 25-second timeout, 2 MiB response limit and at most 40 accepted products.
  Failed requests do not silently retry or return fabricated listings.
- Price is nullable integer minor units, so IDR 239,090 becomes `23909000`.
  Shipping is excluded. Unknown or mixed-currency totals stay explicit.
- Value Score weights default to price 0.3, rating 0.2, relevance 0.5. Factors,
  weights/version and explanations persist with each search result. Missing
  factors are excluded and remaining weights renormalized.
- Atomic shared search reservations enforce five searches per minute and 100
  per day, including failures. This is a shared demo, not a per-user allowance.
- Existing applied Owner 2/profile migration files were recovered with their
  exact remote versions `075102`, `075312`, `075657`, `075939` on 2026-10-31.
  The three duplicate, unapplied `17xxxx` files from main were removed after SQL
  token comparison. No remote history repair, schema reset or replay occurred.
- Owner 3's `20261031080301` migration is already applied. Generated database
  types came from the hosted schema. CLI dry-run confirms no pending migration.
- `20261031085038` changes deterministic stale revision guards in four RPCs to
  `PT409`. Raising `40001` for business conflicts made PostgREST retry indefinitely,
  as described in the [Supabase troubleshooting guide](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions).
  Signatures, security-invoker behavior and server-only grants are preserved.

## Verification

- Final combined suite: **53 passing tests across 11 files**.
- ESLint, TypeScript, production build and `git diff --check`: passed.
- Hosted SQL assertions after the conflict fix: **59 passed** (16 selection,
  13 inspiration, 30 full product contract). These run inside rollback transactions.
- Live Owner 2 segment passed upload/private Storage, Muse analysis of five
  pieces, correction, matching, manual override, three options and reload.
- Completed integration smoke used explicitly labelled Owner 2 persistence
  fixtures, then two live SerpAPI searches through the actual application routes.
  It verified independently selected slots, matching Owner 2/3 reloads, HTTP 409
  for stale revisions, rejection of client workspace fields, immutable saved
  snapshots after a changed product selection, minimal public sharing and
  idempotent revoke followed by public 404.
- A single uninterrupted live AI-to-shopping run is not claimed: the earlier
  live AI run stopped at a temporary shopping-provider 503. The complete fixture
  integration smoke passed after the URL and revision-conflict fixes.

Live verification found and fixed two regressions that unit tests alone missed:
Google Shopping links can contain unencoded spaces, and the REST layer retries
the old serialization-failure code. Temporary fixture rows/snapshots/shares were
removed after checks; real retrieved product catalog rows remain reusable.

Live smoke commands:

```powershell
# Server in a separate terminal; bind only to loopback for local verification.
pnpm build
pnpm start --hostname 127.0.0.1 --port 3001

# Labelled Owner 2 persistence fixtures plus at most two live shopping requests.
node scripts/owner23-smoke.mjs

# Full live upload, Vision, correction, matching, recommendation, shopping, save/share.
# The existing Owner 2 fixture expects an empty wardrobe.
$env:OWNER2_API_URL = 'http://127.0.0.1:3001'
$env:OWNER3_INTEGRATION = 'true'
$env:OWNER2_IMAGE_PATH = 'C:\path\to\approved-outfit.png'
node scripts/owner2-e2e.mjs
```

Smoke scripts log assertions without tokens/private URLs, use temporary scoped
look IDs and remove their snapshots, shares and fixture rows. Actual retrieved
product catalog records remain reusable. These bounded live calls are separate
from mocked automated tests; they are not a browser E2E suite.

The old default `src/dummy/outfit inspiration.jpg` is not tracked in this repo.
Set `OWNER2_IMAGE_PATH` to an approved non-sensitive outfit fixture before the
full live smoke. JPEG, PNG and WebP upload MIME types are supported.

## Remaining work

- Connect frontend Compare, selected outfit, Saved Looks and public share page.
  The backend returning a `/shared/:token` path does not complete its UI.
- Owner 4 consumes the actual owned saved snapshot and brief for capsule
  creation; preview/capsule UI and provider work are outside this delivery.
- Fresh local database reset was not run; hosted history and targeted SQL rules
  were verified. No deployment, push or merge is claimed by this handoff.

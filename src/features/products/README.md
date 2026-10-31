# products

Owner 3 backend: product comparison, explicit missing-piece retrieval and
transparent deterministic Value Score. Matching and AI option generation remain
with Owner 2. All Supabase access uses the server-selected shared workspace.

## HTTP contract

- `GET /api/looks/:lookId/products?option_id=:optionId` resolves the actual current
  option, every slot, owned-item availability/temporary image URL, selected product
  and candidates associated with the latest successful search for each slot.
- `POST /api/looks/:lookId/products/search` accepts strict JSON
  `{ option_id, option_item_id, q?, weights? }`. Optional weights contain only
  price/rating/relevance, each between zero and one and summing to one. Body
  workspace IDs and extra fields are rejected.

Search verifies the real look/option/source revision and missing slot before
provider access. It reserves a database search attempt before calling SerpAPI;
the shared database rate guard is owned by the integration migration. Results are
upserted under workspace/provider references and associated with the exact search
and slot before they are returned. Search never updates item selection or creates
wardrobe ownership. Selection requires this candidate association.

The source slot's `requested_brief` and `requested_category` remain stable after
product selection. Owned/from-your-wardrobe slots cannot initiate shopping search.

## Provider and evidence

Set `SERPAPI_API_KEY` only on the server. A missing/placeholder key returns a clear
503 before a search reservation or provider request. There is no fake live-data
fallback. Existing stored sample records keep their sample source label.

The adapter uses the fixed HTTPS SerpAPI Google Shopping endpoint, Indonesia market,
one explicit request, no retries/redirects, a 25-second timeout, a 2 MiB response
limit and at most 40 deduplicated garment matches. Category matching is conservative
and may omit ambiguous titles. Public product/image URLs are validated but never
fetched by this server. Unknown/ambiguous/partial prices remain null; IDR uses two
minor-unit decimal places. Google Shopping links are preserved rather than claimed
to be direct retailer URLs. Provider errors are sanitized.

Value Score v1 records the search's weights, per-result factors, score and
explanation. Price compares the returned same-currency batch only, ratings use
actual returned five-star data and relevance uses title/query overlap plus the
validated garment category. Unknown factors are excluded and the available weights
renormalized. Missing data, mixed currencies and unknown shipping remain explicit;
the score is not a verified best-buy, stock or freshness claim.

Focused automated tests mock the provider and cover source guards, safe URLs,
normalization, response bounds and score behavior. A real-key provider request,
browser integration and storefront availability are separate verification gates.

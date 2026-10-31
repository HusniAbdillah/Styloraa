# Stylora Product Requirements Document

**Status:** Product and hackathon scope  
**Product:** Stylora  
**Platform:** Responsive web application optimized for desktop and mobile browsers  
**Hackathon timebox:** 7 hours  
**Primary stack:** Next.js App Router, TypeScript, Supabase, Muse vision API, Gemini text/image models, and a SERP-powered shopping search provider

## 1. Product summary

Stylora helps people turn an outfit image they saved from TikTok, Instagram, or another social source into a practical outfit they can recreate. The user uploads an inspiration image, reviews the clothing pieces Stylora detects, compares them with their wardrobe, explores three explained outfit options, and finds purchase links for pieces they are missing.

Stylora is a fashion decision assistant, not a generic image captioner or an unverified product catalog. Every AI-generated match, alternative, capsule suggestion, and shopping shortlist must explain why it was recommended, which user preferences informed it, and where uncertainty remains.

## 2. Problem and opportunity

People regularly save outfit inspiration but cannot easily identify each garment, find comparable items, or tell whether they already own pieces that would work. Searching manually is slow and often produces poor matches. Shopping recommendations also lack context: users need to understand why a garment suits the reference and their own style before spending money.

Stylora connects inspiration, wardrobe inventory, personal style context, outfit planning, and product discovery in one flow. It should encourage thoughtful reuse and make shopping the next step only when a useful wardrobe match is missing.

## 3. Product principles

1. **Explain every recommendation.** Each suggested match or outfit includes a concise “Why this?” explanation grounded in visible garment attributes, wardrobe availability, and the user's saved style context.
2. **Be honest about evidence.** Separate detected facts, inferred attributes, user preferences, and catalog data. Mark low-confidence detections and unavailable provider results; never present placeholder content as a real AI or search result.
3. **Prefer reuse before purchase.** Show owned items and viable wardrobe alternatives before shopping suggestions. Capsule recommendations should maximize useful outfit combinations and cost-per-wear potential.
4. **Keep user agency.** Let users correct detections, choose which pieces to match, replace pieces in a try-on, and dismiss recommendations.
5. **Design for responsive use.** The full workflow works on desktop and mobile web, including touch input, keyboard access, clear progress, and recoverable errors.
6. **Treat body and skin attributes carefully.** They are optional, user-provided personalization inputs, not judgments or constraints. Use neutral language, explain when they affect a recommendation, and allow editing or clearing them.

## 4. Target users and jobs to be done

### Primary user

A fashion-interested person who saves looks from social media and wants to recreate the vibe using clothes they own, then find credible options for anything missing.

### Core jobs

- “When I see a look I like, help me identify its individual clothing pieces.”
- “Show me which pieces I already own and the closest alternatives in my wardrobe.”
- “Give me a few wearable ways to recreate the look and explain why each works for me.”
- “Help me compare purchase options for the pieces I still need.”
- “Help me get more combinations from my current wardrobe before I buy more.”

## 5. Goals and non-goals

### Hackathon demo goals

- Demonstrate the end-to-end inspiration-to-outfit-shopping concept with a clear responsive interface.
- Persist wardrobe items, preferences, and saved looks in Supabase within the configured demo workspace.
- Provide a useful manual-review path if Muse, Gemini, or SERP credentials are unavailable or fail.
- Show visible reasoning and confidence/uncertainty at each AI-assisted step.
- Make at least one core path complete and reliable within seven hours; defer depth before compromising data safety or truthful status.

### Product goals after the hackathon

- Support personal accounts and private wardrobes.
- Provide robust image analysis, personalized outfit generation, virtual try-on, social sharing, capsule planning, and shopping comparisons.
- Improve recommendation quality using user corrections and outcome signals, with explicit consent and privacy controls.

### Non-goals for the 7-hour demo

- Production-grade authentication, multi-tenant privacy, payments, order placement, or inventory integrations.
- Training a fashion model or claiming exact garment identification from an image.
- Scraping arbitrary marketplace pages or guaranteeing price/stock freshness.
- A durable background job system for long-running image generation.
- Public sharing of private wardrobe data or upload of sensitive personal photographs.

## 6. Scope and priority

### P0 — Demo-critical path

1. **Responsive landing page:** a clear hero, example workflow/demo visual, primary upload call to action, and a secondary action to explore a sample inspiration. Explain the value in plain language.
2. **Inspiration intake:** accept a supported image with file type and size validation; show preview, progress, retry, and remove/replace controls. Provide a seeded sample image/demo path if no provider key is configured.
3. **Garment detection and review:** send the image to the configured Muse vision provider on the server; return a structured list of pieces and editable attributes. Clearly label the source and confidence of each detection.
4. **Wardrobe matching:** compare detected pieces against saved wardrobe items. Classify each result as **Owned match**, **Wardrobe alternative**, or **Missing** and explain the match using shared attributes.
5. **Three outfit concepts:** generate (a) a close recreation, (b) an alternative assembled primarily from owned items, and (c) a distinct alternative that may combine owned, wardrobe alternatives, and recommended missing pieces. Each has a title, short description, item list, and “Why this?” explanation.
6. **Shopping shortlist:** for missing pieces, query the configured SERP shopping/search provider and show attributable product links with the available price, rating, seller, and freshness/source metadata. Let the user compare best value options using visible scoring factors.
7. **Wardrobe and saved looks:** allow CRUD for wardrobe metadata and images where safely supported; save a look and reopen it. Persisted data must survive a reload.
8. **Style profile basics:** offer optional, skippable style and fit preferences. The landing page may suggest completing them, but upload must remain available without them.

### P1 — If the core path is stable

- Capsule builder using wardrobe items to suggest multiple combinations, plus a small, high-utility “consider adding” list.
- More complete Style DNA and body profile selections using inclusive, labeled illustrations and explicit “prefer not to say”/skip options.
- Compare shopping results with adjustable best-value priorities (price, rating, relevance).
- Social Fit share page with a user-controlled share link and a safe outfit snapshot.
- Single-item and outfit-combination virtual try-on, only when an image generation provider is configured and completes successfully.

### P2 — Post-hackathon roadmap

- Authentication, private per-user workspaces, consent and account controls.
- Durable jobs, notifications, provider quotas, monitoring, and retries for image generation.
- Broader marketplace coverage, price history, stock checks, affiliate disclosure, and localized catalog ranking.
- Outfit calendar, packing lists, community discovery, moderation, and collaborative styling.
- Recommendation evaluation, opt-in feedback loops, and accessibility/localization expansion.

## 7. Primary user journey

1. **Discover:** The user lands on a concise explanation of “inspiration to outfit.” They can upload a screenshot or open a clearly labeled sample demo. Optional profile completion is encouraged but never blocks the core task.
2. **Upload:** The user chooses or drops an outfit image. Stylora validates format/size, previews it, and explains that the image will be analyzed. The user can replace it before analysis.
3. **Analyze and review:** Stylora identifies garments and likely attributes. It groups results by garment and shows confidence/source. The user edits or removes errors before continuing.
4. **Match wardrobe:** Stylora compares each reviewed garment with the user's wardrobe and shows owned matches, alternatives, and missing pieces. Users can change a match or mark a suggested piece as irrelevant.
5. **Explore outfits:** Stylora presents three clearly differentiated combinations. Each card explains silhouette, color relationship, material/texture balance, occasion/use, wardrobe reuse, and profile relevance where applicable. Users can replace individual items and regenerate a rationale.
6. **Find missing pieces:** The user selects an outfit and searches only for its missing items. SERP results link to the original seller/product result and display the data available, its source, and an “as of” timestamp when provided. Best value is a transparent score, not an unexplained winner.
7. **Save and reuse:** The user saves the selected look to their looks collection or adds a found item to the wardrobe manually. The saved look links to the wardrobe items and any product references.

### Journey states

- Empty wardrobe: explain that adding a few items improves matching; offer sample wardrobe data for demo mode.
- Missing profile: continue with neutral defaults and state that profile personalization was not applied.
- Provider unavailable/timeout: show the issue and retry or continue with manual review/sample data explicitly labeled as demo content.
- Partial detection: show detected pieces and let the user add a missing piece manually.
- No wardrobe matches: show “Missing” honestly and allow shopping search or save without shopping.
- No shopping results: preserve the outfit and show that no results were returned; do not fabricate links or prices.
- Upload/network failure: retain the user's selection where possible and offer retry/remove.

## 8. Recommendation and fashion reasoning requirements

Every AI recommendation visible to the user must provide:

- **Recommendation:** the item, match, combination, or shopping option.
- **Why this:** one to three concrete reasons based on fashion attributes and the available user context.
- **Inputs used:** detected image attributes, wardrobe item IDs/attributes, and relevant profile fields. Do not imply that a field was considered if it was absent.
- **Confidence/limitations:** confidence or a human-readable uncertainty note for uncertain visual inference or incomplete product data.
- **Control:** an edit, replace, dismiss, or “not my style” action appropriate to the surface.

Useful outfit compatibility signals include color harmony/contrast, dominant and accent colors, warm/cool/neutral undertone compatibility when the user opted in, silhouette and proportion balance, garment fit/volume, texture/material balance, layering and weather suitability when known, formality/occasion, style tags, seasonality when known, and wardrobe availability. Recommendations must not reduce a person to one body category or claim that a shape is objectively wrong for a garment.

Examples of acceptable reasoning:

- “This keeps the reference’s relaxed silhouette with your wide-leg trousers. The darker lower half balances the lighter jacket; both pieces are already in your wardrobe.”
- “This muted green may complement the warm undertone you selected, while the cropped jacket echoes the reference proportions. Color and fit are inferred from the image, so review the piece details.”
- “This is a close color and texture alternative to the reference, but the cut is more fitted than the original.”

Avoid unsupported claims such as “perfect for your body,” exact material composition from pixels, guaranteed fit, or a skin-tone judgment inferred from a fashion screenshot.

## 9. Data requirements

### Wardrobe item

- `id`, `workspace_id`, display name, category, optional subcategory, image/storage reference, notes, created/updated timestamps.
- Fashion attributes: primary/secondary color, pattern, material/texture (with confidence/source when inferred), silhouette/fit, garment length, sleeve/neckline/rise where relevant, style tags, season/occasion, brand/size/care metadata when user supplied.
- User-entered facts and AI-inferred values must remain distinguishable and editable.

### Inspiration analysis piece

- Stable piece ID, garment category/subcategory, visible color(s), pattern, apparent texture/material, silhouette/fit, length/cut details when visible, layering role, style tags, likely occasion, confidence, evidence/source, and optional user correction.
- Do not infer brand, exact SKU, exact material blend, wearer identity, or body measurements from an inspiration image.

### Style DNA (optional)

- Style tags (e.g. minimalist, streetwear, classic, romantic, sporty, workwear, modest, experimental) and preferred color families/contrast level.
- Undertone selection: warm, cool, neutral, or unsure; shown as an optional, user-selected visual guide, not diagnosed from uploaded photos.
- Skin-depth range may be offered as an optional inclusive visual preference if useful to the user. Label it neutrally, include a skip/unsure option, and never make it required.
- Fit and coverage preferences such as relaxed/regular/fitted, preferred lengths, layering, and coverage. These are actionable preferences and should carry more weight than body labels.

### Body profile (optional)

- Offer inclusive body-shape illustrations with text labels and selectable/clearable state. Provide multiple gender-neutral shape options; do not force a binary gender selection. If gendered illustrations are used as an optional visual aid, explain that the user can choose whichever illustration feels useful.
- Prefer storing fit preferences and user-selected proportions over inferred body shape. Never infer shape, skin tone, or measurements from a reference outfit image.
- Explain which selected preference affected a recommendation; allow “not considered” and reset controls.

### Look and recommendation

- Look ID/title/description, source inspiration reference, selected wardrobe item IDs, missing item descriptions, option type (close recreation/wardrobe alternative/creative alternative), rationale, inputs used, model/provider metadata, creation time, and user edits.
- Shopping product references store provider, source URL, title, price/currency if returned, rating/review count if returned, image URL if permitted, query, retrieval timestamp, and score breakdown. Treat provider fields as untrusted and sanitize rendered URLs.

### Capsule

- Capsule title/timeframe/season/occasion (optional), wardrobe item IDs, generated combinations, rationale per combination, suggested missing items, and user edits.
- Capsule evaluation should reward versatility/reuse and avoid recommending purchases that duplicate useful owned items without an explicit reason.

## 10. Feature requirements

### 10.1 Landing page and onboarding

- Communicate the workflow with an example image/result or compact demo.
- Primary CTA: upload an outfit image. Secondary CTA: view sample/demo.
- Explain supported file types, image handling, and whether AI providers are available.
- Suggest creating a Style DNA/profile for more tailored suggestions, with clear skip and later-edit paths.

### 10.2 Inspiration analysis

- Accept a user-selected image only; do not fetch an arbitrary URL pasted by the user.
- Validate MIME type and size on the server. Use randomized object paths and private storage if persistent image storage is enabled.
- Return structured, schema-validated output; handle malformed or partial provider responses.
- Make attributes editable before matching. Maintain provenance/confidence per attribute where feasible.

### 10.3 Wardrobe matching

- Use structured attribute similarity and user corrections, not image caption text alone.
- Display match type, shared attributes, differences, and a concise reason.
- Let the user override a proposed match. Preserve the distinction between the exact reference item and a wardrobe substitute.

### 10.4 Outfit generation

- Produce three distinct options with clear labels: **Closest to the inspiration**, **From your wardrobe**, and **A fresh alternative**.
- Use only known wardrobe item IDs and explicit missing-item descriptions; never invent wardrobe IDs.
- Include “Why this?”, profile inputs applied, fashion rationale, uncertainty, and a replace-item affordance.
- If the AI response fails validation, offer manual construction or a clear retry instead of rendering malformed content.

### 10.5 Shopping and Value Score

- Query SERP for each selected missing item using category, color, fit/style descriptors, and region/currency where configured.
- Do not scrape arbitrary sites directly. Preserve the result provider and source link; sanitize to safe HTTP(S) destinations.
- Show only values returned by the provider and make missing fields explicit.
- Provide a configurable value score with visible normalized factors, for example: relevance to the item brief, total price (including shipping only when available), rating/review count, and freshness. Explain weights and allow the user to favor price, rating, or relevance.
- Do not label a product “best” solely because it is cheapest. Surface affiliate/commercial relationships if applicable.

### 10.6 Wardrobe CRUD

- Create, view, edit, and delete wardrobe items. Support metadata-only entry so image upload is not a blocker.
- Item images are optional. Keep uploads private, validate type/size, and do not expose permanent public URLs for private wardrobe images.
- Deleting an item must leave saved looks/capsules in a clear state (e.g. unavailable item reference) rather than silently breaking the experience.

### 10.7 Capsule builder

- Generate multiple combinations primarily from existing wardrobe items, using item IDs and text attributes as the AI input.
- Optimize for versatility: repeatable pieces, distinct combinations, occasion coverage, color coordination, and lower redundant purchases.
- For each combination, explain why it works and list which selected preferences affected it.
- List purchase suggestions separately with a “why this addition” and estimated reuse opportunities; do not imply cost-per-wear is known without usage/price data.

### 10.8 Social Fit

- Allow a user to create a shareable snapshot of a selected look with a custom catchphrase and link.
- Sharing is opt-in, revocable, and limited to fields included in the snapshot. Never expose private wardrobe records, profile, or upload paths through broad database access.
- For the shared demo workspace, clearly state that data is shared and editable by visitors; public sharing must use a separate safe snapshot contract.

### 10.9 Try-on

- Support a single-item preview and a selected outfit-combination preview as separate user actions.
- Let users change selected pieces before generation.
- Use a user-provided eligible model photo only after clear consent, explain provider processing/retention as configured, and offer deletion. If personal photos cannot be safely handled in the demo, use a non-identifying mannequin/illustration or defer the feature.
- Never claim size accuracy, fit guarantees, or photorealistic fidelity unless validated. Respect user-selected skin/undertone and fit preferences only when provided.
- Show a truthful pending/failed/completed state; a queued database row alone is not a completed try-on.

## 11. UX, accessibility, and responsive behavior

- Desktop: readable centered content, persistent step context, side-by-side image and garment review where space allows, and comparison layouts for outfit/product options.
- Mobile: single-column steps, large touch targets, sticky but non-obstructive next action, compact progress indicator, and stacked comparison cards.
- Keep progress and current step clear: Upload → Review pieces → Match wardrobe → Choose outfit → Shop/save.
- Meet WCAG 2.2 AA intent: semantic headings/forms, keyboard operation, visible focus, meaningful image alternatives, non-color status cues, adequate contrast, reduced-motion support, and accessible validation/error announcements.
- Every flow includes loading, empty, error, success, and retry states. Preserve edits on recoverable provider failures.
- Use concise copy that distinguishes facts (“you own this”) from suggestions (“similar option”) and inference (“likely cotton texture”).

## 12. Technical architecture and integrations

- **Frontend and server:** Next.js App Router with TypeScript. Server Components are the default; use Client Components for upload/selection interactions. Keep route files thin and feature logic within feature modules.
- **Database and storage:** Supabase PostgreSQL with migrations as the schema source of truth and private Storage for images when enabled. Validate server inputs with Zod and use generated database types.
- **AI:** server-side provider adapter for Muse image understanding, Gemini text generation, and optional Gemini image generation. Keep keys out of the browser. Validate structured output and apply timeout, retry limits, and clear unavailable/error states.
- **Shopping search:** server-side SERP adapter. Normalize provider results into a stable internal shape, preserve original attribution, sanitize destination URLs, and record retrieval time.
- **Environment:** use server-only environment variables. The user supplied `GEMINI_MODEL=gemini-1.5-flash` and `GEMINI_TEXT_MODEL=gemini-3.8-flash`; keep model IDs configurable and verify provider support before enabling. Never commit real keys. Muse/SERP variable names should follow the selected provider's documentation and `.env.example` should contain placeholders only.
- **AI boundaries:** do not send profile fields not needed for a request. For capsule generation, send wardrobe text and item IDs as requested; avoid uploading wardrobe images unless a separately justified feature requires them.
- **Jobs:** use a real provider async/polling workflow or bounded request lifecycle. Do not assume a Vercel request can run indefinitely or that a persisted `queued` row executes work.

### Repository-specific demo constraints

- Current repository instructions define a **no-auth, single shared demo workspace**. All visitors can change the same synthetic demo dataset; it is not a private wardrobe. Make this visible in the interface and do not promise user ownership or privacy.
- Obtain `STYLORA_WORKSPACE_ID` only from server environment; never accept it from request data. Apply it to every parent and child query.
- Supabase access remains server-only. RLS is enabled and direct `anon`/`authenticated` access to internal tables is denied. The server secret bypasses RLS, so server query scope must be tested independently.
- Do not accept sensitive personal uploads into this shared demo. Defer body-photo try-on until authenticated ownership, consent, private storage, retention/deletion, and provider handling are designed.
- AI providers that are not configured must be reported as unavailable. Demo/sample results must be labeled as sample data, not real provider output.

## 13. Success metrics

### Hackathon demo signals

- A first-time user can reach a saved outfit from the landing page without assistance.
- At least one wardrobe match/alternative/missing classification is visible and understandable.
- Each of the three outfit options includes a specific rationale and lists applied user inputs.
- The user can correct a detection or replace a garment before saving.
- A saved wardrobe item/look persists after reload in the configured demo workspace.
- Shopping results, if enabled, show source links and the available value factors; no results are fabricated.

### Follow-up product metrics

- Upload-to-reviewed-analysis completion rate.
- Share of recommendations accepted, edited, or dismissed.
- Outfit save rate and repeat use of existing wardrobe items.
- Shopping click-through for missing pieces and use of value-score controls.
- Capsule combinations created per wardrobe item and user-reported usefulness.
- Provider failure/latency and cost per completed analysis.

Do not optimize purchases as the only success outcome; wardrobe reuse and recommendation usefulness are core outcomes.

## 14. Seven-hour execution plan

The repository's existing four-developer sprint plan is the execution baseline. Prioritize the user-facing story while protecting its already-defined persistence and workspace boundaries.

| Time | Outcome |
| --- | --- |
| 0:00–0:30 | Confirm demo workspace, env/provider availability, data schema, route contracts, owners, and sample data. |
| 0:30–2:00 | Responsive shell/landing, wardrobe metadata CRUD, preferences basics, and persistent Supabase foundation. |
| 2:00–3:00 | Create/save/reopen look using wardrobe items; this is the persistence milestone. |
| 3:00–4:30 | Inspiration upload/review and wardrobe matching, with manual fallback. |
| 4:30–5:30 | Three explained outfit cards; add live AI only if the adapter and structured output are ready. |
| 5:30–6:00 | SERP shortlist and transparent value factors if credentials and time permit; otherwise show a labeled provider-unavailable state. |
| 6:00–7:00 | Feature freeze, responsive/accessibility pass, smoke checks, demo reset/runbook, and honest handoff of deferred features. |

**Scope guard:** if saving and reopening a look is not stable by hour 3, stop feature expansion and finish that path. Capsule, public sharing, and try-on are not allowed to destabilize the core demo. The sprint plan's named file ownership and single migration owner remain in effect.

## 15. Acceptance criteria

### P0 product acceptance

- Landing page explains the value and offers upload plus a sample/demo path.
- A supported image can be selected, previewed, replaced, and submitted with useful validation/error feedback.
- Analysis output is schema-valid and editable, with uncertainty/source displayed where applicable.
- Each detected piece maps to an owned match, wardrobe alternative, or missing state, with an understandable reason.
- Three distinguishable outfit options are available; each has a title, item list, “Why this?” rationale, and profile-input disclosure.
- User can replace a piece, save a selected look, and reopen it after reload.
- Shopping links are provider-sourced and sanitized; value factors are visible. If unavailable, the UI says so and does not create fake listings.
- App supports narrow mobile and desktop widths, keyboard navigation, focus indicators, and accessible validation/status feedback.

### Engineering and data acceptance

- TypeScript strictness and server-side Zod validation are maintained.
- No Supabase secret, Muse/Gemini key, or SERP key is exposed in client bundles or logs.
- Every Supabase read/write is scoped to the server-configured workspace, including relation tables; clients cannot select another workspace.
- Direct anon/authenticated Data API access to internal tables is denied by RLS.
- Upload constraints and private storage rules are enforced server-side when upload is enabled.
- AI and SERP provider failures, timeouts, invalid results, and missing configuration have explicit, recoverable UX.
- Tests/checks are reported with actual results; placeholders and seeded demo content are never described as end-to-end integrations.

## 16. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| AI invents visual details or garment attributes | Structured schemas, confidence/provenance, human review, editable fields, conservative language. |
| Demo scope exceeds seven hours | Prioritized P0, hour-3 persistence checkpoint, feature freeze, manual/sample fallback with clear labels. |
| Shared no-auth demo exposes or overwrites visitor data | Synthetic data only, clear shared-workspace notice, no sensitive uploads, server workspace scoping, separate snapshot sharing contract. |
| Recommendations encode body/skin bias | Optional self-selected context, preference-first matching, inclusive illustrations, neutral copy, user controls, no inferred body/skin attributes from inspiration images. |
| Product listing is stale, incomplete, or misleading | Provider attribution, retrieval timestamp, only display returned fields, explain score, no invented stock/price. |
| Try-on image is sensitive or misleading | Defer personal photos in demo; require consent, private handling, deletion, and limitations before release. |
| Provider timeout/cost causes a broken flow | Server-side timeout and bounded retry, manual edit/continue path, configurable model/provider, explicit unavailable state. |

## 17. Open decisions for implementation

- Which Muse API endpoint and response schema are configured for image understanding?
- Which SERP provider, marketplace region, currency, and result fields are available?
- Is Gemini text generation and image generation enabled separately, and are the supplied model IDs supported by the selected account/API?
- Which sample inspiration and synthetic wardrobe records are approved for the demo?
- Which P0 integrations are live by hour 3, and which are explicitly represented as unavailable/sample states?

These decisions must be reflected in environment examples and the demo handoff; secrets and private user information must never be added to the repository.

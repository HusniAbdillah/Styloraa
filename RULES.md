# Stylora product and engineering rules

These rules apply to every feature in `PRD.md`. `AGENTS.md` adds repository execution and security requirements; `TASK.md` assigns ownership.

## Product scope and language

- All PRD features are in scope for the seven-hour hackathon. Organize parallel work; do not describe the target as an MVP or move requested features to a later release.
- The project language is English for product documents, interface copy, code comments, commit messages, and handoffs.
- Keep the experience responsive from mobile widths through desktop. Design every flow with loading, empty, success, error, and retry states.
- Explain recommendations in clear language and provide controls to edit, replace, dismiss, or correct them.

## Fashion recommendation quality

- Every AI suggestion includes a concrete **Why this?**, the inputs used, and uncertainty where appropriate.
- Ground reasoning in relevant garment attributes: color relationships, style, fit/volume, silhouette/proportion, texture, layering, occasion, season when known, and wardrobe availability.
- Treat skin depth, undertone, body shape, and fit as optional self-selected preferences. Never infer these from an inspiration screenshot or imply one body shape is wrong for an outfit.
- Distinguish visible/detected facts, user-entered facts, inferred attributes, and external catalog values. Users can correct detections and preferences.
- Recommend wardrobe reuse before purchases. Capsule suggestions should explain versatility and likely reuse; never claim cost-per-wear without price and wear data.

## AI, shopping, and preview integrity

- Call Muse, Gemini, image generation, and SERP providers only from server code. Validate provider output against typed schemas and set bounded timeouts/retries.
- Show live provider success only when a real request returned valid data. Label sample data visibly; show unavailable/errors honestly and allow manual editing/continuation.
- Preserve SERP source attribution and returned fields. Sanitize outbound URLs. Do not invent prices, ratings, reviews, stock, links, or freshness.
- Make Value Score factors and weighting visible; allow the user to favor price, rating, or relevance. Do not equate the lowest price with best value by default.
- Try-on supports single-item and combination selection, replacement, consent, limitations, status, retry, and deletion. Use a non-identifying model/illustration in the shared demo; do not accept personal model photos.

## Privacy and shared demo

- The current app has no authentication and one shared workspace. Every visitor can see/change the same synthetic wardrobe and profile data. Preserve this contract in deployment documentation and relevant data-handling context; the current design omits persistent Shared demo / Sample content banners. Never promise private or per-user storage.
- Never use real personal wardrobe/profile content in the shared demo. Do not accept sensitive images. Inspiration uploads must be limited to non-sensitive outfit references and processed/stored through the approved server path.
- Social Fit uses a separate, minimal snapshot with a random token, explicit user review, revocation, and no profile/private storage paths. Never grant direct public database access to internal tables.
- Do not add authentication or claim per-person ownership without an explicit product scope change.

## Technical quality

- Use Next.js App Router, strict TypeScript, Server Components by default, and thin route files. Put feature logic in its owning `src/features/<feature>` area.
- All Supabase calls and secrets remain server-only. Read the fixed workspace ID from server environment and apply it to every aggregate and child query.
- Validate server mutations with Zod. Keep RLS enabled and deny direct `anon`/`authenticated` access to internal tables; audit server workspace predicates independently because the secret key bypasses RLS.
- Migrations are schema source of truth. Owner 1 coordinates migrations and generated types; never hand-edit generated types or edit migrations already used by teammates.
- Keep secrets out of source, client bundles, logs, and docs. `.env.example` contains names/placeholders only.
- Do not add ORM/state manager/queue/SDK or abstraction layers without a concrete requirement. A queued database record is not a running job; Vercel requests are not durable workers.
- Use semantic HTML, visible focus, labels, keyboard access, non-color status indicators, adequate contrast, and reduced-motion support.

## Collaboration and verification

- Follow ownership and shared-contract checkpoints in `TASK.md`. Coordinate shared files before editing.
- Do not commit, push, deploy, provision paid cloud resources, or mutate remote data unless the user explicitly authorizes it.
- Run `make check` and `make build` when implementation changes need verification; run local Supabase reset/types/database tests only in a disposable local stack.
- Record actual command results, environment limitations, and unverified integrations in `PROGRESS.md`. A placeholder, unit test, or build is not proof of an end-to-end feature.

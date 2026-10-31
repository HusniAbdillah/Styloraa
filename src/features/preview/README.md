# preview

Owner: Developer 4. One responsive template serves item, owned-look and capsule
outfit preview routes. See `docs/owner4-implementation.md` for route coverage.

- `schema.ts`: job creation validation (consent + limitations acknowledgment
  are mandatory literals).
- `repository.ts`: server-only composition builders for item/look/outfit
  previews, plus preview job create/read against `ai_jobs kind='preview'`.
- Visual try-on generation is a separate provider and stays unavailable:
  POST preview returns honest 503 and creates no job row. Status/result
  reads work against rows once that provider is live. Polling starts only
  after a real job is returned, has backoff/time bounds and stops at terminal
  states. Results use scoped private assets, not arbitrary provider URLs.

Preview pages never claim AI output. A replaced garment marks old results
stale. Terminal-result deletion removes the scoped private image and job;
active jobs cannot be silently canceled. No fixture preview image is displayed.

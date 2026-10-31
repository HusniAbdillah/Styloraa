# Inspiration analysis

Owner: Owner 2. Not implemented yet; upload, analyze, review, and correct inspiration outfit pieces.

Add `schema.ts` for the Zod contract, server-only `repository.ts` for data,
`actions.ts` when needed, and `components/` for real needs. Keep routes in
`app/` thin. Do not create empty folders or service layers that only forward
arguments.

All database access uses the server workspace ID. Never accept a workspace
ID from the browser. Never import repositories or secrets into Client
Components.

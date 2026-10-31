# Sharing / Social Fit

Owner: Owner 3. Not implemented yet; share an allowlisted snapshot with an unguessable, revocable token.

Add `schema.ts` for the Zod contract, server-only `repository.ts` for data,
`actions.ts` when needed, and `components/` for real needs. Keep routes in
`app/` thin. Do not create empty folders or service layers that only forward
arguments.

All database access uses the server workspace ID. Never accept a workspace
ID from the browser. Never import repositories or secrets into Client
Components.

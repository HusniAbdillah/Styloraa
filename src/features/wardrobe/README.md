# Wardrobe

Owner: Owner 1. First reference implementation for other feature data access.

- `schema.ts`: validation for client-submitted input.
- `repository.ts`: server-only; workspace always comes from the environment.
- `actions.ts`: validation, write gate, safe responses, route invalidation.
- `components/`: server screen and client form with pending/error states.

Currently supports adding and listing metadata only (newest 100 items).
Update, delete, pagination, and image support are not implemented. The form
does not accept a workspace ID. All visitors share the synthetic demo data,
with no account identity. Owner 1 coordinates related migrations and
generated database types.

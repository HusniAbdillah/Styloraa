# Wardrobe

Owner: Developer 2. First reference implementation for other features.

- `schema.ts`: validation for client-submitted input.
- `repository.ts`: server-only; workspace always comes from the environment.
- `actions.ts`: validation, write gate, safe responses, route invalidation.
- `components/`: server screen and client form with pending/error states.

Currently supports adding and listing metadata only (newest 100 items).
Update, delete, pagination, and upload are not implemented. The form does
not accept a workspace ID. All visitors share the demo data, with no
account identity.

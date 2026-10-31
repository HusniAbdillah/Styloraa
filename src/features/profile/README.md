# Profile

The profile stores one shared demo display name on the workspace's existing
`user_preferences` singleton. It is a workspace label, not a per-visitor
identity.

- `schema.ts` trims the name, limits it to 80 characters, and maps blank input
  to `null` so visitors can clear it.
- `repository.ts` reads and updates only `display_name` and `updated_at`, always
  scoped to the workspace from server configuration. It avoids upserting over
  the other preference fields.
- `actions.ts` validates the submitted value and honors `DEMO_WRITES_ENABLED`.
- The profile route reads the server record and wires the name form to the
  server action.

The additive `user_preferences.display_name` migration is recorded and applied
to the production Supabase project.

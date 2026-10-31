# Preferences

Owner 1 backend implementation for the shared demo workspace.

- `schema.ts` defines bounded, optional Zod contracts for Style DNA, fit, and
  self-selected body-shape, proportions, and illustration references. Unknown
  keys are stripped and empty objects mean skipped or reset.
- `repository.ts` reads and updates the workspace singleton using only the
  server environment's `STYLORA_WORKSPACE_ID`. Its partial update preserves
  the shared profile display name.
- `actions.ts` parses the three JSON sections, validates them server-side,
  enforces `DEMO_WRITES_ENABLED`, and invalidates preference consumers after a
  successful save.

The preferences route reads this record and submits the three validated
sections through the server action. Clearing the form fields and saving stores
empty objects for the skipped sections.

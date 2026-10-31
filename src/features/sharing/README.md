# Sharing backend

Owner 3 publishes an existing immutable saved-look snapshot. The database trigger
constructs its public allowlist; the backend independently validates and strips
unexpected fields before serving a public response.

| Endpoint                                    | Contract                                                                                                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/saved-looks/:savedLookId/shares` | JSON `{ catchphrase?: string, expires_in_hours?: number }`; defaults to an empty catchphrase and 168 hours. TTL is 1-720 whole hours. Returns 201 with `share_id`, one-time `share_token`, relative `path`, and `expires_at`. |
| `DELETE /api/shares/:shareId`               | Revokes the workspace-scoped link. Returns `{ revoked: true }`, including repeated revocation.                                                                                                                                |
| `GET /api/shared/:shareToken`               | Returns `{ public_snapshot: { title, source_type, items: [{ name, category, color, kind }] }, catchphrase }`. Invalid, missing, expired or revoked links return the same 404.                                                 |

All Supabase access stays server-only and includes the server workspace, including
public lookup. Raw tokens are returned only when a link is created; database lookup
uses SHA-256. Public responses exclude workspace/internal IDs, provider metadata,
private paths, signed URLs and personalization fields. Responses use `no-store`.
Never log tokens. Relative share paths avoid trusting an incoming Host header.

Writes require the existing shared-demo write gate. This remains a no-auth shared
workspace: revocation is available to every visitor with the same app capabilities,
not a private per-user sharing system. No database grants or migrations are changed
by this module. The public page UI is a separate integration task.

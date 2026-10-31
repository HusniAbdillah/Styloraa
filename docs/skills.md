# Skills and agent work

Skills support the agent process; they are not runtime dependencies. Each
developer's install may differ. Keep project instructions in `AGENTS.md`; do
not copy global skill caches, credentials, or personal account configs into
the repository.

| Work                                   | Relevant skill                              | When                                                              |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Database, RLS, migrations, Storage     | `supabase:supabase`                         | Before database implementation and verification                   |
| Query/index/constraint                 | `supabase:supabase-postgres-best-practices` | When a query/schema review needs guidance                         |
| Cloud linking/environment              | `vercel:bootstrap`, `vercel:env-vars`       | When provisioning real Vercel resources                           |
| Preview/CI/promotion                   | `vercel:deployments-cicd`                   | When setting up or doing deployments                              |
| Vercel CLI                             | `vercel:vercel-cli`                         | Before relying on the platform CLI                                |
| Multiple TSX components                | `vercel:react-best-practices`               | Reviewing hooks, accessibility, client/server boundaries          |
| Failing flows                          | `vercel:verification`                       | Tracing browser → server → data → response                        |
| AI provider                            | SDK/provider skill matching the chosen library | After the provider is agreed, not because an SDK exists        |
| Audit/design                           | Product Design, Mobbin, or Figma per task   | When a design task needs it; folder setup alone never requires visual exploration |
| UI Craft & Anti-Slop                   | `.agents/skills/antislop`                   | Saat membuat atau mereview UI, copywriting, dan palet warna        |
| Design Engineering & Motion            | `.agents/skills/design-engineering`         | Saat mendesain interaksi, animasi snappy, dan pemilihan UI library |

Read current official docs for fast-changing APIs and match them against
the lockfile versions. No auth skill is needed for the login-free scope.
Skills are not a reason to add auth, another database, or cloud operations
outside the user's scope.

For Next.js on Vercel, use the default Node.js runtime first. Skills or
examples using another runtime/queue/database do not instruct replacing the
project architecture. When adding skills, review their scope and source; do
not store MCP tokens or personal account configs in the shared repo.

## Agent task format

```text
Goal: concrete, reviewable outcome.
Edit areas: files/folders owned by the task.
Contract: agreed schema/payload/env.
Limits: shared files and remote operations outside the task.
Verification: relevant checks and runtime evidence.
Handoff: changes, check results, limits, remaining steps.
```

Example: the wardrobe agent builds forms and queries in the wardrobe
module, uses the fixed server workspace, and sends migration needs to the
database owner. The agent does not create alternate tables or drop query
scope to make tests pass. Do not add more agents than the independently
reviewable areas.

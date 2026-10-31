# Owner 1 Frontend Implementation Plan

**Scope:** Frontend work for Wardrobe first, then Preferences and Profile. This
plan does not implement backend behavior, add migrations, change shared shell
ownership, or implement other owners' screens.

**Product contract:** one identity-less shared demo workspace. All visitors see
and can change the same wardrobe/preferences/profile values. Do not imply user
accounts, private ownership, or per-person profile data.

## 1. Sources and current frontend baseline

- Product and ownership: `PRD.md`, `TASK.md`, `docs/architecture.md`, and
  `docs/sprint-plan.md`.
- Active design: revision 2 in `docs/design/streamlined-v2.md` and
  `docs/design/v2-handoff.md`. Figma metadata was inspected for the active
  frames: desktop Wardrobe `44:325`, mobile Wardrobe `44:830`, desktop item
  editor `45:611`, mobile item editor `45:1173`, desktop Preferences `44:549`,
  and mobile Preferences `44:987` in file
  `ta9JYu4Q7fLWeuu0PJgWhp`.
- Wardrobe is a collection page. Item add/edit is a contextual editor, not a
  new primary destination. On desktop, preserve the workspace navigation and
  use the design's editor surface. On mobile, use the full-screen editor/sheet
  pattern. Do not add manual matching or wardrobe-alternative pages.
- `TASK.md` also assigns `/profile`, but the active revision-2 Figma frame set
  does not include a Profile page. Keep the existing simple shared-name page;
  do not invent an account/profile system or a new visual direction.

Current code is a functional starting point, but it does not yet match the
intended interactions:

- `src/app/(workspace)/wardrobe/page.tsx` parses URL filters and renders
  `WardrobeScreen`.
- `src/features/wardrobe/components/wardrobe-screen.tsx` shows cards, a
  GET search/category form, pagination, and an add form in a side column.
  It currently uses the same empty panel for an empty collection and a filter
  with no matches.
- `wardrobe-item-controls.tsx` puts edit, image, remove, and archive forms
  directly under every card. The Figma design uses an item editor surface.
- **P0 integration gap:** `wardrobe-item-controls.tsx` submits the whole image
  through `uploadWardrobeImage` as a Server Action. This bypasses the newer
  prepare → signed Storage upload → finalize HTTP flow, and the request can
  exceed Vercel's 4.5 MiB function body limit despite the 10 MiB bucket limit.
- Current Wardrobe search filters item `name` only; category is a separate
  filter. Figma's search hint says “Name, color or category.” Do not display
  that broader promise until the backend search contract supports it. Raise a
  small contract proposal to the backend owner before enabling color/category
  free-text search.
- Preferences currently use comma-separated text inputs and free-text body
  references. The page works but should be shaped into the active design's
  optional visual selections and body-guide context.
- Profile currently edits one shared `display_name`. Keep that narrow
  behavior and its explicit shared-workspace wording.
- Vitest is configured for Node and includes `src/**/*.test.ts`. There is no
  installed Playwright or Testing Library browser/component stack in
  `package.json`; do not add one without a concrete need and owner agreement.

## 2. Stable frontend-to-backend contract

### Wardrobe

- Use the existing server-rendered `/wardrobe` page and server-owned
  `WardrobeScreen`; do not create a browser Supabase client.
- Page data comes from `listWardrobePage` with `search`, `category`, `limit`,
  and `offset`. It applies the configured workspace, excludes archived rows,
  orders newest first, and returns `items` plus `total`. The shared inventory
  API `listWardrobeItems` continues to return an array for Capsule/Preview
  consumers. Use query parameters as the shareable source of filter/page state.
- Item form fields supported by the current schema are `name`, `category`,
  `color`, optional `subcategory`, optional `notes`, and optional `attributes`.
  The current category set is `top`, `bottom`, `dress`, `outerwear`, `shoes`,
  and `accessory`. Do not edit AI inference/provenance fields as user facts.
- Add/edit/archive continue through the existing Server Actions and their
  `WardrobeActionState`. Keep Zod validation server-side and call
  `router.refresh()` or rely on the action's `revalidatePath` so cards reflect
  persisted state.
- Image client flow must use the existing handlers:
  - `POST /api/wardrobe/{itemId}/image-uploads` with `{ mimeType, byteSize }`;
  - upload the selected bytes directly to the exact returned signed URL/token,
    without a browser Supabase client or secret key;
  - `POST /api/wardrobe/{itemId}/image-uploads/{assetId}/finalize` with the
    expected prior `assetId` (or `null`).
- The backend owns the 10 MiB limit, JPEG/PNG/WebP allowlist, byte signature,
  item/workspace scope, and replace compare-and-set. Preserve the current
  image until finalize succeeds. Never store a signed URL/token in UI state
  beyond the upload attempt or persist it as an image identity.
- Image read uses the server-generated signed URL returned while rendering.
  If it expires or fails, offer a retry by refreshing the server data; do not
  render a permanent/public bucket URL.
- Archive is a soft delete; the UI must say it removes an item from the active
  wardrobe while preserving linked history. Image removal is distinct from
  item archive.

### Preferences and Profile

- Preferences read/save fields in `user_preferences`: `style_dna`,
  `fit_preferences`, and `body_profile`. Current nested contract supports
  style tags, color families, contrast, user-selected undertone/skin depth,
  fit, coverage, preferred lengths/layering, and optional body shape,
  proportions, and illustration reference. Empty selection saves `{}`.
- Profile reads/saves nullable `user_preferences.display_name`; it is a shared
  workspace label. Saving profile must not overwrite preference JSON and
  saving preferences must not overwrite the profile name.
- All writes require the configured server write gate. Disabled writes need a
  clear, non-error message; the browser never decides workspace scope.

## 3. Ordered work plan

Each phase is a merge gate: complete its focused checks, then pass its
integration checks against the previously completed phases before proceeding.
Use synthetic content. Any hosted UI verification must point the running app
at a disposable workspace, never the shared demo workspace.

### F0 — Contract and screen-state inventory

**Small tasks**

1. Confirm the Owner 1/backend branch contract and the exact props/action
   states currently returned; do not edit backend-owned files during frontend
   work without a reviewed proposal.
2. Record desktop/mobile behavior for Wardrobe, item editor, Preferences,
   body guide, and Profile. Keep Profile based on its existing route because
   the active Figma set has no Profile frame.
3. Agree whether Wardrobe search remains name-only plus category filter or
   whether backend search expands to color/category. Keep page controls honest
   until that contract is settled.
4. Establish screenshots/manual browser checklist at 1440px and 1280px desktop,
   and 390px and 360px mobile. Respect existing palette/type tokens and avoid
   adding dependencies.

**Focused checks**

- Review route-to-component data path and URL filter parsing.
- Confirm no browser Supabase client/secret and no new route/table are planned.
- Review Figma frame inventory against active revision-2 docs.

**Integration checks**

- Load `/wardrobe`, `/preferences`, and `/profile` with database unconfigured
  and configured-but-read-only settings; verify server pages remain renderable
  and explain the write-disabled state.
- Reconfirm no current feature consumer depends on a Profile account or a
  manual matching page.

**Exit gate:** written data/interaction contract and state list approved by
the Owner 1 backend owner; no schema/dependency conflict.

### F1 — Wardrobe collection and navigation states

**Small tasks**

1. Reshape collection header, “Add item” entry point, search/filter row and
   garment cards to active desktop/mobile frames. Preserve readable content
   width and mobile's two-column item grid where card content fits.
2. Keep search/category/page in URL state. Reset offset to zero when search or
   category changes. Keep previous/next links preserving the other filters.
3. Separate these states: first-visit empty wardrobe, no results for current
   filters, loading, data/configuration error, read-only/disabled writes, and
   populated list. Empty wardrobe can link to add-item; no-results offers
   clear filters.
4. Cards show real persisted image or a neutral image placeholder, item name,
   category/subcategory and available color/details. Avoid static Figma
   garment illustrations as if they were stored user data.
5. Add a per-card editor trigger with an accessible item-specific name. Avoid
   nesting multiple independent mutation forms in the card.

**Focused checks**

- Verify filter URL parsing for valid, missing, malformed, long, and combined
  search/category/page values.
- Test empty vs filtered-empty vs error vs database-not-configured rendering.
- Test total count and pagination labels at 0, 1, 24, 25 and a later page.
- Check semantics: one page `h1`, card headings, labeled filter inputs,
  keyboard-submittable search, visible focus, and disabled page controls.

**Integration checks**

- Against the hosted Owner 1 fixture, add an item, reload, search it, filter by
  category, paginate when enough fixture rows exist, clear filters, and confirm
  only active workspace items appear.
- Confirm forged `workspace_id` query values do not change the displayed scope.
- Confirm archive and image/profile state from previous/next gates is not
  changed by filter navigation.

**Exit gate:** desktop/mobile collection screens match the active frame intent;
URL filters and four primary states are verified against actual backend data.

### F2 — Contextual item editor: create, edit, archive

**Small tasks**

1. Replace the always-open add form/inline card forms with an editor opened from
   the collection. Use desktop contextual editor behavior and a mobile
   full-screen sheet; keep route/back state stable with the selected item and
   filters.
2. Build the create dialog with required name, category, color, and clothing
   photo fields; subcategory and notes are optional. Show Save changes only
   after the photo upload succeeds and place it after the upload controls. Keep
   the existing editor for edits and supported attributes.
3. Show upload and save pending/result states. Disable duplicate submissions
   while pending and preserve entered details after validation/network failure.
4. Add explicit cancel/close and archive action. Confirm archive if the current
   design/system supports a confirmation dialog; do not silently hard-delete.
5. After a successful save/archive, close the editor, refresh the collection,
   preserve search/category where useful, update count, and focus the trigger or
   a predictable next item.

**Focused checks**

- Create an item with an uploaded photo; reject missing name/category/color,
  missing photo, and invalid category; verify field errors/status announced to
  assistive technology. Subcategory and notes may remain empty.
- Pending state prevents repeated submission; success state closes/refreshes;
  failure state keeps form contents.
- Archive asks for a clear user action, removes item from active results, and
  uses archive language rather than permanent delete language.
- Keyboard open/close, focus entry/return, Escape handling, and mobile sheet
  scroll behavior.

**Integration checks**

- Create → close → reload → find item; edit → close → reload → see new values;
  archive → item disappears but its stored history remains.
- Keep list filters/pagination stable through editor open/cancel and after
  refresh. Confirm preferences/Profile are unaffected by wardrobe mutations.

**Exit gate:** create/edit/archive completes through actual Server Actions and
hosted persistence with recoverable success, error, pending, and conflict/not
found feedback.

### F3 — Wire the item editor to signed image upload

**Small tasks**

1. Remove the editor's 10 MiB binary Server Action upload call from the user
   flow. Use the prepare → direct signed upload → finalize API contract above.
2. Client validates quick metadata for immediate feedback, while treating
   server validation as authoritative. Accept JPEG, PNG and WebP up to 10 MiB;
   show unsupported type, empty/oversize and upload/finalize failures inline.
3. Track stages separately: preparing, uploading, finalizing, complete,
   conflict, failed/expired. Use a real accessible progress element if browser
   upload progress is available; otherwise present an honest indeterminate
   busy state. Never claim percent progress that is not measured.
4. Keep current image visible until finalize returns success. On 409 conflict,
   refresh the item and offer retry; do not silently replace a newer image.
   On signed-token expiry, restart with a fresh prepare response.
5. On success, refresh server-rendered image URL and close/retain the editor
   according to the Figma flow. On remove-image, refresh to placeholder and
   retain the metadata item. Keep retry-cleanup messaging sanitized; do not
   expose object paths, URLs or tokens.

**Focused checks**

- Test each UI upload stage and server responses: prepare 400/403/404/503,
  upload network failure, expired signed upload, finalize 409/422/503, remove
  image, retry, and success.
- Verify input state behavior for selecting the same file twice, replacing an
  image, canceling the picker, and closing/reopening the editor.
- Verify keyboard and screen-reader announcement of stage, error and progress;
  keep actions reachable on a 360px viewport.

**Integration checks**

- On a disposable hosted workspace, upload PNG and the maximum 10 MiB image
  through the browser/UI to the real signed URL; finalize, reload, and read the
  image. Confirm the secret is never sent to the browser.
- Replace image A with B; confirm B displays only after finalize and the old
  image retires safely. Remove image, reload, and confirm metadata remains.
- Simulate a failed upload/finalize and recover without creating a false
  success state; keep the old image linked until the successful compare-and-set.

**Exit gate:** browser form uses the signed route, not the binary Server Action;
10 MiB upload and replace/remove succeed against hosted Storage; all errors
remain recoverable and no token/path is displayed or persisted by the UI.

### F4 — Preferences / Style DNA controls

**Small tasks**

1. Replace raw comma-separated preference entry with clear optional selections
   that match the active Preferences frames: style direction, colors,
   fit/coverage, and a Body guide entry point. Reuse existing backend values;
   do not invent an enum or new stored field in frontend scope.
2. Represent style tags/color families/fit/coverage/length/layering as labeled
   selectable options or removable chips where the design calls for choices.
   Keep any freeform entry bounded and clearly optional only if it maps to the
   existing schema.
3. Keep contrast, undertone and skin-depth choices optional, neutral, and
   explicitly user-selected. Provide skip/unsure/clear choices. Never infer
   these values from a garment or body photo.
4. Present optional body-shape/proportions/illustration values in an inclusive
   body-guide context; preserve clear/reset. Do not require a binary gender or
   imply a correct body type.
5. Provide saving, saved, validation/network error, disabled-write and clear
   states. Clearing sends empty objects through the existing action.

**Focused checks**

- Each selection toggles and serializes to the current schema; remove and clear
  return the UI to the skipped state.
- Save failure retains selections; success reflects persisted values after
  refresh. Distinguish unsaved form state from saved state.
- Keyboard operation for chips/cards (button semantics, `aria-pressed` where
  appropriate), visible focus, clear labels, reduced motion and mobile scroll.
- Verify neutral wording, skip controls, and no image-based inference claims.

**Integration checks**

- Hosted flow: read initial preferences, change style/fit/body values, save,
  reload, clear, reload; values remain optional and clear to `{}`.
- Save/clear preferences while changing Profile name and verify each update
  preserves the other fields.
- Confirm recommendation consumers receive only persisted optional values;
  do not create recommendations or new AI UI in this phase.

**Exit gate:** Preferences matches the active desktop/mobile intent and saves
all current schema fields without blocking a user who skips them.

### F5 — Profile shared label

**Small tasks**

1. Keep the existing `/profile` shared display-name form. Improve only status,
   validation and responsive presentation needed for consistency with the
   workspace shell.
2. Make the shared-workspace disclosure visible near the control; do not use
   “your personal account” or imply that the name identifies an authenticated
   user.
3. Support save, clear, disabled-write, pending, success and recoverable error
   states using the existing action.

**Focused checks**

- Save trimmed name, clear name, reject too-long/invalid input, preserve entered
  text after errors, prevent duplicate submit, and announce status.
- Verify form labels/focus and mobile width/keyboard behavior.

**Integration checks**

- Save Profile name → refresh `/profile` and `/preferences`; verify it persists
  and preference JSON is unchanged. Clear name and repeat.
- Confirm other visitor sessions see the same shared value, if a second browser
  is available; do not call this per-user data.

**Exit gate:** profile label persists across pages without account/privacy
claims and without overwriting preferences.

### F6 — Integrated regression and handoff

**Small tasks**

1. Walk through collection → add item with photo → edit → replace image →
   remove image → archive; then Preferences save/clear and Profile save/clear.
2. Check all pages in read-only mode, no-data mode and after online fixture
   cleanup. Confirm no demo shared workspace record was changed.
3. Verify desktop at 1440px/1280px and mobile at 390px/360px, including long
   page scroll, no horizontal overflow, item editor sheet, and all controls
   reachable without a covering fixed footer.
4. Update feature docs and this plan with actual outcomes and limits. Do not
   claim deployment/browser proof from Vitest or a successful build alone.

**Focused checks**

- `pnpm check`; `pnpm build`; `pnpm exec prettier --check` on edited files;
  `git diff --check`.
- Run existing schema/action tests and hosted Owner 1 E2E against a disposable
  workspace. Because the online test is opt-in, run it separately with its
  explicit environment flag and remove fixtures afterward.
- Perform browser verification using the project's available browser/manual
  path. There is no Playwright/Testing Library setup at plan creation; request
  agreement before introducing either dependency for automated UI tests.

**Integration checks**

- Re-run the full Wardrobe → Preferences → Profile flow after all UI changes,
  with refresh/navigation between operations and a foreign-workspace fixture.
- Verify frontend values survive page transitions/reload and remain aligned
  with server response; no stale optimistic state or unrelated field overwrite.
- Confirm the app makes no browser data-table requests, no key/token appears in
  browser logs, and all tests use isolated synthetic data.

**Exit gate:** all F1–F5 focused and integration checks pass; record anything
blocked by unavailable browser/deployment as unverified, not passed.

## 4. Cross-cutting acceptance checklist

- [ ] Server Components provide initial page data; Client Components are
      limited to forms, upload interaction and responsive editor behavior.
- [ ] No browser Supabase client, service secret, arbitrary client workspace
      ID, signed URL persistence, or private bucket URL.
- [ ] All form values are server-validated by existing Server Actions/routes;
      the UI never treats client validation as security.
- [ ] Every page has loading, empty, read-only, error and saved states where
      applicable; Wardrobe distinguishes empty collection from no filter results.
- [ ] Desktop/mobile behavior follows active revision-2 frames and existing
      project palette/tokens; no new visual system, route, table or dependency.
- [ ] Labels, focus states, keyboard use, status announcements, touch targets
      and reduced-motion behavior are verified.
- [ ] User-entered item attributes remain distinct from AI-inferred metadata;
      optional preferences stay self-selected and clearable.
- [ ] Profile is explicitly one shared display label in a no-auth demo.
- [ ] Each major phase passes focused checks and integration with prior phases.

## 5. Risks and decisions to settle before implementation

1. **Search semantics:** Figma says name/color/category but backend currently
   supports name search plus a separate category filter. Keep the current
   honest control or have the backend owner extend and verify search semantics
   before changing the placeholder.
2. **Signed upload transport:** signed URL/token is returned by the server
   prepare route. Confirm direct browser request method, headers, CORS and
   progress strategy against official Supabase Storage semantics; do not
   introduce a browser Supabase client.
3. **Body guide choices:** current database shape allows bounded strings and
   arrays; any new structured options/enums require a backend contract review
   before changing stored data.
4. **Profile design:** no Profile frame is present in the active Figma frame
   inventory. Retain current page hierarchy until the design owner supplies an
   active Profile frame; avoid scope creep.
5. **Browser automation:** current package has Vitest only (Node environment).
   Agree separately if the team needs a browser automation dependency; until
   then, combine existing automated server/hosted tests with recorded manual
   browser checks.

## 6. Not included

- Backend/schema changes, migrations, generated types, AI matching, owner 2/3/4
  pages, global shell ownership, auth, account management, multi-user data,
  public/personal wardrobe storage, or automated cleanup scheduling.
- Reinstating manual wardrobe matching or the archived page-by-page flow.
- Claiming Figma prototype reactions, unit tests or local build output as
  proof of real hosted browser behavior.

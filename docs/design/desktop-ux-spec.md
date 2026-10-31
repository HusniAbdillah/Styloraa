# Stylora desktop UX specification

**Historical blueprint:** the owner's latest flow is defined by
[revision 2](streamlined-v2.md) and its [Figma handoff](v2-handoff.md).
In particular, do not implement the manual matching or alternative picker
described in this earlier exploration.

This is the planning specification. The later desktop canvas delivery is
recorded in [Figma handoff](figma-handoff.md); historical statements below
about uncreated mockups describe the analysis stage.

Status: analysis and desktop blueprint, not a shipped interface or completed
Figma mockup. Covers every feature in the current full-scope PRD. Read
`DESIGN.md` for visual tokens and `research.md` for evidence and limitations.

## 1. Product model

The central object is a look project: an inspiration image, reviewed garments,
wardrobe matches, three candidate combinations, and one selected outfit.
Shopping, try-on and sharing are actions on that selection. They should not
feel like unrelated applications reached through ten navigation items.

The first useful outcome is understanding how to recreate an outfit with
existing pieces. A purchase is optional. Do not gate saving behind shopping,
profile completion, provider availability, or a generated preview.

## 2. Information architecture

Persistent workspace navigation:

1. Create a look: the active inspiration-to-outfit journey.
2. Wardrobe: reusable garment inventory.
3. Saved looks: complete looks and clearly marked drafts.
4. Capsules: a collection of combinations for a purpose.
5. Style preferences: optional shared defaults and current-look overrides.

Workspace info is a quieter utility destination. It replaces an account
profile label because there is no account. Keep the existing `/profile`
route for compatibility; do not create an avatar/dropdown that suggests login.
Brand/home navigation reaches the landing. The shared public page has its
own minimal shell and no internal wardrobe navigation.

| Surface | Existing route or proposed route/state | Entry and return |
| --- | --- | --- |
| Landing | `/` currently redirects; propose actual landing | Upload or open labeled sample |
| Upload | `/create` | Landing or Create a look |
| Review | `/looks/[lookId]?step=review` proposed | Successful intake; back retains image/edits |
| Match | `/looks/[lookId]?step=match` proposed | Reviewed pieces; back retains corrections |
| Outfit options | `/looks/[lookId]?step=outfits` proposed | Matching complete or manual continue |
| Shopping | `/looks/[lookId]?step=shop` proposed | Selected outfit and selected missing piece |
| Saved detail | `/looks/[lookId]` | Saved looks or capsule; return to origin |
| Wardrobe | `/wardrobe` | Sidebar or match picker |
| Capsules collection | `/capsules` | Sidebar |
| Capsule editor/detail | `/capsules/[capsuleId]` proposed | Capsule collection or saved look |
| Saved collection | `/saved-looks` | Sidebar |
| Style DNA and fit | `/preferences` | Sidebar or optional creation prompt |
| Workspace info | `/profile` | Utility navigation |
| Try-on | Look detail contextual panel; optional `panel=preview` | Selected garment or combination |
| Social Fit composer | Look detail contextual dialog | Share action, then return to look |
| Public Social Fit | `/shared/[shareToken]` | Revocable public snapshot link |

Proposed routes are design contracts, not existing destinations. Production
navigation must only expose implemented destinations or clearly labeled
unavailable surfaces. Do not change URLs purely to mirror module names.

## 3. Shell and spatial system

At 1440px, use a 216px sidebar and 40px main padding, leaving 1144px for
working content. A 64px top bar holds the project title/breadcrumb and a
compact Shared demo disclosure. Do not repeat the same tagline on every page.

The workspace is primarily an editing surface. Use normal document scrolling,
not three independent scroll panes. Sticky preview/summary regions may stay
visible only while their containing section is in view. A sticky action bar
must reserve its own height and stop obscuring content at zoom/short heights.

At 1280px, content padding falls to 24px. Narrow comparison layouts simplify
before labels become cramped. At 1024px, side panels move below the main
surface. At 768px and below, use labeled menu navigation, one-column review,
and a compact step indicator. A 390px acceptance frame is required even
though the first detailed mockups are desktop.

## 4. Landing

**Job:** understand the transformation and start without setup.

Use a restrained top navigation with the wordmark and a workspace entry.
The first composition pairs a 5-column text area with a 7-column visual:
one approved reference image alongside the corresponding garment/outfit board.
The visual must show the product transformation, not a generic stylish person.

Suggested headline: "Recreate the look. Start with what you own."
Primary: Upload inspiration. Secondary: Open sample look. Supporting copy
states supported image types and the shared-demo constraint before intake.
Optional Style DNA is presented after a user starts, not as an onboarding wall.

Below the first viewport, explain the actual review/match/choose process with
one annotated example. Do not add a repeated three-card feature grid when
the example already communicates the process. No invented social proof.

**States:** live upload path, provider unavailable with manual review/sample
entry, loading sample, sample-load error with retry. Sample remains visibly
labeled throughout downstream screens, including saved and shared output.

## 5. Create: image intake

**Focal point:** the image selection area. **Primary action:** Review pieces
(or Analyze image when a real provider is ready).

Use an approximately 7:5 split. Left: drop/select image then a contained
preview. Right: what happens next, the image handling notice, and optional
occasion notes. Keep the file picker visible as an alternative to drag/drop.

Show JPEG, PNG, WebP and a proposed maximum of 10 MiB, consistent with the
current bucket cap; enforce the final contract on the server. Reject SVG,
unsupported formats, corrupt image data and oversized files with field-level
messages. Do not accept arbitrary pasted URLs. A metadata-only wardrobe path
is separate from inspiration intake.

Replace and Remove stay next to the preview. Selecting a new image after
analysis must explain that downstream review/matches will be reset. Confirm
only when meaningful work would be lost. Never silently discard a saved look.

**States:** empty, selected, validating/uploading, upload failed, provider
unavailable, analyzing, partial result, success. Do not imply that selecting
a local file already uploaded it. Explain when provider processing begins.

## 6. Review detected pieces

**Job:** correct machine assumptions before they affect the outfit.

At 1440px, use a roughly 440px inspiration column and a 680px review column,
with a 24px gap. A small numeric marker may connect a garment to its review
row only if localization data really exists. Without boxes, use names and
thumbnails; do not invent visual precision.

Each row shows garment name/category, observed color, apparent fit/texture,
source label and an Edit action. Put uncertain attributes in a plain
"Review needed" note. Expand one row for editing rather than presenting
all garment fields as a giant form. Add piece and Remove piece are available.

Suggested attribution labels: "Detected", "Edited by you", "Sample". In
the shared workspace, "Edited" may be preferable to implying an identity.
Confidence percentages appear only when returned and meaningfully interpreted
by the provider. Do not manufacture a percentage from a styling judgment.

**Primary action:** Match wardrobe. **Secondary:** Back to image.
No optional body/skin questions appear as a blocking step here.

**States:** no garments detected with manual add, partial detection, invalid
provider response, editable sample, unsaved changes and request retry. Retain
the image and valid edits if one detection fails.

## 7. Match wardrobe

Use a vertical comparison list, not an unstructured gallery. Each row contains
the reference piece, its proposed wardrobe garment, a status, and a short
difference note. Same-row comparison makes alternatives understandable.

Owned match means the selected inventory item has been identified as the
desired owned piece; Alternative is a substitute with meaningful differences.
An automatic similarity result must not establish exact ownership by itself.
Keep a confirmation/edit affordance and allow the user to change match type.

Show "Similar ivory color; wider leg" before an expandable attribute list.
Do not reduce this screen to a misleading Match 97% badge. Missing rows have
a meaningful empty slot and Choose wardrobe item / Keep as missing actions.
The picker opens a drawer with category/filter/search and a single-select
confirmation. Returning to it preserves the filter and previous selection.

Empty wardrobe: explain the consequence, allow Add item, sample inventory,
or Continue with missing pieces. Do not demand a complete digital closet.

**Primary action:** Create outfit options. **States:** loading matches,
no candidate, deleted/unavailable garment, manual override, failed request,
partial matching and stale inventory. Counts must derive from current rows.

## 8. Three outfit options

Use three equal comparison columns at comfortable desktop widths, with the
same image area and comparable information order. This equality serves an
actual comparison task; it is not a decorative feature-card template.

The columns are named exactly by their purpose:

- Closest to the inspiration.
- From your wardrobe.
- A fresh alternative.

Each has a garment board, title, owned/alternative/missing labels, a short
reason and Choose this outfit. The selected column receives an Oxblood rule
and checked selection marker, not a large colored background. No automatic
"Best" badge without a defined criterion.

One expanded reasoning area below the selection shows Why this works,
preferences actually used, and uncertainty. Example copy must be labeled
sample until grounded in actual returned items and attributes. Each garment
has Replace. Replacement changes this option only; it invalidates affected
reasoning, shopping queries and generated previews, then lets the user
refresh those results explicitly.

Keep Save look as the main post-selection action. Find missing pieces and
Preview outfit are contextual alternatives. Users can save without buying.

At 1280px, use compact option selectors and one detailed board if three
columns cannot retain readable item labels. Preserve a Compare all view;
do not hide alternative options in an auto-advancing carousel.

**States:** three valid results, partial results, invalid structured output,
manual board, generation unavailable, changed inputs, save pending/failed,
and saved confirmation. Do not render a failed response as three empty cards.

## 9. Shopping and Value Score

**Job:** compare evidence for an explicitly missing piece, not browse an
unrelated catalog. No standalone Shop destination is necessary initially.

Keep the selected missing-piece brief in a 280px context column. The main
region holds product results; filters/weights belong in a compact toolbar
and expandable scoring settings. Switching pieces preserves the chosen look.

Product entries include source, available price/currency, rating AND review
count when returned, retrieval time, and a clear seller link. Missing prices
say Price unavailable. Unknown shipping says Shipping unknown. Do not display
zero as a price, add synthetic ratings, or silently compare different currencies.

Value Score is conditional, not a mandatory number. Define normalization,
weighting and missing-data treatment before displaying it. Rank only among
comparable results for the same garment brief and currency. One missing
factor cannot silently increase a product's score by redistributing its
weight. Recommended: incomplete entries remain unscored and inspectable.
If the provider cannot supply defensible relevance data, use an editable
sort and an attribute match explanation instead of fabricating a score.

When valid factors exist, expose weight controls with labels and numerical
inputs, not sliders alone. Explain rating sample size and distinguish
subjective relevance from observed listing data. "Best value among these
results" must remain scoped to that result set and current weights.

**States:** results, no results, incomplete fields, invalid/unsafe destination,
provider unavailable, stale result, changed weights and unsupported currency.
Open validated seller links with an external-destination indication; preserve
the workspace. No Add to cart or claimed stock unless an integration exists.

## 10. Wardrobe collection and item editing

Use a collection header, Add item action, search field and category filters.
At 1440px, start with four 4:5 garment cells per row; at 1280px use three
or four based on a minimum useful cell width around 220px. A flat card has
image, name and category/color, not a large ornamental container.

Search/filter state belongs in the URL. Provide Clear filters and a useful
zero-results state distinct from an empty wardrobe. The current 100-row
repository limit is not a pagination contract; pagination must be designed
before a larger inventory is implied.

Add/edit opens a 440 to 480px drawer: image optional, name/category/color
first, fit/texture/tags under Additional details. Metadata-only entry remains
a normal path, not a degraded error. Progressive field disclosure avoids
requiring the entire PRD attribute schema for the first garment.

Clicking a garment opens its details; selection mode for matching/capsules
is explicit and uses checkboxes. Do not make one click both select and navigate.
Edit never overwrites the original inspiration-detection evidence silently.

Deletion shows which saved looks/capsules may be affected. The present SQL
uses cascading relation deletes; the PRD expects missing items to remain
understandable. Resolve this data mismatch before promising an unavailable
item state. Use snapshots/tombstones or an agreed alternative migration.

**States:** empty, loading skeletons at stable aspect ratio, populated,
filtered empty, no image, broken image, validation failure, write disabled,
save error, deletion confirmation and shared edit conflict.

## 11. Saved looks and look detail

Saved looks is a collection, not a dashboard. Use outfit boards with title,
occasion if known, source type and status (Draft / Saved). Provide a simple
search and sort only when supported. Separate unfinished drafts visibly.

Look detail uses a large outfit composition on the left and an approximately
360px decision column on the right. The decision column contains the title,
rationale, preferences used and Save changes. Reference image and piece
details are secondary expandable content. Shop, Try-on and Share are contextual
actions for the selected look, not competing primary buttons of equal weight.

Persist wardrobe item references plus enough snapshot data to explain later
changes. Reopening a saved look does not silently regenerate it with a newer
model. Create an editable revision; make unsaved/save-failed/saved explicit.
If another visitor changed a shared record, show a conflict with Reload and
Save as new look rather than silently overwriting it.

**States:** empty collection, draft, saved, unsaved revision, missing piece,
deleted look, sample look, save error and stale shared revision.

## 12. Capsules: collection, brief, selection, results

Collection: understated capsule covers composed from existing garment
thumbnails, name and actual item/combination counts. Create capsule is the
primary action. Do not fabricate wardrobe-efficiency metrics.

Builder: a readable brief column (purpose, optional timeframe/season/occasion,
optional preferences) plus a wider garment picker. Maintain a selected-items
summary. Require only the data needed by the provider; show actionable feedback
when there are too few compatible items rather than a random fixed threshold.

Results: show selected pieces once in a compact inventory strip and outfit
boards below, organized by use/occasion when supplied. Each combination has
its own explanation and replace controls. Additions belong in a separate
"What would extend this capsule" section, with specific combinations enabled.
Never imply measured cost-per-wear from a generated suggestion.

Capsule detail must retain its brief, selected IDs, provider/sample provenance
and editable combinations. Save look from capsule retains that origin.

**States:** no wardrobe, selection empty, invalid brief, generating, partial
combinations, duplicate/invalid IDs, provider unavailable, saved and changed
inventory. Empty-state actions lead to wardrobe entry or a labeled sample.

## 13. Style DNA and fit preferences

One readable settings page with sections, not a mandatory multi-screen quiz.
Start with actionable preferences: style references, colors, fit and coverage.
Optional undertone, skin-depth and body/proportion guidance come later, each
with Skip/Unsure/Clear. Images or diagrams must be inclusive and approved;
use labeled placeholders until assets exist. Never infer body/skin from upload.

The header says these are shared demo preferences. Separate Save shared
defaults from Use for this look only. A look override stays transient until
the user deliberately persists it; it is not a private server profile.
No real personal data belongs in this no-auth demo.

Selection controls use labels and check marks, not color alone. Show a
summary of selected settings without a completion score. Explain how a field
will affect recommendations before asking for it. Fit preference takes
precedence over restrictive body categories.

**States:** unset neutral defaults, partially selected, skipped, cleared,
unsaved, save failed and conflicting shared defaults. Missing profile never
blocks upload, matching, saving or capsule exploration.

## 14. Workspace info (existing profile route)

Explain Shared demo, what is stored, who can change it and current provider
capabilities. Link to Style preferences and show safe reset instructions for
the demo owner. Do not put an unrestricted Delete all data button in the
visitor UI, invent an identity, or disclose environment secrets/model keys.

Capability states are user-facing: Image analysis available/unavailable,
Outfit suggestions available/unavailable, Shopping available/unavailable,
Preview available/unavailable. Offer sample/manual paths in the relevant
flow instead of turning this page into a developer diagnostics dashboard.

## 15. Try-on: single garment and combination

Use a contextual, wide panel from the selected look. Left: the preview canvas
and source/AI label. Right: radio choice Single item / Whole outfit,
selection/replacement controls, approved non-identifying model choice,
limitations and Generate preview.

Use a neutral mannequin or approved provider model, not an upload-your-selfie
prompt. The PRD requires authenticated ownership and consent for personal
photos, so the no-auth design must not offer that route. Selected skin/fit
preferences are optional synthetic demo settings, never measured attributes.

Before processing, show which image/items leave the app and which provider
category processes them. Explain that the image is a visualization, not proof
of size, physical fit, material accuracy or exact product appearance. A consent
checkbox is meaningful only when actual disclosure and handling exist.

**States:** ready, submitting, provider queued, processing, completed, failed,
timed out, cancelled waiting and deletion pending/failed. Pending UI uses real
status with elapsed waiting time, no invented completion percentage or ETA.
Deleting a stored output requires server/provider handling; removing its UI
thumbnail is not proof of deletion. Changed garment selection marks the old
preview stale rather than relabeling it as current.

## 16. Social Fit composer and public view

Composer: snapshot preview, catchphrase field, explicit public-field list,
then Create share link. The preview excludes wardrobe IDs, upload paths,
private originals, fit/body preferences and hidden reasoning context.
Only the approved outfit rendering, public item descriptions and catchphrase
are candidates. Confirm the actual allowlist with the data owner.

After creation: Copy link with real success feedback, Open public view and
Revoke link. In a shared demo, revocation ownership is not personal; explain
who can revoke through the application. Copy failure shows selectable text.

The public view is a focused editorial sheet: wordmark, outfit board,
catchphrase and approved garment descriptions, followed by Recreate a look
leading to the public landing/sample workflow. It has no workspace sidebar,
personal author identity, body data or live reference to internal inventory.

**States:** unpublished, publishing, published, copy failed, revoked, expired
if expiry exists, missing token and unavailable snapshot. Revoked links show
a deliberate unavailable state, never fallback access to the original look.

## 17. Desktop wireframe compositions

These are structural blueprints, not screenshot or pixel-fidelity claims.

### Review

```text
| 216px navigation | Project title                     Shared demo |
|                  | Upload / Review / Match / Outfit / Shop      |
|                  | Review the pieces                          |
|                  | +----------------+ +---------------------+ |
|                  | |                | | Shirt       Edit    | |
|                  | | Whole reference| | Detected attributes | |
|                  | | image, contain | | Review needed note  | |
|                  | |                | +---------------------+ |
|                  | |                | | Trousers    Edit    | |
|                  | +----------------+ +---------------------+ |
|                  | Replace image       Add piece             |
|                  | Back                        Match wardrobe |
```

### Choose an outfit

```text
| navigation | Project context and progress                     |
|            | Choose how to recreate the look                  |
|            | Closest           From wardrobe     Fresh        |
|            | [garment board]   [garment board]   [garment board]|
|            | item statuses     item statuses     item statuses |
|            | concise reason    concise reason    concise reason|
|            | [Select]          [Selected]        [Select]      |
|            |--------------------------------------------------|
|            | Why this works / Inputs used / Limitations        |
|            | Preview   Find missing pieces          Save look  |
```

### Look detail

```text
| navigation | Saved looks / Look title              Shared demo |
|            | +--------------------------+ +-----------------+ |
|            | |                          | | Look title      | |
|            | | Outfit composition       | | Why this works  | |
|            | | Item-level replace       | | Inputs used     | |
|            | |                          | | Save changes    | |
|            | +--------------------------+ | Preview / Share | |
|            | Reference and pieces        +-----------------+ |
```

## 18. Shared state and recovery contract

| Event | Preserve | Recompute or invalidate |
| --- | --- | --- |
| Provider retry | Uploaded image and reviewed edits | Only the failed operation |
| Correct detected attribute | Stable piece ID and correction history | Matching and dependent outfit rationale |
| Replace garment | Other selected pieces and original reference | Affected shopping query, rationale and preview |
| Change Style DNA | Existing saved revision | New generation only after explicit apply |
| Navigate to wardrobe and back | Look ID, selected step and chosen option | Inventory candidates if changed |
| Delete wardrobe item | Saved snapshot and visible unavailable reference | Live availability; requires data-model resolution |
| Revoke share | Internal look | Only public snapshot accessibility |
| Lose network during save | Form edits and selected board | Save status; never falsely mark saved |

Do not add an autosave promise before persistence/revisions exist. An unsaved
draft must say so. Refresh survival needs server persistence or an explicit
local-draft contract; URL query parameters are not draft storage.

## 19. Frontend engineering handoff

- Keep route files thin. `inspiration` owns intake/review, `matching` owns
  comparison, `outfits` owns option/detail, `products` owns SERP results,
  `decisions` owns score/rationale presentation, `sharing` owns snapshots,
  `capsules` owns combinations, `preview` owns provider job UI.
- Keep initial collections/details server-rendered. Client islands own file
  selection, forms, pickers, weight controls and bounded job polling.
- Share typed DTOs for `DetectedPiece`, `WardrobeMatch`, `OutfitOption`,
  `ProductEvidence`, `StylePreferences`, `PreviewJob` and `ShareSnapshot`.
  These are proposed names, not existing database tables or generated types.
- Distinguish data source (`live`, `sample`, `manual`) from request state
  (`idle`, `pending`, `success`, `partial`, `error`, `unavailable`). A sample
  success does not switch to a live-success label after saving.
- Keep stable IDs through garment correction/replacement. Validate every
  provider object and sanitize URLs at the server boundary.
- Scope all data on the server; no browser Supabase client. Short-lived
  storage URLs need loading/error/refresh behavior and must not be persisted
  as image identity. Avoid accepting an arbitrary image URL into optimization.
- Use React Hook Form for capsule and grouped preferences where useful,
  with Zod server validation still authoritative. The small wardrobe form
  need not be rewritten solely to adopt a form library.
- Use installed Arc/Radix behavior for dialog focus/escape and controls.
  Define a semantic token bridge before composing a parallel component system.
- Preserve intrinsic image dimensions and reserve board space. Prioritize
  the actual above-fold content image; lazy-load downstream collections.
  No LCP/INP/CLS target is claimed as measured in this analysis.
- Handle mutations with pending state, safe errors, invalidation and revision
  checks. Do not show optimistic AI output. Confirm save before announcing it.

## 20. Figma plan and team execution

Recommended Figma pages: Foundations, Components, Desktop flow, Desktop states.
Create 1440px masters and 1280px checks for the key working screens. Later
mobile frames are adaptations, not scaled-down desktop exports.

Frame list: landing; intake empty/selected; review; matching; three options;
shopping; wardrobe empty/populated; item drawer; saved looks; look detail;
capsule collection/brief/results; Style DNA; workspace info; preview ready/
pending/result; share composer; public snapshot/revoked. States can be component
variants or adjacent frames; no need to invent a route for each state.

Use real text, auto layout, semantic variables, reusable garment/product
components and checked control variants. Image-filled nodes may contain only
content imagery, not flattened complete screens. Label sample assets.
The supplied target page was empty; this analysis does not claim Figma frames
have already been created or that visual QA passed.

Keep the existing file ownership. Integrator owns shell/token bridge and
provider state language; wardrobe owner owns item/data contracts; looks owner
owns the core five-step journey; preferences/capsule owner coordinates the
remaining personalization/capsule surfaces. Social/preview/product contracts
need explicit allocation with those owners because the older plan lacks it.

For seven hours, freeze shared components and DTOs first, integrate the core
look object early, then connect every PRD surface to that same context. Keep
all features represented, as requested; missing integrations get truthful
unavailable/manual/sample paths. This is sequencing, not reducing PRD scope.
Do not promise that complete live integrations fit the timebox until provider
access and schema work have been validated.

## 21. Design delivery review

This review applies to the static specification, not an unbuilt app.

| Gate | Result and evidence |
| --- | --- |
| Direction and liveliness | PASS for specification: explicit dials, garment/annotation motif, and page-specific focal points in sections 4 to 16 |
| Palette evidence | PASS for specification: calculated pairs in `DESIGN.md`; Mauve and Stone restricted appropriately |
| Honest content | PASS for specification: Mobbin failure and empty Figma target disclosed; no live provider, sample score, performance or usability result invented |
| Feature coverage | PASS for specification: every current PRD feature mapped to a surface, including single/combo preview and public share states |
| Recovery and accessibility requirements | PASS for specification: per-page states, keyboard/focus, non-color statuses, 44px project targets and narrow-width adaptation specified |
| Asset ownership | PASS for specification: no final logo/person imagery generated; approval/placeholder rules recorded |
| Interactive delivery | Not applicable: no executable redesign delivered, so no click-through or browser accessibility pass is claimed |
| Figma visual validation | Not performed: analysis inspected the empty target page but created no mockups |

Before implementing, review the data/ownership decisions in `research.md`.
Before declaring the visual implementation complete, run the actual build,
click-through, responsive and accessibility checks defined in `DESIGN.md`.

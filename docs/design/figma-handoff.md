# Stylora desktop Figma handoff

**Superseded by revision 2:** use the [desktop and mobile handoff](v2-handoff.md)
and [streamlined flow](streamlined-v2.md). The delivery below is retained as
an archived exploration. Its manual matching page, global demo notices and
desktop-only scope no longer define the active product design.

Delivered 31 October 2026. Covers the full current PRD at desktop width 1440px.
This is editable design and navigation-prototype delivery, not application
implementation or a claim that provider integrations work.

- [Start here](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=0-1)
- [Desktop entry / Landing](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=17-2)
- [Foundations](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=14-2)

## Delivery inventory

The file contains Start here, Foundations, and Desktop / All PRD pages.
All 70 desktop feature/state frames share one prototype page because Figma
navigation actions require destinations on the same page. There are 40
feature screens and 30 state/handoff screens. The cover and foundation sheet
are additional frames, not included in the 70-screen count.

Original clothing illustrations and the non-identifying preview mannequin
are editable vectors with visible sample labels. They are not live model
output, approved catalog photography, or images representing real customers.
No complete-screen raster is imported into the deliverable.

## PRD coverage matrix

| PRD feature | Frames and behavior represented |
| --- | --- |
| Landing and optional onboarding | Landing, Upload; optional entry to Style DNA |
| Inspiration intake | Upload, Image selected, Upload invalid, Upload failed |
| Garment analysis and correction | Review, Edit detection, pending, unavailable, partial and malformed-output states |
| Wardrobe matching | Match, Match picker, No wardrobe matches; owned, alternative and missing distinctions |
| Three outfit combinations | Outfits with visibly different illustrated boards, rationale and replacement route |
| Shopping and Value Score | Shopping, Value settings, Product evidence, empty/unavailable results; explicit example weights without fake product scores |
| Style DNA and body profile | Style DNA, Body preferences; optional depth swatches, proportion diagrams, fit/coverage, shared defaults, skip and clear |
| Wardrobe CRUD | Wardrobe, filtered collection, Add item, Item detail, Edit item, Delete item, plus empty/loading/error/write-disabled states |
| Capsule builder | Capsules, Capsule builder, Capsule results, Capsule additions, empty/partial states; consistent selected sample garments |
| Social Fit | Share composer, published/copied/copy-failed, public snapshot, revoke confirmation, revoked and expired states |
| Single and combo try-on | Preview setup, Preview single, processing, illustrated mannequin result, failed/timeout/stale, delete/confirm/failure states |
| Saved looks and connected navigation | Saved looks, Look detail, Look saved, empty, failed save, missing saved item and shared revision conflict |

Workspace info and a handoff frame are included. Personal-photo upload is
deliberately absent because the current PRD disallows that path in the
no-auth shared demo. Its safe alternative is the non-identifying model path.

## Design and engineering decisions

- Keep the supplied eight-color palette. Instrument Serif and Inter are
  available and verified in the actual rendered file.
- Reuse Simple Design System button instances and shared Stylora text styles.
  Brand colors and spacing are variables; semantic code syntax was aligned
  to the repository's existing CSS token names.
- Keep source, sample status and uncertainty visible. No synthetic product
  price, rating, confidence percentage, cost-per-wear or live provider result
  is presented as real.
- Three outfit options and capsule combinations differ visually and in their
  rationale. Shopping is contextual to a missing piece; saving is independent.
- Shared defaults are distinct from current-look overrides. No account avatar
  or per-user privacy promise appears.
- Keep original analysis docs as planning records. Their pre-authoring claims
  about an empty Figma page are historical, superseded by this handoff.

## Validation evidence

Final structural inspection after refinements:

- 70 desktop feature/state frames.
- 566 navigation actions, all pointing to valid desktop frames.
- Font families: Inter and Instrument Serif.
- 1,228 frame nodes, 1,356 text nodes, 166 component instances and 169 vectors
  in the desktop canvas at the final recorded inspection.
- No text bounding box outside its owning screen.
- No image-filled node containing a flattened screen.
- Start point configured as Stylora / Complete desktop journey.

Representative screenshots were inspected for foundations, landing, garment
review, outfit comparison, wardrobe, optional body guidance, preview, capsule
results and provider-unavailable state. Repairs included auto-layout sizing,
long-page clipping, narrow action labels, the ink swatch, distinct outfit/
capsule compositions and the preview mannequin. Screenshots are under `qa/`.
Canvas IDs and final machine-readable evidence are in `figma-state.json`,
`figma-screen-map.json` and `figma-final-verification.json`.

This is a Figma artifact, so navigation was inspected through reaction data;
no application/browser click-through or screen-reader conformance is claimed.
Text fields, uploads, scoring controls, clipboard, jobs and mutations describe
intended UI behavior. They do not operate real services inside the prototype.
Mobile and compact-desktop mockups are not included in this desktop delivery.

## Mobbin status

The follow-up request retried Mobbin web-screen search twice. Both calls
returned the same internal error with no reason. No images or usable results
were returned, so no Mobbin reference is claimed. Existing independent research
remains attributed in `research.md`.

## Delivery gate

| Gate | Result and evidence |
| --- | --- |
| Direction | PASS: supplied palette, editorial typography, explicit restrained motion direction |
| PRD feature coverage | PASS for design scope: all 12 feature groups map to concrete frames above |
| Editability | PASS: native text, auto-layout frames, component instances and vectors; no flattened complete-UI image |
| Prototype destinations | PASS: 566 valid navigation actions, zero invalid destinations |
| Typography and clipping | PASS for recorded desktop bounds: correct two font families and zero text overflow |
| Content honesty | PASS: all illustration/provider samples labeled; no fabricated prices, reviews or real AI claims |
| Visual review | PASS for representative compositions after targeted fixes; remaining viewport/runtime checks are explicitly outside this artifact |

No app source, database migration, cloud project, commit or deployment was
changed by this design delivery. The initial authoring snippets are retained
as `.txt` files for review, separate from runtime JavaScript. Later targeted
refinements and node identity are recorded in the ledgers; do not rerun the
initial creation snippets against a populated file without exact-ID checks.

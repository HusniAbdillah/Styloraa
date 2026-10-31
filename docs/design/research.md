# Stylora design research and product diagnosis

The active desktop/mobile design follows the owner's later
[streamlined flow](streamlined-v2.md). See [revision 2 handoff](v2-handoff.md)
for current links, navigation and validation. Earlier recommendations below
are research history where they conflict with that revision.

This records the analysis before Figma authoring. For the subsequent 70-frame
desktop delivery and actual validation, see [Figma handoff](figma-handoff.md).

Research date: 31 October 2026. Evidence types are kept separate: repository
facts, official product descriptions, and design recommendations.

## Source review

Read the repository's root working instructions, README, full PRD,
architecture, sprint plan, deployment runbook, verification report, skills
guide, UI component guide, Supabase README, feature READMEs, and PR template.
Reviewed route structure, palette CSS, Arc foundation and database contract.
The installed antislop and design-engineering guidance informed the process.
Additional skill reference manuals are supporting guidance, not product facts.

## Critical findings

1. The current PRD requests the complete inspiration-to-outfit journey,
   shopping, personalization, capsules, Social Fit and single/combo preview
   within the same seven-hour sprint. The older sprint plan and feature
   READMEs still defer several of these as P1/P2. Treat the latest PRD as the
   design scope. The owners must reconcile execution assignments; this study
   does not silently remove features or rewrite the delivery commitment.
2. Current source is a scaffold. Wardrobe has metadata add/list patterns;
   most screens remain placeholders. The home route redirects to `/create`;
   the landing in the PRD is not implemented. Sharing returns 404 and AI
   creation returns unavailable. Passing scaffold tests is not product proof.
3. Shared no-auth data changes the meaning of personalization. A preference
   stored in this workspace affects everyone, and a returning visitor has
   no identity to recover. The design must explicitly distinguish shared
   defaults from an unsaved override used only in the current look.
4. The bootstrap database contract does not yet represent the richer PRD:
   inspiration assets/pieces, per-attribute provenance, look revisions,
   structured Style DNA, product evidence and revocable share snapshots.
   A detailed mockup needs these contracts proposed, not invented live data.
5. Arc foundation has its own neutral/accent gradients, large radii, font
   and motion values. Global Stylora tokens alone do not guarantee consistent
   Arc controls. Styling ownership must include an explicit semantic bridge.
6. Technical placeholder messages and developer ownership labels are useful
   during setup but must leave end-user screens in the implemented design.
   The product needs actionable state copy rather than module status prose.

## Mobbin evidence status

Two identical web-screen searches for a fashion clothing collection returned
an internal MCP error with no reason. No Mobbin image was returned or viewed.
There are therefore no verified Mobbin screen references in this study.
Other sources below are independent research requested by the owner, not
substitutes represented as Mobbin results.

When access works, search separately for wardrobe collection, outfit editor,
image review, product comparison, and preference selection. Use web references
for desktop layouts. Mobile wardrobe references can inform task order only;
do not enlarge a mobile screenshot and call it a desktop design.

## Supplied Figma source

Target: [Mockup, Page 1](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=0-1).
Metadata for node `0:1` returned an empty canvas with zero dimensions; its
render was 1 by 1 pixels. There is no visible composition on that target
page to assess or preserve. No existing design was overwritten.

## Independent reference study

These observations use public official pages. They are feature/content
references, not audits of signed-in interfaces or claims of usability testing.

| Source | Evidence observed | Adopt for Stylora | Do not transfer |
| --- | --- | --- | --- |
| [Indyx](https://www.myindyx.com/) | Digital wardrobe, outfit creation, capsules and reuse of owned clothing are connected in the public product description | Wardrobe items act as reusable inputs across looks and capsules | Personal accounts, stylist services, private closet assumptions |
| [Whering](https://whering.co.uk/) | Public description includes adding items, search/filter, styling suggestions and planning | Make finding/reusing clothes a first-class step before shopping | Social network/feed or inventory statistics without real data |
| [COS womenswear](https://www.cos.com/en-us/women) | Public page organizes fashion imagery by collection and clothing category | Use garment photography and clear category hierarchy as content, with restrained editorial headings | Store checkout, promotional newsletter interruptions, product-photo reuse without permission |
| [Are.na](https://www.are.na/about) | Official explanation connects capturing, arranging, searching and reusing collections | Saved looks and capsules retain source/context rather than becoming an endless feed | Its visual identity, account permissions or a generic masonry layout for structured comparison |

The proposed editorial direction is our synthesis of the brief and these
product structures. It is not a claim that all four products share one UI style.

## Accessibility sources and measured palette

[WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
requires 4.5:1 for ordinary text and 3:1 for qualifying large text (24 CSS px
regular or about 18.67 CSS px bold). Do not confuse points with CSS pixels.
[Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
covers meaningful control/state cues against adjacent colors.
[Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
has a 24 CSS px minimum with exceptions; Stylora chooses 44px as its stronger
project target, not as a blanket claim about the AA minimum.

Computed opaque sRGB contrast is recorded in `DESIGN.md`. These arithmetic
checks do not establish accessibility of unbuilt screens, opacity variants,
photography overlays, or actual interaction behavior.

## Open decisions that affect detailed visual design

- Approved inspiration, garment, and non-identifying preview assets; usage rights.
- Region/currency and available SERP result fields; no assumed USD or local price.
- Actual Muse/Gemini model support, capability and job states. Provider/model
  names in the PRD are requested integration inputs, not validated availability.
- Whether shared preference updates are explicit-only or session overrides are
  promoted to defaults with a confirmation. Recommended: explicit-only.
- Public snapshot field allowlist and deletion/revocation behavior.
- Atomic look saving and revision semantics after a wardrobe item changes.

These do not block the UX specification. They block claims that final content
and live integration are already production-ready.

## Verification of this deliverable

New files only: `DESIGN.md`, this research report, and `desktop-ux-spec.md`.
No runtime code, migration, shared agent instructions or existing design was
changed. `git diff --check` returned no errors; text inspection found no em
dashes in the new files. Palette contrast was computed from source hex values.
Automatic formatting was attempted but the local Prettier executable could
not load its missing `node_modules/prettier/bin/prettier.cjs` module. Dependencies
were not reinstalled as part of a design-analysis task. No browser interaction,
responsive visual pass, or Figma mockup creation is claimed.

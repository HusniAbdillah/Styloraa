# Stylora design guidelines

Status: proposed desktop design direction, 31 October 2026. Derived from the
requested premium fashion experience and the owner's eight-color palette.
This is a design specification, not a claim that the application is implemented.

Revision 2 supersedes the earlier matching flow and repeated demo banners.
See [streamlined flow](docs/design/streamlined-v2.md): automatic AI wardrobe
suggestions, eight primary destinations, contextual panels, collapsible icon
navigation and dedicated mobile layouts.

Read alongside [research](docs/design/research.md) and the
[page-by-page desktop specification](docs/design/desktop-ux-spec.md).

## Design read

Reading this as a desktop styling studio for people recreating saved outfit
inspiration, with an editorial fashion language and practical comparison tools.
ENERGY 2 / RHYTHM 2 / MOTION 1. The landing may use a stronger image composition;
the working screens remain quiet. These dials are recommendations inferred
from the supplied brief, not a previously approved brand system.

The recurring motif is a garment composition paired with a short styling note:
see the clothes, understand the choice, change the piece. Do not reduce the
product to a prompt box or an analytics dashboard.

## What premium means here

- Garments have consistent scale, considered crops, and enough room to read.
- Typography distinguishes editorial titles from operational controls.
- The reference image, garment selection, and explanation stay connected.
- One action dominates the current task. Other actions use quieter treatments.
- Empty space separates decisions. It does not push useful content below the fold.
- Errors retain work. Save and processing feedback are precise and calm.

Avoid ornamental sparkles, gradient headlines, floating blobs, fake analytics,
unearned ratings, endless rounded containers, and generic inspirational copy.
Do not add a pricing section, testimonials, or logo wall without real content.

## Color system

Keep these source colors unchanged. Derived semantic mappings are below.

| Source token | Hex | Semantic role |
| --- | --- | --- |
| Porcelain | `#F5F2EC` | Application canvas |
| Paper | `#FFFEFC` | Editing surfaces and image backgrounds |
| Near-black | `#211F20` | Body text, headings, strong icons |
| Oxblood | `#642E3B` | Primary action, active marker, checked controls |
| Deep wine | `#48212B` | Primary action hover/pressed |
| Muted mauve | `#A18483` | Decorative details, nonessential accent only |
| Stone | `#DCD6CE` | Decorative separators and grouping boundaries |
| Secondary text | `#706A66` | Supporting text, identifiable control outline |

Use neutral surfaces for most of the screen. Reserve oxblood for the current
decision, not every icon and heading. Paper and Porcelain are intentionally
close; their difference alone must not identify an interactive control.

Computed contrast from the supplied opaque sRGB values:

| Foreground / background | Ratio | Use |
| --- | --- | --- |
| Near-black / Porcelain | 14.666:1 | Body and headings |
| Near-black / Paper | 16.258:1 | Body and headings |
| Secondary text / Porcelain | 4.767:1 | Normal text, at full opacity |
| Secondary text / Paper | 5.285:1 | Normal text |
| Paper / Oxblood | 10.439:1 | Primary button label |
| Paper / Deep wine | 13.635:1 | Primary hover label |
| Muted mauve / Porcelain | 3.059:1 | Do not use for small text |
| Muted mauve / Paper | 3.391:1 | Do not use for small text |
| Stone / Porcelain | 1.291:1 | Decorative only |
| Stone / Paper | 1.432:1 | Decorative only |

Do not lower secondary text opacity. Use `#706A66` for control borders when
the boundary is needed to identify the input. Stone may divide two readable
content regions, but must not be the only outline of an unlabeled field.
Focus uses a 2px Oxblood ring with a 3px Paper gap so it remains visible on
both light surfaces and Oxblood buttons. Test actual adjacent colors.

Wardrobe provenance belongs inside AI recommendations when useful, not in a
mandatory matching step. Review-needed uses a text note and outlined icon.
Do not depend on red/green or introduce a rainbow of status chips.

## Typography

Proposed font pairing: [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif)
Regular for editorial page titles; [Inter](https://fonts.google.com/specimen/Inter)
Regular, Medium and Semibold for body, controls, and metadata. The serif
suggests fashion publishing; the sans keeps dense comparison work readable.
Verify font availability in Figma and web licensing before final delivery.
Current Georgia/Arial can remain fallbacks, not proof the proposed fonts ship.

| Role | Desktop size / line height | Weight |
| --- | --- | --- |
| Landing headline | 64 / 68px | Display regular |
| Page title | 40 / 44px | Display regular |
| Section title | 24 / 30px | Sans medium |
| Card title | 18 / 24px | Sans medium |
| Body | 16 / 24px | Sans regular |
| Control label | 14 / 20px | Sans medium |
| Supporting metadata | 13 / 18px | Sans regular |

Use sentence case. Do not set every small label in tracked uppercase.
Long reasoning stays at 55 to 70 characters per line. Prices and job timing
use tabular numerals. No giant serif headers inside the item picker.

## Desktop geometry

- Main design frame: 1440px wide, 1000px viewport. Pages may continue below it.
- Validate an additional 1280px frame; the spec must not depend on 1440 alone.
- Workspace sidebar: 216px. Content horizontal padding: 40px at 1440,
  24px at compact desktop. Working content max-width: 1328px.
- Top bar uses the same Porcelain background as the canvas. The Stylora
  logo pairs the interwoven-silk symbol with an outlined Instrument Serif
  wordmark, with a 44px hamburger control. Do not show
  a persistent environment/sample-content banner.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px. Related controls use 8 to
  12px; task groups 24 to 32px; independent sections 48 to 64px.
- Controls: 44px minimum height. Field radius 6px, button 8px, panel 12px,
  overlay 16px. Pills are limited to removable filters and compact statuses.
- Use flat surfaces and rules. Reserve a subtle shadow for menus, drawers,
  and dialogs that actually overlap content.

## Images and content

Inspiration images use `contain`; preserve the whole outfit. Garment cutouts
use `contain` inside consistent 4:5 cells with the same visual scale. Outfit
boards use 3:4 or 4:5. Catalog images retain their source and are not passed
off as owned garments. Lifestyle crops can use `cover` only where no garment
review depends on the crop.

Do not synthesize people or customer photos. The owner requested a new vector
logo on 31 October 2026: use the interwoven-silk symbol and outlined Stylora
wordmark in `public/brand/`. See [brand assets](docs/design/brand.md).
Unapproved assets remain visibly labeled placeholders.
Static prototype illustrations are disclosed in the design handoff rather
than repeated as Sample content badges across the product chrome. Keep
contextual preview limitations; no invented price, confidence or score is live.

## UI language

Use task-specific copy: Choose image, Review details, Suggest outfits,
Save look, Suggest another outfit, Create capsule, Preview outfit.

Prefer evidence: "Similar color, wider cut" instead of "Perfect match".
Use "Likely linen texture" instead of asserting a fabric composition.
Explain optional profile use with "Uses your relaxed-fit preference".
Avoid "flattering for your body", "fix your shape", and unsupported fit claims.

Do not show a persistent Shared demo label in the header or sidebar. The
underlying no-auth data model is unchanged: do not invent an account avatar,
login, private-wardrobe promise, or personal-photo try-on upload. Explain data
handling where an actual submission or preference change requires it.

## Motion and feedback

Motion serves continuity: 120 to 160ms for press/hover, 180 to 220ms for
an overlay. Prefer opacity and small transforms. No floating garments,
scroll hijacking, confetti, or animated AI scanning beams. A generated-image
reveal should not hide its source/limitations label.

Use named processing stages based on actual server status. Do not simulate
progress percentages. Poll only while a real provider job is pending, with
bounded backoff and a visible retry/stop-waiting route. Preserve edits.
Reduced-motion mode removes movement without removing status feedback.

## Component policy

Reuse installed Arc/Radix primitives for behavior, then adapt the foundation
tokens. Do not install another UI kit for a different visual personality.
Application icons use the documented Radix icon set. Replace duplicate
wrappers incrementally; do not rewrite all component internals for branding.

Arc currently brings independent accent, radius, typography and motion tokens.
Map those to Stylora's semantics before composing screens. Review its focus
selectors and token overrides against the actual component styles; a renamed
color variable is not a complete accessibility fix.

## Acceptance gate for the later visual implementation

Check 1440, 1280, 1024, 768 and 390px; keyboard, 200% zoom, reduced motion,
image failure, empty wardrobe, no provider, timeout, edited result, and
missing/deleted item. Compare long outfit titles and missing catalog prices.
Use at least 44px targets as the project standard; WCAG 2.2 AA target-size
minimum has a different 24px rule with exceptions.

This specification is static. No application redesign, browser click-through,
screen-reader pass, or Figma mockup completion is claimed by this document.

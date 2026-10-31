# Stylora logo

Created on 31 October 2026 at the owner's request. The revised direction uses
a standalone symbol, with no letter or S monogram.

The interwoven-silk symbol combines two linked elliptical ribbons, with
alternating breaks at their crossings. The loops represent Style and Aura
coming together. Their form refers to silk knots and jewelry rather than
literal garment, collar, or petal shapes.
The owner's tagline is "Where Style Meets Aura." The lowercase
Instrument Serif wordmark preserves the app's editorial fashion direction.
Its letters are outlined, so exported files need no installed font.

Oxblood (`#642E3B`) is the primary color; Paper (`#FFFEFC`) is used on dark
surfaces. Near-black (`#211F20`) is available for monochrome applications.
Keep the symbol upright and preserve its proportions and negative space.
Allow at least one quarter of the symbol's width as clear space. Use the
symbol alone for favicons and app icons; use the full lockup in navigation.
The design follows ENERGY 2 / RHYTHM 2 / MOTION 1 from `DESIGN.md`.

## Files and application

- `public/brand/stylora-mark.svg`: editable standalone vector symbol.
- `public/brand/stylora-logo.svg`: primary vector lockup.
- `public/brand/stylora-logo-reversed.svg`: Paper lockup for dark surfaces.
- `public/brand/stylora-logo-black.svg`: Near-black lockup.
- `public/brand/stylora-logo.png`: transparent high-resolution export.
- `public/brand/stylora-preview.svg` and `.png`: presentation on Porcelain.
- `public/icon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`,
  and the 192/512px icons in `public/brand/`: browser and application icons.
- `src/app/manifest.ts`: application name and icon declarations at `/manifest.webmanifest`.

`BrandLogo` is shared by the desktop header and mobile navigation drawer.
The home link has an accessible name and the image reserves its dimensions.
The root metadata declares browser and Apple icons and the manifest.

## References and production

Mobbin search failed twice with an internal error, so no Mobbin reference
is claimed. The owner's request allowed other platforms. The
[TOTEME identity by Ateljé Altmann](https://ateljealtmann.com/project/toteme)
informed the restraint and emphasis on recognizable typography. The Stylora
symbol is drawn independently; no reference brand artwork is included.

The wordmark outlines derive from Instrument Serif Regular, distributed
under the SIL Open Font License. The license is included as
`public/brand/InstrumentSerif-OFL.txt`. Vector paths are the source assets;
PNG and ICO files are rendered exports, not image-generation outputs.

## Verification limits

Browser review at `http://localhost:3000/create` used 1440x1000 and 390x844
viewports. The header logo loaded at 162x54px; clicking it returned to
`/create`. Collapse navigation exposed Expand navigation. The mobile drawer
opened with the new logo and closed with Escape. No horizontal overflow or
page JavaScript errors were observed. Icon SVG, ICO, Apple PNG, and manifest
requests each returned HTTP 200. This verifies the branding shell, not the
placeholder Create feature's end-to-end behavior.

Design delivery gate for the branding scope:

- Hard gate PASS: explicit logo request, labeled image, reserved dimensions,
  existing keyboard focus, tested home link and drawer, no new data claims.
- Purpose gate PASS: interwoven-silk silhouette, editorial type, and existing
  Oxblood palette each have their identity purpose recorded above.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 1, one repeated linked-ribbon motif,
  clear space, and no added decorative motion.
- Craftsmanship PASS: inspected desktop/mobile screenshots and vector/PNG
  exports; the white icon remains legible on Oxblood at small sizes.

`pnpm check` failed because ESLint scanned the existing `node_modules.bak`
folder. `pnpm build` compiled successfully, then failed at existing capsule
RPC type errors for `save_capsule_studio` in
`src/features/capsules/repository.ts`. These failures are outside branding.
No database changes were made; database reset, type generation, and database
tests were not run for this static branding change. No commit, push, or
deployment was performed.

Focused ESLint on the three modified TSX files and Prettier on the new
component/manifest passed. `pnpm test` returned 20 passed and one failed:
the existing Meta provider JSON extraction test expects a malformed-JSON
error for `{broken`, but receives a no-JSON-object error.

## Owner 4 integration

The original branding verification above records the state of the shared checkout.
PR #8 integrates these assets and tagline with the generated PWA manifest,
retains Instrument Serif/Inter, and keeps the focus-managed collapsible shell.
The redundant static site.webmanifest is not used. Original build/type issues
were addressed in the Owner 4 implementation; see docs/owner4-verification.md.

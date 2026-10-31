# Stylora desktop and mobile handoff, revision 2

Delivered 31 October 2026. This is an editable Figma design and navigation
prototype. Application features and provider integrations are not verified
by this delivery.

- [Desktop entry](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=44-5)
- [Mobile entry](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=44-637)
- [Desktop compact navigation](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=46-251)
- [Mobile navigation drawer](https://www.figma.com/design/ta9JYu4Q7fLWeuu0PJgWhp/Mockup?node-id=45-1339)

## Product structure

The main journey is **Item -> Detection -> AI recommendations -> Look**.
Detection is a state of Create, not a separate navigation destination.
AI considers wardrobe pieces automatically. There is no manual wardrobe
matching page or alternative picker. Users correct detection or ask AI to
suggest another combination.

There are eight primary destinations across the product: Create,
Recommendations, Look, Wardrobe, Saved looks, Capsules, Preferences and Public
look. Only Create, Wardrobe, Saved looks, Capsules and Preferences belong in
the sidebar. Recommendations and Look retain their current journey context;
the public snapshot has its own reduced shell.

Shopping, detection correction, item editing/deletion, preview, sharing,
capsule editing, optional body guidance and regeneration are contextual
desktop inspectors or mobile full-screen sheets. They are not additional
top-level pages. Previous desktop explorations remain in the archive page;
do not navigate users back into that older flow.

## Visual and responsive decisions

- Porcelain continues through the header, sidebar and canvas. Paper defines
  editing surfaces. The supplied eight-color palette remains unchanged.
- Instrument Serif renders the Stylora wordmark and editorial headings;
  Inter renders labels, controls and explanatory text.
- Radix SVG icons accompany navigation. The desktop hamburger switches
  between a labeled sidebar and an icon rail while retaining the current
  destination. Mobile uses a drawer with close and back/scrim actions.
- Global Shared demo and Sample content notices are absent. The underlying
  no-auth server workspace contract is unchanged. Do not promise personal
  ownership, private uploads or functioning AI from a static prototype.
- Mobile uses a vertical layout. The selected recommendation is expanded;
  the other two options remain reachable as compact cards. No horizontal
  comparison carousel is required.

## Coverage and implementation contract

| Feature | Active surface |
| --- | --- |
| Inspiration and editable detection | Create, Detection, Detection edit |
| Automatic wardrobe context and three outfits | Recommendations, Regenerate, Look |
| Shopping and value evidence | Shopping inspector/sheet; unavailable evidence is stated explicitly |
| Wardrobe CRUD | Wardrobe, Item editor, Item delete |
| Saved outfits | Saved looks, Look |
| Capsules | Capsules, Capsule editor, recommendations context |
| Style DNA and optional body context | Preferences, Body guide |
| Single/combo preview | Preview, Preview single |
| Revocable public snapshot | Share, Share ready, Share revoked, Public |

This revision concentrates on the connected journey and responsive structure.
The archived exploration records further pending, error, empty, conflict and
timeout examples. Implement those states inside the new surfaces, without
restoring old pages. The current prototype does not simulate uploading,
form entry, clipboard, persistence, a provider job or a real public link.
Its garment illustrations are editable layout assets, not live AI output.
Real missing providers must return unavailable responses. Do not expose
unlabeled fixture results in the application.

During implementation, the drawer must trap focus while open, close on
Escape, restore focus to its trigger and use an accessible trigger name and
expanded state. The icon rail needs visible tooltips and accessible names.
Respect reduced motion. These behaviors require browser verification;
Figma reactions alone do not prove them.

## Verification

Recorded canvas inspection: eight primary destinations, desktop/mobile
core flows, contextual panels/sheets and navigation variants. The two
prototype start points lead to the revised Create screens.

- Widths inspected: 1440px and 1280px desktop; 390px and 360px mobile.
- No visible text bounding boxes exceeded their owning screen horizontally.
- No active navigation target was shorter than 44px.
- 371 forward navigation actions had valid same-page destinations;
  14 additional actions return to the previous screen.
- Only Instrument Serif and Inter were found in the active screens.
- No persistent Shared demo, Sample content, Select alternative or Match
  wardrobe text was found in the active frames.

Evidence: `v2-verification.json`, `v2-complete-map.json` and representative
screenshots in `qa/v2/`. Long mobile content intentionally scrolls below the
viewport. Structural checks and screenshot review do not establish browser,
keyboard, screen-reader or real-device conformance.

Mobbin searches previously returned internal errors. No successful Mobbin
reference is claimed; attributed independent research remains in `research.md`.
No deployment, database changes, commit or push is part of this revision.

Repository checks run alongside this handoff: `pnpm build` and `pnpm check`
passed. The latter completed ESLint, TypeScript and two unit-test files
containing eight passing tests. Database checks were not run because this
design revision does not change schema or server queries. These results do
not verify the Figma flow in the application.

# Stylora streamlined flow, revision 2

This revision follows the owner's latest correction. It supersedes the
manual wardrobe-matching steps in the earlier desktop specification.

## Product flow

Item/inspiration upload -> editable image detection -> AI outfit
recommendations -> selected look. Wardrobe comparison is internal AI work,
not a mandatory page or manual alternative picker. Correction of detected
attributes remains available. Regenerate suggestions replaces manual browsing
for an alternative wardrobe item within the main journey.

Eight primary destinations: Create, Recommendations, Look detail, Wardrobe,
Saved looks, Capsules, Preferences, and the public shared look. Shopping,
item editing, capsule editing, try-on and sharing are contextual panels or
mobile full-screen sheets. Navigation states are not extra product pages.

## Visual direction

Keep Porcelain through canvas, sidebar and top bar. Paper marks editing
surfaces. Stylora uses Instrument Serif, with Inter for navigation and tasks.
Use Radix icons from the installed package, at 20px inside 44px targets.
Remove the global Shared demo / Sample content banner and sidebar boilerplate.
Keep deployment data constraints in documentation and contextual data handling,
not persistent product chrome. This does not introduce accounts or privacy.

Clothing illustrations are layout placeholders in a static prototype, not
claimed live AI/catalog output. Preview has one contextual visualization/fit
limitation. Do not invent shopping prices, ratings, score or live availability.

## Responsive behavior

Desktop: expanded icon-and-label sidebar, or a compact icon rail toggled by
the header hamburger without changing the current page. Keep a readable
maximum content width when the rail frees space.

Mobile: labeled hamburger opens a drawer; close/scrim returns to the current
screen. No permanent left rail. Detection and recommendations stack, and
collection grids use two columns only when useful. Forms and contextual
panels become full-width sheets. Targets remain at least 44px. Long content
scrolls vertically with no horizontal overflow; important controls must remain
reachable without a fixed footer covering them.

## Frame inventory

Desktop and mobile versions of all eight primary destinations, with additional
navigation/sheet states. The previous 70-frame exploration is archived rather
than presented as the active flow. The entry page links to this revision.

The application/database scope is unchanged except for the explicitly revised
design flow. A later implementation should update recommendation contracts
without silently reinstating the removed manual matching step.

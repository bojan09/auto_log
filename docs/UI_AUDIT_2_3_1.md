# UI/UX audit — 2.3.1

Scope: Dashboard, Garage, Services, Fuel, Settings and Profile at 320, 390, 820 and 1440 CSS pixels, plus the existing editor, accessibility, offline and navigation suites.

Findings and fixes:
- Browser-dependent select arrows sat too close to control borders. All single-select controls now share an 18px chevron inset 14px, with 42px reserved for the arrow. Native selection, keyboard input and accessible names remain intact. Forced-colors mode restores the system control.
- Generic disclosure triangles differed from dropdown controls. Shared disclosure chevrons now align to the right and indicate expanded state. Vehicle optional sections and action menus retain their specialized controls.
- Empty finance messages used headline-sized metric type. Empty states now use readable body-sized text while actual amounts retain metric emphasis.
- Long vehicle descriptions could crowd the mobile edit action. The hero copy now reserves space.
- Mobile vehicle selectors inherited a desktop width cap. Finance selectors now use the available width.
- Filter submission could occupy an uneven grid cell. The mobile action spans the row and aligns left.

Validation: responsive screenshots, native selection changes, Enter-key disclosure behavior, forced-colors fallback, overflow checks, and existing accessibility/browser regression suites. Physical Android/iOS and Firefox/WebKit are not verified. This audit does not assert that every possible app bug is eliminated.

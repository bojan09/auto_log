> Current design authority: [AutoLog 2.0 matte system](MATTE_DESIGN_SYSTEM.md) and [rebuild plan](UI_REBUILD_PLAN.md). Earlier visual decisions below are historical. English-only and bottom-only phone navigation follow the direct user instructions.

# Design specification

Use the supplied mobile and desktop concepts as the visual target: near-black graphite (#070e12), elevated dark teal cards, mint (#34e5ce) highlights, white/muted typography, rounded borders and restrained glows. Desktop uses a left sidebar and wide hero. Mobile stacks content with fixed bottom navigation and a central add action. Preserve visible keyboard focus, 44px actions, Cyrillic support and reduced-motion behavior.

Phase 1 implements original A/AutoLog artwork, a compact vehicle hero, actual odometer and honest empty service/compliance cards, responsive garage cards, photo entry and body-style fallbacks. Phase 2 implements maintenance/timeline data; Phase 3 supplies charts. Rich imagery and motion continue in Phase 4. The supplied BMW records and Premium membership are not product features.

Reviewed generated screenshots at mobile and desktop sizes. Intentional differences: generic original body-style art instead of copied BMW photography; empty statistics instead of sample data; Fuel clearly marked unavailable; no decorative scenic poster border. Exact reference binaries were not exposed as downloadable workspace files, so they have not been fabricated under design/. The full references remain visible in the conversation.

Phase 2 adds mint scheduled/complete timeline nodes, amber due/soon statuses, red overdue cards, an active Services navigation item, a compact interval-help disclosure and keyboard-native schedule/history dialogs. Dates and status labels remain textual so color is not the only signal.

## Phase 4 design correction — latest user reference

The latest supplied reference supersedes the earlier graphite/mint concept where they differ. The current oversized garage cards and flat polygonal vehicle artwork do not meet the requested visual quality. Phase 4 must include a substantial visual redesign, not just animation or recoloring.

- Desktop: compact horizontal icon navigation, dark navy translucent surfaces, electric-blue primary actions, and a cinematic mountain/road vehicle hero. Keep content readable over scenery.
- Garage: compact multi-column vehicle cards with relevant vehicle imagery, concise metadata and prominent detail actions. A single vehicle must not stretch into a giant full-width card.
- Dashboard: strong vehicle centerpiece, compact vehicle summary/switcher, useful quick actions, dense metric/chart grid and recent activity. Reduce excess whitespace and oversized controls.
- Mobile: full-width vehicle image, compact specification strip, two-column quick actions and metric cards, coherent bottom icon navigation, and readable touch targets.
- Vehicles: prioritize the user's photo, then lawful original model-relevant artwork, then a clearly labeled refined body-style fallback. Fiat Sedici 2010, Golf, Ford, Audi, Mercedes-Benz, BMW and Peugeot must not all receive the same image. Do not mislabel illustrative artwork as an exact-model photograph.
- Charts: blue/cyan economy line, distinct expense colors, restrained gradients, gridlines and useful labels. Preserve text equivalents and keyboard interaction.
- The reference's sample name, avatar, fuel percentage, range, percentage changes, trips and dates are not real user data. Never insert invented values or nonfunctional controls to imitate the screenshot.
- Preserve all Phase 1–3 functionality, EN/MK, offline operation, accessibility and reduced-motion support. Implement Phase 4 care-score explanation and service hotspots using actual stored records.

Acceptance: compare real screenshots at 360×640, 390×844, 768×1024 and 1440×900 against the latest reference; explicitly review navigation, visual density, vehicle imagery, hero proportions, cards, chart styling and mobile ergonomics. Do not mark Phase 4 complete solely because functional tests pass. Commit and push to master only after the complete phase gate passes.

Phase 4 review: desktop/mobile screenshots now show the latest navy/blue direction, original alpine backdrop, relevant realistic body-style art, compact horizontal icon navigation and bounded garage cards. Mobile retains bottom navigation, two-column metrics and touch controls. Functional filters and truthful empty states require more vertical content than the static reference poster. No personal avatar, fuel-level estimate or sample chart values were invented. Body-style art remains explicitly illustrative; it does not claim exact-model accuracy.

## Phase 5 screens
More uses five compact section buttons for settings, documents, reports, trips and backups. The settings grid follows the navy/blue card layout and stacks on mobile. Light and system themes add explicit readable surfaces and colors; blue/mint preferences affect primary actions. Documents use bounded cards and native dialogs, checklist rows use labeled checkboxes, and printable reports remove navigation and actions while retaining table headings and currency totals. Settings defaults never fabricate vehicle statistics.

## Button and floating navigation refinement
Primary save/add/open actions use compact blue or mint fills; secondary actions use quiet outlined surfaces, cancellation/language actions are understated, and destructive actions use a distinct red tone. Shared controls live in `src/controls.css`, with existing screen styles imported into a lower CSS cascade layer. Hover/press/focus/disabled states remain visible in both themes without animating text contrast.

Mobile navigation is a rounded floating dock with side/bottom clearance, safe-area insets, a central add button, short EN/MK labels and 44px-or-larger touch targets. Full accessible navigation names remain intact. Bottom content padding lets page actions scroll above the dock. Desktop keeps compact horizontal navigation. The requested UI/UX skill was not available in the cloud or executor catalogs or local skill directories; the design work was implemented directly.

## Latest reference: 1000034610.jpg
This user-supplied reference and the explicit compact-layout request supersede earlier navigation/layout choices. The app now has a slim top header with native Vehicles and Tools dropdowns, a theme control and language switch. There is no sidebar or `aside` element. A floating bottom dock is present on desktop, tablet and mobile. It retains central add, active state, keyboard focus and safe-area clearance.

The dashboard now follows the reference's dense composition: panoramic vehicle hero, adjacent mileage/next-service cards, four color-coded quick actions, small economy/spending/compliance cards and recent activity. The actions open real fuel/service/expense forms and trip checklists. Full analytics/filter controls remain in Fuel & Expenses; maintenance and mileage history are accessible disclosures. Vehicle selection stays beside the page title on mobile. Compact type, buttons, inputs, garage cards and settings spacing replace the earlier oversized presentation.

The reference's weather, personal identity, fuel-level percentage, remaining range and trip-map examples are not fabricated. The app displays actual saved records, date/distance schedule calculations and explicitly labeled original body-style illustrations. Screenshots were compared at 360/390/768/1440px; desktop and mobile emphasize the same navy/blue palette, scenery, icon actions and card hierarchy. This design refinement does not mark Phase 6 complete.

Latest language requirement: the application is English-only. The header language switch and language setting are removed. Browser locale and legacy saved/backup preferences cannot enable Macedonian.

Phase 6 review: the compact approved layout is retained in English only. Optimized WebP scenery/vehicles replace runtime PNGs without changing component proportions; source originals remain for provenance. Desktop/mobile screenshots were reviewed for the floating dock, slim Vehicles/Tools header, compact actions, readable data and generic-art labels. No invented profile, weather, range, fuel level or financial data is shipped.

## 1.1 interface and branding redesign
The user's visual criticism supersedes the earlier claims of design completeness. The new direction is a restrained automotive workspace: original gauge emblem and lowercase wordmark, locally hosted Manrope typography, graphite surfaces, blue primary actions, quieter secondary controls, and deliberately spaced vehicle/metric groups. The floating dock and dropdown header remain on all device sizes; no sidebar is introduced.

The header uses actual line icons and vehicle thumbnails. Garage cards have one primary Open dashboard action, a quiet Edit action and an accessible overflow menu for Archive/Restore/Delete. A designed first-use screen replaces the diamond placeholder. Hero controls, small gradient charts and recent activity with separately aligned amounts improve hierarchy. All screens remain English-only.

Desktop, tablet and mobile screenshots were inspected, including the empty garage and populated garage; they use isolated test data. Native dropdown/modal keyboard paths and light/dark contrast remain checked. User requested Vercel publication initially, then explicitly deferred it; no production deployment was attempted. Visual approval remains the user's judgment rather than an inference from passing tests.

## 1.2 mobile and profile correction
The user's latest mobile instruction supersedes all previous top-bar choices: at phone widths the entire desktop header (brand, dropdowns and theme control) is hidden. The floating dock now lives independently of that header. Mobile starts with page context and an avatar; Home uses its vehicle picker in place of a repeated visual title. Garage and Profile remain reachable through More. Desktop/tablet retain their header.

Profile is a distinct page, not part of the appearance/units Settings form. It provides a local display name, short bio, photo picker, avatar preview, removal and explicit save. Default avatars use a silhouette or initials; no invented identity is shown. Mobile hero/actions, edit icon, typography, card spacing and dock sizing were adjusted as a coherent phone layout. Screenshots use isolated test fixtures; visual quality remains subject to user feedback.

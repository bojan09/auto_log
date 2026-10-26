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

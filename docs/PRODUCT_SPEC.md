# AUTOLOG — COMPLETE CODEX / CLAUDE MASTER IMPLEMENTATION PROMPT

> **Read and follow this entire instruction file. Implement the AutoLog PWA in six sequential phases.** This document is the single source of truth for scope, UX, visual fidelity, architecture, quality gates, and delivery workflow.
>
> **CRITICAL — MANDATORY DESIGN FIDELITY:** The approved design mockups supplied alongside this prompt are implementation specifications, **not loose inspiration**. Reproduce their overall layout, component hierarchy, branding, visual language, dark graphite surfaces, teal/mint accents, vehicle hero area, data cards, chart styling, navigation, spacing, typography, icons, responsive behavior, and premium cinematic automotive character as closely as browser technology and accessible implementation reasonably allow. Do **not** replace them with a generic admin template, plain forms, unstyled charts, or a different design. The mockups contain conceptual/example records and decorative presentation elements; do not hardcode their sample data, misleading values, invented premium subscriptions, or fake functional controls. If a visual detail cannot work in production, document the deviation and implement the nearest usable equivalent.

## 0. FIRST ACTION — ASK FOR THE REPOSITORY

**Before editing files, running initialization, or implementing anything, ask me exactly which GitHub repository / working directory you must use. Do not guess.** Once I answer:

1. Inspect the existing repository and preserve unrelated work; never delete or overwrite user code indiscriminately.
2. **Use the `master` branch only**, for all implementation commits and pushes. Verify branch and remote; do not create a `main`, feature, or other branch. If `master` cannot be used, explain the blocker instead of silently switching branches.
3. Inspect the approved images and this entire prompt before writing application code; document the design interpretation in `docs/DESIGN_SPEC.md`.
4. Maintain project documentation, especially `README.md`, `CLAUDE.md` (when useful for cloud-session handoffs), `docs/PHASE_STATUS.md`, and `docs/TEST_REPORT.md`.
5. Execute phases strictly in order. **After EVERY phase: run all relevant automated and browser tests, audit design fidelity at mobile and desktop widths, fix failures, rerun tests, then commit and push to `origin/master` only after the phase passes.** Finally report completed work, tests, fixes, commit hash, push status, limitations, and the next phase. If blocked or tests fail, report exactly what is blocked and leave the phase uncommitted/unpushed rather than claiming success.
6. Respect any existing git changes. Never force push or discard unrelated changes. If repository access, credentials, or pushes are unavailable, report accurately and preserve work.
7. Use `/caveman` for concise internal progress updates **only if this is an available and legitimate command in your execution environment**; never pretend it exists or allow token saving to eliminate tests, accessibility, or required deliverables.

## 1. PRODUCT VISION AND NON-NEGOTIABLE CONSTRAINTS

**Name:** AutoLog. **Tagline:** Your vehicle's digital maintenance companion. **Goal:** an exceptionally polished, useful, free, privacy-first digital garage that makes vehicle maintenance, fuel costs, history, and ownership insights easy and satisfying.

- Build an installable, offline-capable **Progressive Web App** with **HTML5, CSS3, and vanilla JavaScript ES modules**. No React, Next.js, Vue, Angular, TypeScript requirement, paid infrastructure, cloud accounts, hosted database, or backend.
- **Local-first** architecture: IndexedDB for vehicles, schedules, history, expenses, fill-ups, and attachments; localStorage only for small preferences; Cache API for app shell/assets. The browser's IndexedDB is a local database, not a hosted service. No auto-sync or misleading cloud claims.
- **English (default)** and **complete Macedonian (mk-MK)** translations. Both languages must work across every feature, state, chart, report, form, and validation.
- User can add **unlimited vehicles subject to local browser capacity**, select and edit each one, track each separately, archive/restore and remove with confirmation.
- **The application is free to use:** no premium plan, payment wall, upgrade nags, fake subscription badge, paid dependency, or recurring server charges.
- Complete product experience across **six phases**, each deployable/testable as an incremental milestone.
- Production-quality responsive layouts for mobile, tablet, desktop, keyboard, and touch; meet WCAG 2.2 AA where practicable; respect reduced motion and high contrast.
- Avoid trademark misuse and unlicensed car images/logos. The interface may use factual manufacturer/model names in catalog data; do not copy third-party vehicle photographs or badges without clear rights.

## 2. APPROVED VISUAL REFERENCES — MUST FOLLOW CLOSELY

The user-approved concept images must be inspected and used continuously during implementation:

- **`design/AUTOLOG_MOBILE_REFERENCE.png`** — mobile dashboard, services/timeline, fuel & insights screens.
- **`design/AUTOLOG_DESKTOP_REFERENCE.png`** — desktop dashboard, sidebar, vehicle hero, analytics grid, vehicle switcher, settings.

These files are provided alongside this prompt in the design reference package. If either is missing, **ask for the files before attempting high-fidelity UI work**, but do not reinterpret the design or create an unrelated substitute. Copy them into the repository under `design/` once supplied; keep them for future phases.

### Fidelity checklist

- Product wordmark **AutoLog**, with elegant white `Auto` and mint/teal `Log`, plus a cohesive stylized A icon. Recreate with original vector/CSS artwork (do not extract proprietary marks).
- Premium, dark graphite/near-black backgrounds; elevated rounded dark cards; subtly luminous aqua/teal borders and highlights; disciplined cyan/mint iconography; amber warnings and red overdue states.
- Strong automotive visual centerpiece: selected vehicle appears as a crisp illustration or lawful user photo; hero includes year, model, powertrain, mileage, care indicator, next service, and meaningful quick actions.
- Dashboard composition matches the references: **vehicle hero + concise KPI cards + animated graphs + maintenance preview + service timeline + fuel/expense preview**. Mobile content should be vertically stacked and legible with bottom navigation; desktop should have a left sidebar and responsive card grid.
- Bottom mobile nav: Home, Services, central Add action, Fuel, More. Desktop sections: Garage, Dashboard, Maintenance, Fuel & Expenses, Documents, Insights, Settings.
- Data graphics: radial vehicle-care gauge; teal fuel economy sparkline/line chart; compact spend columns; expense-category donut; colored maintenance nodes/timeline; genuinely interactive filters and details.
- Smooth transitions between vehicle selections, rising odometer digits, appearing chart paths/bars, card hover/tap feedback, success states, minimal tasteful glows; add motion intensity preferences and `prefers-reduced-motion` support.
- Maintain generous padding, visual clarity, responsive proportions, legible typography, touch targets, visible focus rings, and predictable status semantics. Avoid decorative effects that harm readability or performance.
- Do **not** blindly reproduce marketing poster scenery within the working app. The scenic backgrounds are mood-board context; prioritize actual usable screens and frame-rate stability.
- Use placeholder values **only in explicitly marked demos**, never silently as real user records. Never display "Premium" in account settings: the app has no premium membership or accounts.

### Proposed design tokens (tune via screenshot review)

```css
:root {
  --bg: #070e12;
  --surface: #101c22;
  --surface-elevated: #16272d;
  --border: #28424a;
  --text: #f0f8f7;
  --muted: #98aeb5;
  --primary: #34e5ce;
  --primary-deep: #009e91;
  --cyan: #36b7e9;
  --warning: #efb44f;
  --danger: #e86774;
  --success: #35c7a7;
  --radius-card: 18px;
}
```

Implement light mode and accent customization without compromising brand consistency. Use fonts legally distributable and fully capable of rendering Cyrillic Macedonian glyphs; minimize dependencies and support offline font caching. Treat every screenshot comparison as an explicit test: typography, proportions, alignment, active navigation, chart colors, service badges, and mobile ergonomics.

## 3. VEHICLE CATALOG + CUSTOM VEHICLE ENTRY — HIGH PRIORITY

**Users MUST be able to add their own real cars even if the make/model/variant does not exist in the built-in catalog.** Do not restrict users to BMW examples or to a small demo list. This is a practical app for real European vehicle owners.

### Make/model support required at launch

Seed useful offline searchable make/model suggestions (not an exhaustive, authoritative model database) that cover:

- **Fiat** — critically include **Fiat Sedici, model year 2010**, including support for the **2.0 MultiJet diesel 4x4** variant entered manually. Also support common Fiat models such as Panda, Punto, Grande Punto, 500, Tipo, Bravo, Doblo, Ducato.
- **Ford** — Fiesta, Focus, Mondeo, Kuga, Puma, Transit, etc.
- **Volkswagen** — users may search for **Golf** as a model; also Polo, Passat, Tiguan, Touran, Caddy, etc. Do not misclassify "Golf" as a manufacturer.
- **Audi** — A3, A4, A6, Q3, Q5, etc.
- **Mercedes-Benz** — A-Class, C-Class, E-Class, GLA, GLC, Sprinter, etc.
- **BMW** — 1/3/5 Series, X1/X3/X5, M4, etc.
- **Peugeot** — 206, 207, 208, 307, 308, 3008, 5008, Partner, etc.

Optionally seed additional popular manufacturers in North Macedonia and Europe (Opel, Renault, Škoda, Citroën, Toyota, Hyundai, Kia, Nissan, Suzuki, Seat, Dacia) if useful, without ballooning bundle size.

**Fiat Sedici 2010 acceptance scenario:** I must be able to open Garage → Add Vehicle → Fiat → Sedici → 2010 → choose or manually enter diesel / 2.0 MultiJet / 4x4 (and any additional detail) → enter current odometer → choose photo or illustrated silhouette → save → see it in vehicle switching and dashboard → add oil change, fuel log, and due service. Do not hard-code engine specs, power, or service intervals based solely on year/model; let users confirm their own configuration and owner's-manual recommendations.

### Mandatory add-vehicle flows

1. Guided search by manufacturer → model → year → optional generation/trim/engine.
2. **"Can't find your vehicle? Add custom vehicle"** available at every relevant catalog step.
3. Manual details: maker/free text, model/free text, nickname, year, trim, fuel type, optional engine displacement/power/drivetrain, odometer, km/mi, license plate (optional), purchase date, purchase price, currency, color, notes, owner photo/illustration. Support cars, motorcycles, vans, and custom type.
4. Search tolerant of case, spelling variants, localized names, and common queries such as "Fiat Sedici", "Golf 5", "Golf Mk7", "Mercedes C220", "BMW 320d", "Peugeot 308". Do not claim VIN decoding is available without a lawful, accurate offline solution.
5. Editable after creation; allow changing make/model, photo, mileage updates, vehicle status, and custom fields without losing related service history. Avoid destructive data migration.
6. Vehicle switcher, multi-vehicle dashboard, individual per-vehicle analytics and schedules. Include archive/restore and validated deletion/backup warning.
7. Mileage should normally be nondecreasing; corrections to erroneous entries must be deliberately supported and auditable, not silently rejected or overwritten.

### VEHICLE IMAGERY AND INFOGRAPHICS — REQUIRED

The app **must not show the same BMW illustration for every user car**. Cars are a major part of the visual identity. Build a tiered, realistic, offline-capable vehicle visualization system:

**Tier A: original/authorized images or illustrations** for at least the following representative examples: 2010 Fiat Sedici (highest priority), common Fiat hatchback, Ford Focus/Fiesta, VW Golf, Audi sedan, Mercedes-Benz sedan, BMW sedan/coupe, Peugeot hatchback/SUV. Images must correspond to the correct manufacturer/body style and avoid mislabeling a generic vehicle as an exact variant. Document each asset's source and license in `docs/ASSET_CREDITS.md`; if a lawful exact-model asset is unavailable, use a clearly labeled body-style fallback rather than claiming a photo is an exact model. Respect commercial use rights and redistribution restrictions. Do not scrape or hotlink random brand photography.

**Tier B: configurable premium illustrated SVG body styles** (hatchback, sedan, SUV/crossover, coupe, van, motorcycle) with color choices, optional soft shadow, directional parallax, and tappable component hotspots (engine, wheels, brakes, battery, etc.). Use honest generic presentation if model-specific geometry cannot be sourced.

**Tier C: user's own uploaded vehicle photo**, local attachment storage (with resizing/compression and clear privacy/storage messaging); let the user crop/position/replace/reset it. Prefer own photos to generic illustration on that user's dashboard.

Provide make- and model-specific **visual identity** through accurate textual labeling and useful (not invented) metadata, even where 3D assets are unavailable. Provide accessible alternate text. Never imply real-time diagnostics or connect visually highlighted car parts to actual mechanical faults.

### Vehicle-focused infographics

- Car silhouette / photo with clickable/tappable service zones and tooltips tied to logged services.
- Odometer roll animation + historical mileage trend.
- Per-vehicle fuel/repair spending, total cost, and cost per km.
- Per-vehicle service completion and overdue status.
- Wheel/tire rotation and oil change progression, when user logs those intervals.
- Optional cross-vehicle ownership cost comparison with fair date/distance context.

## 4. DATA MODEL AND CORRECTNESS

Establish versioned IndexedDB stores for `vehicles`, `odometerEntries`, `serviceSchedules`, `serviceRecords`, `fuelEntries`, `expenseEntries`, `attachments`, `checklists`, `settings` (or equivalent normalized design). Use stable IDs, vehicle foreign keys, timestamps, careful transaction semantics, schema migrations, and data validation. All summaries should derive from actual stored records.

Important logic:

- A schedule may be time-based, distance-based, or both. If either threshold is reached, mark due; distinguish due-soon, due, and overdue with clearly documented configurable warning thresholds. User-provided service intervals override defaults. Initial intervals should be suggestions, not unverified promises for a given vehicle.
- Finishing a maintenance record records date, odometer, category, cost, garage/provider, notes, attachments, and optional next occurrence; ensure history is preserved and avoid duplicates.
- Fuel logs capture date, odometer, amount (L/gal as localized input), unit price, total paid, full/partial tank, station, optional receipt. Fuel consumption must **not** be inferred from insufficient, inconsistent, or partial-fill data. Explain the methodology and flag insufficient data.
- Expense categories (fuel, service, repair, parts, insurance, inspection, registration, tolls, parking, other); avoid double-counting a maintenance or fuel cost also recorded as an expense. Use an explicit linking/ledger strategy.
- Care score: a transparent **maintenance-record compliance score**, not proof of safety or mechanical health; show contributing factors and “insufficient data” where appropriate. Never simulate diagnostics.
- Use signed-safe, locale-aware numeric inputs for currency/distance; round only for display, not intermediate calculations; handle currency changes without silently converting historic values using imaginary exchange rates. Support MKD and EUR prominently, with user-selected currency and manual exchange handling if ever needed.
- Use relative and absolute dates correctly and support `en` / `mk-MK` locale formatting, clear 24-hour preferences, kilometers/miles and L/100km/MPG as appropriate.

## 5. FEATURES AND INFORMATION ARCHITECTURE

### Garage

Searchable vehicle cards, switching, active vehicle, add/edit/archive/delete, vehicle photo or illustration, recent action summary, quick-add controls, and contextual empty states.

### Dashboard

Balanced hero; vehicle statistics; care score; current odometer; next service; upcoming service feed; monthly/yearly spend; fuel trend; spending donut; recent work; smart, understandable offline insights. Every card must click through to relevant detail.

### Maintenance

Schedule list, due/soon/overdue filters, customizable intervals, rich service completion, service log editing, animated historical timeline, maintenance-zone interaction, receipts, and reminder center.

### Fuel & Expenses

Fill-up form, fuel history, reliable consumption calculations, categorical cost ledger, time filtering, breakdown chart, trend chart, comparison against earlier periods, cost-per-distance, vehicle comparisons.

### Documents

Local attachment gallery with previews for images and supported document formats; metadata, category, linking to vehicle/record, rename/remove, capacity checks, and full backup inclusion when feasible. Make file-type restrictions explicit; do not claim full PDF editing.

### Insights

Interactive dashboard charts, odometer histories, cost trends, service frequency, fuel statistics, understandable per-vehicle care score, annual summaries, helpful plain-language insights. Distinguish trends from diagnostics.

### Settings

English/Macedonian language; dark/light theme, accent choices, optional system theme; unit/currency/date preferences; motion reduced/balanced/enhanced; accessibility settings; vehicle defaults; backups/import/restore; privacy/offline/storage info; PWA install/update info; reminder preferences. No subscription plan.

### Reports and reminders

Print-ready browser PDF output, CSV export, full portable JSON backup and restore (including binary attachments if realistically supportable with size checks), in-app reminders and ICS/calendar export. **Do not promise reliable scheduled notifications when the PWA is fully closed**; unsupported background scheduling must be disclosed. Test offline restoration and cross-session persistence.

## 6. LOCALIZATION CONTRACT

- Primary `en`, full `mk-MK`. Externalize every user-visible text string; no mixed-language hardcoding.
- Maintain `src/i18n/en.js` and `src/i18n/mk.js` or equivalent. Support variable interpolation, plurals, dates, status terms, chart tooltips, error messages, accessible labels, onboarding, reports, backups, units, and maintenance category vocabulary.
- Auto-detect a supported browser language on first launch while using English as fallback/default; manual selection persists. Language changes should update live UI without losing current form state.
- Use appropriate Macedonian terminology including: Garage = Гаража, Maintenance = Одржување, Fuel = Гориво, Expenses = Трошоци, Service History = Историја на сервиси, Settings = Поставки. Have all translations checked for naturalness and consistency, not machine-translated fragments.
- Include i18n completeness tests asserting both catalogs have equivalent keys; test long Cyrillic labels on small screens, focus order, input errors, charts, printed reports, and modal content.

## 7. MOTION / FEEDBACK CONTRACT

Use CSS, SVG, Canvas, or standard Web Animations API; optional lightweight permissively licensed dependency only when justified. Interactions:

- Rolling odometer when logged mileage changes (numeric correctness before animation).
- Vehicle selection smooth transition; fade/parallax/glow, no distracting rotation.
- Chart reveal, donut sweep, spend bar stagger, line drawing, value counter, responsive tooltips.
- Maintenance timeline progressive nodes and service detail expanding.
- Service completion checkmark/confetti-like restrained success (optional enhanced mode).
- Fuel meter fill, drag/tap micro-feedback, bottom navigation active state, skeleton states.
- Tiered motion preference: reduced, balanced, enhanced; respect `prefers-reduced-motion` automatically and permit override to *reduce*, never force excessive movement on a motion-sensitive user.
- Smooth at common midrange devices; pause animation when hidden; avoid layout shifts, scroll hijacking, parallax that obstructs content, and unnecessary animation loops.

## 8. ACCESSIBILITY, SECURITY, PRIVACY, PERFORMANCE

- Semantic HTML; labeled fields, ARIA when necessary, visible focus, keyboard-only completion, screen reader cues; minimum sensible touch targets and readable contrast.
- Store all content locally and never silently upload VIN, plates, invoices, images, or fuel data. Validate attachments and cap dimensions/sizes; use safe rendering (no unsafe `innerHTML` of user-supplied content), strict import schema validation, no code execution from imports, and robust XSS protections.
- Offer backup warnings: uninstalling/clearing site data can erase local records. Handle storage estimates, quotas, private-mode limitations, persistence requests where available, errors, and recovery.
- Work offline after initial successful visit/install on a secure origin; service-worker versioning, safe cache updates, and useful update prompt. Document localhost/HTTPS requirements and PWA installation differences across browsers.
- Avoid unnecessary network requests, trackers, analytics, remote car-image dependencies, and paid APIs. Bundle essential icons/images/data lawfully for offline use.
- Responsive quality targets at 360×640, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, plus landscape mobile. No horizontal overflow; check modals and keyboard-open forms.
- Provide helpful empty/loading/error/offline states and ensure charts have table/text equivalents where needed.

## 9. SIX-PHASE EXECUTION PLAN AND ACCEPTANCE GATES

### PHASE 1 — Foundation, Branding, Garage, Offline PWA

Deliver:
1. Repository audit; project/file layout; core design tokens; reusable UI patterns and routes/screens.
2. Implement responsive mobile/desktop navigation strongly matching **both** reference images.
3. Create original AutoLog mark/wordmark; dark mode first and accessible base styling.
4. English/Macedonian localization infrastructure, switcher, initial complete strings for shipped screens.
5. IndexedDB schema and migration strategy; robust localStorage preferences and data-layer tests.
6. Installable manifest, icons, offline app shell, basic service worker cache/versioning.
7. Full add/edit/list/select/archive vehicle experience, custom vehicle manual entry, **Fiat Sedici 2010** acceptance flow, starting offline brand/model suggestions, vehicle switcher, photo upload fallback and body-style SVG illustrations.
8. Dashboard skeleton with meaningful real data/empty states, not hardcoded BMW user state.

**Phase 1 gate:** Fiat Sedici 2010 custom entry saved, persisted on refresh and offline, switched between another vehicle, both languages work, UI inspected at mobile and desktop dimensions, manifest and app shell offline tested, accessibility smoke tests pass.

### PHASE 2 — Maintenance Scheduling + Service History

Deliver:
1. Service categories, custom schedules, interval unit handling, date/mileage due-soon/overdue rules.
2. Service history CRUD, date/odometer/cost/provider/notes; completion and next interval workflow.
3. Odometer entry log and correction handling; animated timeline with color/label semantics.
4. Upcoming service cards, filters, vehicle-scoped reminders and maintenance dashboard summary.
5. Tests for timezone boundaries, both-threshold schedules, invalid mileage, recurring computations, independent multi-vehicle schedules and edit/delete behavior.

**Phase 2 gate:** Sedici oil/filter service can be scheduled, completed, documented, and next service derived; a VW Golf service remains separate; all tests and screenshots pass.

### PHASE 3 — Fuel Logs, Expense Ledger, Infographics

Deliver:
1. Full and partial fuel entries with unit price, volume, odometer, actual cost, receipt link.
2. Accurate distance and consumption calculations; explain methodology; avoid fake estimates.
3. Categorized costs including insurance, inspection, parking, repairs; no double counting.
4. Animated dashboard expense donut, fuel consumption line, monthly cost bars, filters, per-vehicle summaries, cost-per-distance, real-data empty states.
5. Data calculations and chart interaction tests; large dataset performance checks.

**Phase 3 gate:** Sedici diesel fuel log works in MKD and L/100km; partial fills don't produce misleading efficiency; chart totals reconcile to the ledger; language/units changes work without data loss.

### PHASE 4 — Adaptive Vehicle Visualizations + Premium Motion

Deliver:
1. Tiered vehicle render pipeline: owner-uploaded image → lawful exact-model illustration when available → honest generic SVG vehicle body style.
2. Dedicated **2010 Fiat Sedici** visual asset or explicitly labeled crossover fallback; examples/illustrations for Fiat, Ford, VW Golf, Audi, Mercedes-Benz, BMW, Peugeot. All required licenses/credits checked; prevent brand mismatches.
3. Vehicle component hotspots tied to services (wheels, brakes, engine, fluids, etc.), accessible and responsive.
4. Enhanced dashboard hero, care-score computation/explanation, interactive per-vehicle infographic panels, multi-vehicle transitions.
5. Motion reduced/balanced/enhanced, animations in all relevant screens, performance profiling with slow-device fallbacks.

**Phase 4 gate:** Switching from Fiat Sedici to Golf or BMW visibly changes name and appropriate image/illustration (not a reused BMW), values and charts update, hotspots open real linked maintenance records, keyboard and reduced-motion paths work, screenshot comparisons pass.

### PHASE 5 — Document Vault, Backups, Reporting, Complete Settings

Deliver:
1. Local attachments (images/invoices), preview and size/quota/error handling, record linking.
2. JSON backup export/import, robust schema/version validation, confirmation flows, optional attachment encoding/archive when feasible with transparent size warnings and data-integrity tests.
3. CSV logging exports, print CSS, browser print-to-PDF report pages, clear supported/unsupported output claims.
4. Trip preparation checklists, editable reminders and ICS/calendar export.
5. Full settings for theme, color, units, language, motion, currency, date preferences, storage/privacy, backup, vehicle defaults, install/update.
6. Complete Macedonian strings including exports, reports, settings, help, and errors.

**Phase 5 gate:** Export Fiat Sedici history, clear/rebuild only test data, restore from backup with relationships intact, verify offline document previews and print reports, verify all settings persist, check both languages.

### PHASE 6 — Release Readiness, QA, Optimization, Handoff

Deliver:
1. Full product integration tests, responsive screenshot comparisons versus approved designs, and UX audit.
2. PWA offline install/update/refresh workflows on representative browser engines where testing is feasible; disclose any unsupported platform scenarios.
3. Accessibility checks (keyboard, labels, reduced motion, contrast, screen reader review where possible).
4. Performance improvements, image compression, animation profiling, bundle audit, large-data edge cases, storage failure handling.
5. Security review of imports, uploads and user text; backup recovery proof; data correctness checks.
6. EN/MK translation review, Fiat/Ford/VW/Audi/Mercedes/BMW/Peugeot visual/catalog validation, no wrong-car imagery.
7. Final README and deployment instructions to a free HTTPS static hosting option, troubleshooting, changelog, `docs/ASSET_CREDITS.md`, `docs/DESIGN_SPEC.md`, and complete test report.

**Phase 6 gate:** App is truly useful offline, can create and manage a Fiat Sedici 2010 without a backend, matches approved mobile/desktop designs closely, builds and tests cleanly, and the release report distinguishes verified vs unverified device tests.

## 10. PHASE-END MANDATORY CHECKLIST

For **each** phase, do ALL of the following:

1. Run syntax/lint checks and relevant automated unit/integration tests; implement a basic automated testing setup as needed.
2. Run browser end-to-end user journeys for phase features, with **360×640, 390×844, 768×1024, and 1440×900** representative screenshots; test additional target widths as appropriate.
3. Confirm there are no console errors, broken images, misleading placeholder content, unwanted overflows, dead buttons, keyboard traps, or unsaved form surprises.
4. Compare actual UI to `design/AUTOLOG_MOBILE_REFERENCE.png` and `design/AUTOLOG_DESKTOP_REFERENCE.png`; **fix meaningful visual differences before declaring done**. Record what matches and any legitimate differences.
5. Validate both languages and persistence across refresh; test offline behavior and accessibility for that phase.
6. Update progress and test documentation, include the actual commands and observed results.
7. If tests fail, diagnose, fix, and rerun before commit. Do **not** report an untested phase as complete.
8. Only when all feasible tests pass, commit changes and push to **`origin/master`**, then provide commit hash, branch, push result, completed work, tests, fixes, known limitations, and next step. If remote push fails, disclose failure accurately; do not imply success.

## 11. IMPLEMENTATION STYLE AND QUALITY EXPECTATIONS

- Keep modules small, documented and maintainable; meaningful separation between data, i18n, UI, charts, service logic, vehicle catalog, visualization, storage, and PWA lifecycle.
- Provide realistic default/empty app experiences. Demo mode, if implemented, must be clearly labeled and deletable, and never intermixed with user's actual data.
- Use existing GitHub repository workflows only after obtaining my repository choice. Avoid installing random proprietary tooling or introducing a framework without explicit consent.
- For image references: the user-provided conceptual screenshots and any generated car artwork are for design direction; secure appropriate rights and retain credits for actual bundled vehicle imagery. If artwork is not lawfully available, deliver aesthetically strong SVG generic models and owner-photo upload, and clearly report gaps rather than misrepresenting assets.
- If any ambiguous requirement arises, choose the approach most consistent with privacy, offline support, data accuracy, accessibility, zero required costs, user ownership, and **approved design fidelity**; document the decision.

## 12. REQUIRED FIRST MESSAGE TO ME

Before you start, reply with a short confirmation that you understand (1) the mandatory visual fidelity requirement, (2) vanilla HTML/CSS/JS and offline PWA requirements, (3) EN/MK localization, (4) support for user-added cars including **Fiat Sedici 2010** and Fiat/Ford/VW Golf/Audi/Mercedes-Benz/BMW/Peugeot imagery, and (5) six phases with post-phase testing and `master`-only commit/push. **Then ask me which GitHub repository and working directory to use.** Do not implement anything until I answer.

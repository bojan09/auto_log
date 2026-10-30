# Version 2.0 full presentation rebuild

Syntax checks, 34 unit tests, all twelve browser suites, the legacy-style audit and runtime packaging passed. The release contains 45 files / 739,063 bytes plus .nojekyll. No data schema changed. The four original CSS files were deleted and replaced with six explicit style owners; the final static class-reference audit found no orphan class names.

New tests cover actual monthly fuel purchases, all/selected vehicles, currency separation, elapsed zero-spend months, gallon conversion, deletion recalculation, accessible month drilldown and vehicle-detail history. Responsive screen review covers 360, 390, 700, 768, 820, 1280 and 1440px with no horizontal overflow. Reviewed final dashboard, garage, fuel modes, tablet settings and profile screenshots. Dark/light axe scans include the dashboard/monthly filters and vehicle details, in addition to the existing form/profile/settings scans. Browser scripts record no page errors.

Regression journeys preserve vehicle and finance CRUD, odometer audit/corrections, maintenance recurrence, owner photos, profile/avatar backup recovery, documents, checklists, calendars, CSV/PDF export, worker update/cache cleanup, quota/blocked-storage handling, offline refresh and subpath hosting. Tests now navigate the intended Garage creation entry point and Fuel log tab, retaining persistence/count assertions. The dashboard performance probe measured 354ms with simulated 4× CPU slowdown. This is not a real-device benchmark or a complete accessibility certification.

Evidence: test-results/rebuild/ screenshots and runtime.json; docs/UI_REBUILD_PLAN.md and docs/MATTE_DESIGN_SYSTEM.md. Physical devices, Safari/Firefox and screen-reader verification remain outstanding. Existing state-driven navigation is preserved; this release does not add URL routes. No Vercel deployment result is claimed.

# Version 1.3 guided-entry validation

Syntax checks, 32 unit tests, runtime packaging and all eleven browser suites passed. After final mobile grid/width adjustments, the dedicated entry suite passed again and the runtime was rebuilt: 41 files / 840,596 bytes plus .nojekyll.

New coverage exercises required-field blocking, corrupt-photo rejection/recovery, back/forward value preservation, review values, final save/reload and no page errors. Anchored actions were checked at 360×640, 390×844, 768×1024, 1440×900 and 390×500. Vehicle steps and fuel entry passed dark/light axe WCAG A/AA scans. Fuel actions also remain inside the viewport at phone/tablet/desktop widths. Existing mileage-correction, owner-photo persistence, finance, maintenance, profile, document, backup and offline/service-worker update journeys pass.

Manually reviewed generated phone, tablet and desktop screenshots, including the final mobile two-column Usage section and compact fill-up sheet. Corrected active-step contrast and an older mobile grid rule; increased the distance-unit column to avoid clipped labels. Existing test journeys now navigate the explicit steps and open optional provider/photo sections before interacting; data and persistence assertions remain intact. Screenshots are generated under ignored test-results/entry/. See FORM_DESIGN_REVIEW.md for online research provenance.

Physical phone keyboard behavior, Safari/Firefox and screen readers remain unverified (Firefox/WebKit executables unavailable). Automated scans do not constitute full accessibility certification. No production deployment result is claimed.

# Version 1.2 profile and mobile validation

Syntax checks, 32 unit tests, runtime packaging and all ten browser suites passed. A targeted profile rerun also verified the final crop-fixture assertion. The staged artifact is 39 runtime files / 801,432 bytes, plus .nojekyll.

Profile coverage: separate Profile and app Settings pages; invalid image rejection; 320×320 centered crop from a wide image (pixel check discards outer stripes); name/bio/photo persistence; removal; full JSON backup export/confirmed restore retaining profile separately from preferences; old-backup compatibility; offline avatar decoding; desktop/mobile profile entry points; and no top header/tools on phone widths. Pure validation tests reject remote/executable/spoofed/oversized avatars and unsupported fields.

Profile screenshots cover 320/360/390/768/1440px; dashboard screenshots cover the standard four widths. Reviewed phone and desktop images for the avatar/page header, removed mobile top bar, independent floating dock, smaller vehicle controls and readable form layout. Covered accessibility scans pass in both themes. Minimum dock touch targets, scroll clearance, no horizontal overflow and existing keyboard paths remain checked.

Regression harness changes: the offline button-style locator now excludes the new hidden desktop/mobile avatar counterpart, and finance assertions wait for asynchronously refreshed totals after save. No finance assertions were removed; profile/settings reads are batched with other loaded data. No physical Safari/Firefox or screen-reader verification is claimed. Profile data stays local and does not create a cloud account. Deployment outcome is not claimed by these local checks.

# Version 1.1 branding and interface validation

Syntax checks, 30 unit tests, all nine browser suites, and the runtime build passed. A targeted garage acceptance rerun passed after the final compact card-footer adjustment; a targeted release rerun verifies that the self-hosted font loads from the offline project-subpath artifact. The stage contains 38 runtime files (781,329 bytes), plus a zero-byte .nojekyll.

Changes cover a new gauge/wordmark and install icons, Manrope typography, the desktop/tablet/mobile button hierarchy, card layout, native dropdown presentation, empty state, chart fills/gridlines, and activity amounts. Garage archive/restore/delete tests now open the overflow menu and retain both deletion cancel/confirm assertions; Escape closes the new menu. The test's owner-photo assertion is scoped to garage cards because header dropdowns now also show actual vehicle thumbnails.

All existing data/finance/maintenance/document/backup/offline journeys still pass. Automated light/dark accessibility scans found and corrected one low-contrast light-theme disclosure label. Reference screenshots at 360/390/768/1440px and additional empty/populated garage previews were reviewed; compact touch targets, scroll clearance and keyboard paths remain covered. Preview files are in ignored test-results/previews/ and use isolated fixtures. Actual visual quality remains open to user feedback.

Vercel publication was explicitly deferred by the user. No deployment was attempted; existing physical-device/Safari/Firefox/screen-reader verification limits remain.

# Phase 6 — release validation (2026-10-27)

`npm run check` passed. `npm test` passed 30 tests. All nine browser suites passed in Chromium; after extending the release suite, its targeted rerun also passed. `npm run build` stages 36 runtime files (671,935 bytes) in ignored dist/. `npm audit` reported zero known vulnerabilities.

English-only tests now cover English pages/forms even with a Macedonian browser locale or legacy preference, and both light/dark themes. Removed unused UI translation catalogs while retaining legacy backup preference compatibility. Existing data, catalog body-style mappings and user-entered Unicode remain supported.

Runtime artwork was compressed from 8,117,319 bytes to 455,346 bytes (94.4% smaller). Source PNGs remain for provenance but are not loaded, precached or packaged. Fresh screenshots at 360/390/768/1440px cover garage, dashboard, service, finance, document and settings journeys. Mobile and desktop compressed-artwork screenshots were reviewed against the approved compact reference; the top dropdowns, no-sidebar layout, floating dock, compact buttons and chart hierarchy remain. No broken image, page-error or overflow regressions were observed in the covered journeys. The new release suite also decodes a WebP offline from the packaged project subpath.

Release-specific browser checks: worker installation, old-controller retention during update, waiting worker, update notice, activation after tabs close, obsolete cache deletion and offline refresh; inert HTML-like vehicle text; simulated quota failure with no saved document; blocked IndexedDB recovery message/disabled navigation; saved preference recovery when localStorage is denied; packaged /auto_log/ subpath and offline assets. A registration timing race could miss an already-waiting update notice; registration now checks existing waiting/installing workers as well as future events, and the extended update journey passes.

New unit coverage rejects forged attachment types/trailing base64 content and validates 10,000 linked service records within 3 seconds (about 46 ms observed). Indexed relationship lookups avoid quadratic validation. Existing transaction-abort recovery, CSV formula defense, ICS injection/UTF-8 folding, large fuel datasets, financial reconciliation and full backup relationships pass. Content policy restricts executable scripts/connections to the app origin; document frames remain sandboxed.

Final automated accessibility checks cover the English forms/pages, both themes, keyboard dropdown Escape/modal behavior, dock touch targets and reduced-motion preferences. The 4× CPU dashboard measurement was 315 ms on this runner. Full screen-reader review, real slow networks, physical device install/notch behavior and Safari/Firefox remain unverified; Firefox/WebKit executables are absent. No production publication or manual GitHub Pages workflow run is claimed. See RELEASE_REVIEW.md and DEPLOYMENT.md for release limits and manual hosting steps.

# Compact reference layout validation

`npm run check`, all 28 unit tests, and all eight browser suites passed. Existing garage, maintenance, finance, documents, backups, motion and offline workflows remain covered.

The new reference-layout browser journey checks no sidebar element, a compact top bar, vehicle/tools dropdowns with Escape handling and viewport containment, correct vehicle switching, all four quick-entry forms, and a floating bottom dock at 360×640, 390×844, 768×1024 and 1440×900. Fixture history verifies weighted consumption (9.7 L/100km), exact expense cents (18,400.55 MKD), recent activity, schedule-derived next service and empty/zero states after switching vehicles. No fixture records are shipped in the app.

Desktop/mobile dark-theme and mobile Macedonian light-theme WCAG A/AA scans passed, as did offline reload of the new dashboard/styles. The controls suite continues to cover 320px layout, minimum 44px dock touch targets, scroll clearance and keyboard add/dismiss; its selectors were updated for the header and dock now shown on desktop. The new top bar's light surface was corrected during contrast testing. No page errors or horizontal overflow occurred.

Screenshots in ignored test-results/reference-dashboard-{360,390,768,1440}.png were generated and compared with the user's 1000034610.jpg concept for compact header/dropdowns, panoramic vehicle area, smaller actions, denser data cards, recent activity and floating navigation. Desktop, tablet and mobile images were reviewed. Pixel-identical reproduction is not claimed: illustrations remain honest body-style assets, recorded compliance replaces an invented fuel-level gauge, and trip preparation is a checklist rather than unimplemented GPS tracking. Physical-device/notch behavior and non-Chromium engines remain unverified. Phase 6 is still pending.

# Button and floating navigation refinement

Syntax checks and all 28 unit tests passed. All six existing browser suites passed, followed by the new controls browser suite. New checks cover floating dock clearance at 320/360/390px, at least 44px touch targets, no horizontal overflow, bottom actions scrolling clear of the dock, keyboard add/escape, EN/MK light/dark WCAG A/AA scans, desktop navigation and offline stylesheet availability. The offline style assertion waits for database-backed rendering.

Mobile/desktop garage and dashboard screenshots and light/dark EN/MK settings screenshots were generated and visually reviewed for button hierarchy, destructive styling, floating dock shape, label fit and readable states. Safe-area CSS is included; real notched-device rendering remains unverified. This is a requested design refinement, not completion of Phase 6.

# Phase 5 validation

`npm run check` passed. `npm test` passed all 28 tests. `npm run test:browser` passed all six suites (garage, accessibility, maintenance, finance, visuals and vault). No browser page errors were observed.

New unit coverage: full backup roundtrip with two vehicles, linked PDF and checklist/preferences; invalid versions, missing stores, duplicate IDs, broken relationships, invalid fields, dangerous image data URLs and settings; aborted restore rollback retaining original records; document signature/size/base64 length checks; CSV formula neutralization and quoting; escaped UTF-8 ICS folding and distance-only omission; EN/MK catalog parity. Original finance/maintenance/storage tests continue to pass.

New browser coverage: create Fiat Sedici and recorded oil service; attach linked PDF and image; create and check a dated trip checklist; download ICS; save/reload all preference fields and verify new-vehicle defaults; export JSON, reject invalid JSON, clear only the isolated browser test database, cancel then confirm replacement and recover history/documents/checklist state/settings. Offline image preview decoding, sandboxed PDF source/download availability, CSV content and print-to-PDF generation passed. PDF report content was extracted and its rendered page reviewed for actual service values, currency totals and print-only layout.

Axe WCAG A/AA checks passed for light-theme garage/dashboard/maintenance/finance/settings and Macedonian dark-theme settings/documents/preview. Light-theme labels and a transient navigation background contrast issue were fixed during testing. The Phase 4 motion test now saves the preference explicitly and waits for its asynchronous persistence. Screenshots at 360×640, 390×844, 768×1024 and 1440×900 verify settings layout and no horizontal overflow; additional document screenshots cover mobile and desktop. Mobile and desktop screenshots were reviewed for the navy/mint card design, readable controls and bottom navigation.

Limits: 5 MiB per document; 50 MiB full JSON import/export; files are embedded as base64 and unencrypted. Restore replaces all data atomically, not a merge. Source-record deletion unlinks and retains its document; vehicle deletion removes its documents/checklists. Native PDF rendering is browser-dependent and not claimed as verified PDF parsing; image decoding and download availability are verified. CSV and browser print/Save as PDF are supported, not XLSX or server PDF generation. ICS includes dated reminders only; the closed PWA does not schedule background notifications. Storage persistence and app installation depend on browser permission/support. Physical-device, Safari/Firefox and full assistive-technology testing remain unverified.

# Phase 4 validation

`npm run check` passed; `npm test` passed all 22 tests. Phase 1–3 browser regression suites passed: garage CRUD/photo/offline, EN/MK accessibility, maintenance recurrence/isolation and finance totals/filtering/offline. The additional visuals browser suite passed distinct Sedici/Golf artwork, actual linked service history, empty hotspot history, Escape dismissal, four viewport overflow checks, desktop EN and mobile MK WCAG A/AA scans, persisted motion preference, OS reduced-motion override and simulated two-core fallback. The motion media-query assertion waits for the browser change event.

Screenshots generated at 360×640, 390×844, 768×1024 and 1440×900. Desktop and mobile images were visually reviewed for cinematic hero, car silhouette, navy/blue palette, icon navigation, card density and bottom navigation. The interface preserves honest empty states and visible illustration captions. Tablet review exposed a missing absolute-position rule for the vehicle image; this was fixed and the four-width suite rerun with an artwork-width regression assertion. No horizontal overflow or page errors were observed.

Chromium DevTools 4× CPU slowdown: dashboard navigation/render readiness measured 388 ms against a 10-second regression budget on this runner. This is a local cached interaction measurement, not a mobile hardware or network benchmark. Four original PNGs add approximately 7.8 MiB to initial offline caching. Physical-device install, Safari/Firefox, full screen-reader review and slow-network field performance remain unverified.

# Phase 3 validation

`npm test`: 19 tests passed, including 10 finance tests covering partial/full/missed fills, weighted consumption, volume/distance conversions, currency isolation, source-derived totals, observed-distance coverage, previous periods, validation, persistence/edit audit and 10,000 fill-ups. The large dataset calculation completed in under the 5-second test budget.

`node tests/finance-browser.mjs`: creation of three fills and an expense, 10 L/100km calculation, 8,100 MKD reconciliation, category chart filtering, EN/MK accessibility, offline persistence and four viewport overflow checks passed. Screenshots at 360×640, 390×844, 768×1024 and 1440×900 were generated. Desktop screenshot reviewed for graphite cards, teal bars/line, donut and ledger hierarchy. Phase 1/2 browser regressions also passed.

Consumption requires complete full-to-full intervals entirely within the selected dates; missed fills break the chain. Actual totals remain authoritative over volume × price. Fuel and service costs are read once from their source records; manual expenses cannot use those two categories. Currency totals remain separate. Cost/km is explicitly limited to observed mileage dates; vehicle comparisons display that coverage. Receipts are resized local image previews, not PDF editing. Physical-device and non-Chromium testing remain unverified.

# Phase 2 validation

- `npm run check`: syntax checks passed, including maintenance logic and UI modules.
- `npm test`: 9 tests passed across storage, localization and maintenance.
- `npm run test:browser`: Phase 1 acceptance and accessibility regressions passed; Phase 2 acceptance passed after narrowing a navigation locator that also matched the new dashboard shortcut.
- `node tests/maintenance-browser.mjs`: final Phase 2 journey passed, including EN/MK accessibility scans of the page and schedule dialog.
- Calendar/threshold tests also passed with `TZ=America/Los_Angeles` and `TZ=Pacific/Kiritimati` (2 selected tests per run).

Phase 2 browser coverage: create a Sedici oil/filter schedule; complete and derive next occurrence; filter due states; edit cost; verify Golf isolation; persist across reload; switch languages; reopen and delete a record offline; confirm recurrence rolls back. Core tests cover month-end/leap-year arithmetic, either-threshold semantics, miles/kilometers, invalid intervals/dates/mileage, historical mileage order, atomic record writes, duplicate completion rejection, edit snapshots and schedule removal preserving history.

Screenshots at 360×640, 390×844, 768×1024 and 1440×900 were produced in ignored test-results/. Mobile and desktop screenshots were visually reviewed against the supplied concepts for graphite/mint surfaces, status colors, card borders, timeline markers and responsive navigation. Long explanatory text was collapsed into an accessible disclosure to keep mobile actions visible. A final Macedonian mobile accessibility check exposed transient low contrast during card fade-in; the opacity fade was removed while preserving translation motion. The subsequent scans passed. No horizontal overflow or browser page errors occurred. No unexecuted physical-device, screen-reader or non-Chromium tests are claimed.

Maintenance rules: due on the exact date or distance threshold, overdue after either threshold, due soon within user-configured day/distance warnings. Latest linked service after the schedule baseline determines recurrence; historical records remain stored. Deleting/editing a service never silently reduces the current vehicle odometer; deliberate corrections use Garage. Costs retain their original currency; no currency conversion or ledger totals are introduced here. Inline receipts and attachments remain planned for Documents.

# Phase 1 validation

Commands run in /workspace/auto_log:
- `npm ci --cache /workspace/.npm-cache`: lockfile install passed.
- `npm run check`: JavaScript syntax passed.
- `npm test`: 2 tests passed (IndexedDB schema/persistence/independent records/invalid mileage; EN/MK catalog key parity).
- `npm run test:browser`: acceptance journey and four EN/MK accessibility scenarios passed in system Chromium.

The browser journey creates Fiat Sedici 2010 and VW Golf, switches the dashboard vehicle, archives/restores, uploads a genuine PNG fixture and checks photo persistence after reload, corrects mileage with confirmation, cancels and confirms deletion, opens the localized form, and reloads offline. No page errors were observed. No horizontal overflow at 360×640, 390×844, 768×1024 or 1440×900. Axe WCAG A/AA scans cover the empty garage and modal in both languages. Native dialog supports Escape and focus containment.

Screenshots in ignored test-results/ cover the garage at four widths and dashboard at mobile/desktop widths. Manual review checked graphite/mint colors, original wordmark, hero, cards and navigation against the conversation references. The dashboard is intentionally a Phase 1 skeleton: actual analytics, timeline and rich vehicle presentation arrive in subsequent phases. Generic labeled original artwork replaces the reference's unlicensed BMW photograph; scenic poster framing and Premium account chrome are omitted.

Test fixes: use a valid generated PNG fixture, select the Sedici by identity rather than random IndexedDB ID order, and await database-backed rendering after navigation. These were harness issues; no assertions were removed to mask product failures.

Unverified: physical-device installation, Safari/Firefox, screen reader review, real operating-system update prompts, and production HTTPS hosting. Automated accessibility scans are not a complete accessibility certification. Full six-phase design fidelity is not claimed.

## English-only change
The user's English-only instruction supersedes earlier bilingual requirements. Syntax checks and 28 unit tests passed. A Chromium journey using a Macedonian browser locale and a saved Macedonian preference verified English rendering, removed language controls, and settings save/reload. Legacy backup language values remain readable for compatibility and are normalized to English on use. The earlier bilingual browser suites were not rerun because their language-switch assertions now require revision.

## Vercel output-directory fix
Vercel's build succeeded but looked for `public`. Added explicit static framework, build command and `dist` output configuration, plus service-worker cache revalidation. `npm run build` and a local configuration/artifact integrity check passed. No production deployment result is claimed by these local checks.

## 2.1.0 — navigation, mobile controls and personal appearance
Passed 34 unit tests, syntax checks, runtime build and static stylesheet audit. All fourteen Chromium browser suites passed (the six initial suites followed by the remaining suites after updating assertions for retained hash routes and the intentional button radius change). New coverage verifies identical destination lists at 390/820/1440px, direct routes/Back/reload, explicit service-worker activation, appearance preview/save/reload, backup validation and light/dark accessibility. Reviewed generated mobile maintenance and appearance screenshots. Firefox/WebKit and physical-device verification remain outstanding; no live Vercel verification is claimed.

## 2.2.0 — rounded interface and immediate updates
Passed 34 unit tests and all fourteen Chromium browser suites, including update activation/reload, offline persistence, responsive controls and accessibility. Syntax checks, build and stylesheet audit passed. Visually reviewed the refreshed 390px garage screenshot. Physical-device and live-host verification remain outstanding.

## 2.3.0 — dashboard-first launch and form refinement
Passed 34 unit tests and fourteen Chromium browser suites. Existing garage workflows now use explicit garage URLs; navigation tests verify empty dashboard landing, and the reference suite verifies populated dashboard landing. Fixed a light-theme contrast failure discovered in the final accessibility checks and reran rebuild/navigation/appearance suites successfully. Reviewed mobile dashboard and guided vehicle editor screenshots. Syntax checks, runtime build and stylesheet audit passed. Physical-device testing and live Vercel deployment remain unverified.

## 2.3.1 — cross-page UI audit
All 34 unit tests and fourteen existing Chromium suites passed. An additional UI audit suite passed six-page checks at 320/390/820/1440px, native selection changes, keyboard disclosures, forced-colors fallback and compact empty-state typography. Build, syntax and static stylesheet checks passed. Reviewed the mobile finance screenshot. See UI_AUDIT_2_3_1.md for findings and verification limits.

## 2.4.0 — six everyday workflow improvements
Passed 37 unit tests and all sixteen Chromium browser suites. The new integrated workflow suite covers empty/active quick add, desktop access, vehicle-specific defaults, automatic total/manual override, mileage estimates and calendar downloads, searchable history and receipt downloads, backup request persistence, collapsed empty insights and offline quick entry. Unit coverage verifies forecast units/staleness/corrections and history vehicle isolation/document association. Reviewed mobile quick-add and history screenshots; history overflow checks cover 390/820/1440px and both new views pass axe checks. Build, syntax and stylesheet audit passed. Physical devices, Firefox/WebKit and live Vercel deployment remain unverified.

## 2.4.1 — automatic fuel total
Clean npm installation succeeded using a writable temporary cache. Syntax checks, production build, 37 unit tests and all sixteen Chromium browser suites passed. Expanded entry coverage checks litre/US-gallon/imperial-gallon price labels, read-only calculated totals, repeated volume changes, explicit receipt adjustments, returning to automatic mode and clearing incomplete inputs. Automatic saves recalculate from volume and price. GitHub deployment-status access remains blocked; the failed Vercel check cannot be diagnosed without its error log, and production success is not claimed.

## 2.5.0 — mobile compatibility
37 unit tests and sixteen existing Chromium suites passed. The new seventeenth suite verifies touch entry, portrait/landscape and short viewport sizing, focused-input visibility, 44px close targets, 16px text, simulated overlay keyboard/zoom handling and offline launch. Reran guided-entry tests after the focused-field refinement; they passed. Reviewed the 390×360 form screenshot. Build, syntax and static stylesheet checks pass. Physical iOS/Android and cross-engine testing remain explicitly outstanding.

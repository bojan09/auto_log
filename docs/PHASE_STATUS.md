# Phase status

## Phase 1 — Foundation and garage
Implemented the vanilla JS app shell, original branding, responsive sidebar/bottom navigation, English/Macedonian shipped screens, IndexedDB v1 schema, offline asset cache, install manifest/icons, update notice, storage failure messaging, manual/custom vehicle entry and make/model suggestions. Vehicles can be edited, selected, archived/restored and permanently deleted with confirmation. Photos are validated/resized and stored locally; six original generic body-style SVGs provide labeled fallbacks. Mileage edits retain audit values and require confirmation for decreases/unit changes.

The dashboard uses actual mileage and explicit empty service/compliance states. It has a vehicle switcher and mileage history. Fuel and expense tracking are available in Phase 3; no sample records or computed maintenance score are invented.

Validation evidence: docs/TEST_REPORT.md. Browser installation on physical devices remains unverified; the automated evidence covers Chromium.

## Phase 2 — Maintenance and service history
Completed customizable time/distance schedules, categories, due/soon/overdue filters, vehicle-specific reminders and upcoming dashboard cards. Service records include date, odometer, cost/currency, provider and notes. Completing linked work advances the next interval; edits/deletions recalculate it from remaining history. Date arithmetic clamps month ends and uses date-only UTC arithmetic. Mileage uses explicit units, chronology validation, atomic current-reading updates, and retained edit snapshots. Duplicate completion is rejected. Deleting a schedule preserves its history; deleting a vehicle removes its associated maintenance records atomically.

English/Macedonian screens, offline cache updates, responsive colored timeline, keyboard-native dialogs and accessibility checks are included. The Phase 1 workflows still pass. Detailed test evidence and physical-device/browser limits remain in TEST_REPORT.md. Attachments, exports and system reminders remain later-phase work.

## Phase 3 — Fuel and expenses
Implemented full/partial fuel entries, missed-fill markers, receipt images, unit/currency handling, editable independent expenses, source-derived ledger, weighted full-to-full consumption, monthly bars, consumption lines, category donut, date/currency filters, category drill-down, previous-period totals, observed cost/km and contextual vehicle comparisons. Charts show at most 24 recent points while totals cover the full selected period. Pagination bounds displayed history. Data stays local and works offline.

## Phase 4 — Vehicle visuals and design refresh
Implemented the latest navy/blue reference direction: compact horizontal desktop icon navigation, alpine road hero, original realistic body-style illustrations, bounded garage cards, mobile bottom navigation and two-column metrics/actions. Owner photos take priority; generic illustrations are explicitly labeled. Body-style selection covers the requested makes without claiming exact-model photography.

Engine/fluid, wheel/brake and battery buttons open actual vehicle-specific service records. The maintenance compliance gauge explains configured schedules, current counts, due-soon treatment and its limits. Reduced/balanced/enhanced motion preferences persist; OS reduced-motion and low CPU-core counts override animation, and hidden tabs pause it. Existing finance infographics retain real per-vehicle data.

## Phase 5 — Documents, recovery, reports and settings
Implemented a local document vault with PNG/JPEG/WebP/PDF uploads (5 MiB each), image previews, browser-dependent sandboxed PDF previews and downloads. Documents can link to service, fuel or expense records. Removing a source record keeps its file as a vehicle document; deleting a vehicle removes its documents and checklists.

Versioned full JSON backups include every IndexedDB store, photos, embedded receipts/documents and preferences. Import validates structure, values, relationships, image data types and duplicate IDs before a confirmed atomic replacement; there is no merge. Maximum import/export size is 50 MiB, with visible size/privacy guidance. CSV history exports protect against spreadsheet formula execution. A printable vehicle history report keeps currencies separate and supports browser Save as PDF. No XLSX or server-generated PDF is claimed.

Editable trip checklists retain completion state and reminder dates. ICS exports include dated maintenance schedules and trip reminders; distance-only schedules are omitted and background notifications are not promised. Settings cover language, dark/light/system theme, blue/mint actions, motion, default vehicle units/currency/fuel/body, fuel volume/consumption display, report date format, storage estimates/persistence and install/update guidance. Existing record units and currencies are never rewritten.

## Phase 6 — Release readiness
Completed English-only regression updates, removed unused interface translations, compressed runtime artwork by 94.4%, added runtime-only release packaging, and reviewed keyboard/accessibility/design behavior. Hardened imported-document signatures and large-backup lookups; verified quota/blocked-storage handling and preference recovery without localStorage. Worker install/update/waiting/activation/cache cleanup and offline subpath deployment have browser coverage.

Validation: 30 unit tests, nine browser suites, syntax checks, runtime build and dependency audit passed. Release and deployment documentation distinguish verified Chromium behavior from outstanding physical-device, screen-reader, Firefox/WebKit and real-hosting checks. All six implementation phases are complete within that scope. Publication is a separate manual action using the provided master-only workflow.

## Guided entry refinement — 1.3
Vehicle creation/editing now uses three stages with final review, optional details and live previews. Fuel/expense/service/schedule forms use grouped fields and anchored actions, including mobile bottom sheets. See FORM_DESIGN_REVIEW.md for the inspected Porsche guidance and network limitations. English-only behavior and local storage remain in effect.

## Full matte UI rebuild — 2.0
Completed discovery and six rebuild/verification phases. Removed the legacy CSS stack; rebuilt the shell, dashboard/monthly fuel, garage/details, fuel/expense workspaces, maintenance, ownership tools, statistics, settings and profile. All 34 unit tests and twelve browser suites pass. See UI_REBUILD_PLAN.md for phase commits and MATTE_DESIGN_SYSTEM.md for the final architecture and intentional scope.

## Navigation and personal appearance — 2.1
Shared feature directory and hash navigation resolve desktop/mobile parity, direct links and Back/reload behavior. Empty destinations explain the need for a vehicle. Updates have an explicit activation button that protects open editors.

Settings now offer eight accent colors, five surface palettes and five background finishes with an isolated preview. Preferences retain backup validation and local persistence. Mobile workspace headers put actions below identity, tabs use compact segmented styling, quick actions have colored icon tiles, and empty spending charts use less vertical space. Mobile navigation remains bottom-only.

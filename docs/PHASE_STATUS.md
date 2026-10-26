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

## Next
Phase 4: vehicle visualization and motion. Phases 4–6 remain unimplemented. Phase 4 adds richer model imagery, hotspots and motion. Phase 5 adds full settings, backup/export and document management.

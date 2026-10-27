# AutoLog complete presentation rebuild

Repository: /workspace/auto_log — bojan09/auto_log — master. Approved reference: matte charcoal automotive dashboard supplied October 27. User instructions override document: English only; mobile bottom navigation only.

## Phases
0. Audit and baseline: inventory routes, presentation dependencies and protected workflows; capture baseline screenshots and run existing tests.
1. Foundation: delete style.css, controls.css, reference.css and forms.css. Replace with explicitly owned tokens.css, base.css, shell.css, components.css, pages.css and editors.css. Rebuild global shell; preserve native controls, focus, print and offline assets.
2. Dashboard: new showcase and metrics composition, actual monthly fuel purchases with year/vehicle/currency filters and drilldown; no invented fuel level or weather.
3. Vehicles and fuel: new garage card structure, vehicle detail flow, entry layout and finance workspace.
4. Ownership: rebuild maintenance schedule/history composition, expense presentation, trip checklists, documents and reminders without inventing a GPS trip tracker.
5. Personal workspace: rebuild statistics/reports, settings and profile composition; shared empty/error states and appearance preferences.
6. Verification: screenshots at 360/390/768/820/1280/1440 and intermediate widths; accessibility, persisted records, PWA/offline, dead-style audit, build and performance evidence.

Each implementation phase receives relevant checks and a separate commit/push. Final verification runs all regression suites. No schema change or record deletion is planned.

## Audit
Current routes: garage, dashboard, services, fuel (combined fuel/expense analytics and ledger), more (documents, calendar, trips, reports, backup, settings, install), profile. Vehicle editing is a three-stage dialog. Profile avatar and vehicle photos are local. Navigation is state-driven with no existing deep-link support. No cloud accounts, weather, tank sensor or GPS trip history exists.

Legacy presentation: reference.css imports controls.css in a layer, which imports style.css; forms.css adds another override layer. All four must be removed from the runtime and repository. JS inline styles used for chart data/colors and compliance gauge need replacement or explicit data-driven ownership.

Protected: IndexedDB schema/records, archive/restore/delete confirmations, mileage audit/correction, maintenance recurrence and chronology, fuel cycles and currency separation, backup restoration, documents, profile/avatar, user preferences, native dialogs, keyboard controls, reduced motion, print, service worker updates and offline project-subpath hosting.

No UI/UX skill is installed; apply the approved reference and explicit sizing contract manually. Existing local artwork remains clearly labeled and owner photos take precedence. No new image licensing claims.

## Phase 0 evidence
Baseline syntax, 32 unit tests, build and all eleven browser suites passed on 1abb549. Baseline journeys generated desktop/tablet/phone screenshots in test-results. Working tree was clean before this plan. Remote and master branch verified. Runtime/network skill read; managed environment connected.

## Phase 1 evidence
Deleted all four legacy stylesheets (over 5,000 lines). New design files are independently authored; no old stylesheet imports remain. Rebuilt header/navigation placement and shared primitive/editor styles. Syntax/build, dark/light accessibility, all entry steps at five viewports and dock/keyboard/offline control checks passed. Desktop creation is now the page's Add vehicle action, so the old duplicate-header-plus assertion was updated; its creation/keyboard coverage remains. Reviewed the new mobile editor screenshot.

## Phase 2 evidence
Rebuilt the overview component and showcase composition. Added twelve-month fuel purchases with vehicle/year/currency filters, current month/YTD/average, accessible month buttons and actual-record drilldown. Zero-spend elapsed months are included in the labeled average; future transactions are excluded. Chart palette is restrained. Syntax/build, 34 unit tests (including mixed currency/vehicle, zero months, gallon conversion and deletion recalculation), and the dashboard/quick-action/accessibility/offline browser suite passed. Reviewed desktop screenshot and reduced hero height to keep the dashboard compact.

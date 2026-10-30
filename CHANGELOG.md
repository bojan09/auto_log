# Changelog

## 2.0.0 — 2026-10-27

- Deleted the four legacy stylesheets and rebuilt the presentation with six explicit style owners.
- Rebuilt the desktop/mobile shell, matte palette, flat road emblem and install icons.
- Rebuilt dashboard, garage cards, vehicle details, fuel/expense workspaces, maintenance, trip preparation, documents, statistics, settings and profile layouts.
- Added actual monthly fuel purchases with year/vehicle/currency filters and month drilldown.
- Preserved local records, finance calculations, maintenance logic, backups and offline operation.
- Added seven-width screen review and finance/detail regression coverage.

## 1.3.0 — 2026-10-27

- Replaced the long vehicle form with Vehicle, Usage and Review steps, optional sections and a live preview.
- Added compact grouped fuel, expense and maintenance forms with anchored actions.
- Tuned responsive dialogs for desktop/tablet and bottom sheets for mobile; retained local/offline storage and existing image validation.
- Added responsive entry, validation recovery and accessibility regression coverage.

## 1.2.0 — 2026-10-27

- Added a separate Profile page with display name, bio, avatar upload/removal and initials fallback.
- Included local profiles in backups while preserving restore compatibility with older backups.
- Removed the top navigation bar on mobile and moved the bottom dock outside the desktop header.
- Added a contextual mobile avatar, simpler vehicle picker, lighter quick actions and compact vehicle controls.
- Kept Garage and Profile accessible through More on mobile.

## 1.1.0 — 2026-10-27

- Replaced the A mark with an original gauge emblem, wordmark and matching app icons.
- Added locally hosted Manrope with its OFL license.
- Redesigned buttons, dropdowns, floating dock, vehicle cards, first-use screen and dashboard hierarchy across desktop/tablet/mobile.
- Moved secondary vehicle operations into a keyboard-accessible menu.
- Added chart fills/gridlines and clearer recent-activity amounts.
- Vercel publication deferred by the user.

## 1.0.0 — 2026-10-27

- English-only local vehicle garage, maintenance schedules/history, fuel and expenses.
- Compact dropdown header and floating bottom navigation following the supplied design.
- Original generic vehicle artwork, service history zones, explained compliance and motion preferences.
- Local document vault, full JSON backup/restore, CSV/ICS exports and printable reports.
- Optimized WebP artwork, safer import validation, linear relationship checks and storage-failure recovery.
- Tested offline update lifecycle and project-subpath release packaging.
- Added manual deployment workflow, troubleshooting and verification limits.

## 2.1.0
- Shared navigation destinations, direct hash URLs, Back/reload support and contextual empty screens.
- Eight accents, five surface palettes and five solid/gradient finishes, with preview before save.
- Mobile action-row, tab and quick-action refinements; compact empty charts.
- Explicit service-worker update activation and cache revalidation without deleting user records.

## 2.2.0
- Rounded controls and floating navigation, scenic garage cards and a navy/ocean default.
- Compact update prompt with progress feedback and immediate reload.
- Settings can apply a waiting update; removed outdated close-all-tabs update guidance.

## 2.3.0
- Open Dashboard on launch while preserving direct destination links.
- Refined dashboard vehicle showcase, summary cards and charts.
- Consistent rounded inputs and form sections across the app, with guided editor styling and mobile numeric keyboard hints.

## 2.3.1
- Standardized inset select and disclosure chevrons while preserving native control behavior.
- Reduced empty finance metric typography, fixed mobile selector width and filter action alignment.
- Reserved space for long dashboard vehicle descriptions beside the edit control.

## 2.4.0
- Quick-add sheet for fuel, service, expense and vehicle, available from mobile + and desktop Tools.
- Dashboard prioritizes due maintenance/recent activity and collapses empty spending insights.
- Vehicle-specific entry defaults and automatically calculated, editable fuel totals.
- Labelled mileage forecasts and calendar export from Maintenance.
- Searchable vehicle history with receipt/document access.
- Dashboard backup export and 30-day reminders with the last export-request date.

## 2.4.1
- Fuel price labels now follow litres, US gallons or imperial gallons.
- Total paid is calculated automatically and read-only by default; changes to volume/price recalculate it, and clearing either input clears the result.
- Receipt discounts/rounding require an explicit adjustment option; existing adjusted records retain their values.
- Save recomputes automatic totals instead of relying on a manually populated total field.

## 2.5.0
- Improve touch targets and input sizing on mobile and landscape touch devices.
- Keep phone forms and focused fields visible in reduced or keyboard-overlay viewports.
- Add compact short-screen editor headers, display-cutout padding and modal scroll locking.

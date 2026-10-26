# AutoLog

A free, local-first vehicle garage and offline PWA built with HTML, CSS and vanilla JavaScript. Phases 1–5 provide English/Macedonian screens, custom vehicles (including Fiat Sedici 2010), photos, body-style illustrations, vehicle switching, edit/archive/restore/delete, mileage history and offline persistence. Maintenance adds time/distance schedules, due filters, recurring service completion, cost/provider/notes history and vehicle-specific reminders.

## Run
Requires Node 24+ for development checks and Python 3 for the static server.

```sh
npm ci
npm start
```

The server uses port 8080. Production deployment requires HTTPS; localhost is supported for development. Publish the repository's app assets to static HTTPS hosting with relative paths preserved. No build, backend, account, paid API or runtime package dependency is required. Do not publish node_modules, test-results or developer tests.

## Check
With the server running:

```sh
npm run check
npm test
npm run test:browser
```

Browser tests default to `/usr/bin/chromium`; set `CHROMIUM_PATH` for another installed Chromium executable. Screenshots go to ignored test-results/.

## Storage and limitations
Vehicle records and resized photos stay in IndexedDB. Small preferences use localStorage. The service worker caches the app shell and original assets after an initial successful online load. Clearing site data removes records; export a full JSON backup from More → Backup & restore before clearing site data. Backups contain private, unencrypted data. Restore replaces all local data after validation and confirmation; it does not merge. Install controls appear only when the browser supports its install event; other browsers may offer installation through their menus. Updates activate after all old tabs close. No scheduled background notifications or cloud synchronization are promised.

Phases 1–5 are implemented. Fuel logs, expenses and charts are available. The redesigned navy/blue interface includes original vehicle illustrations, service-zone history, an explained maintenance compliance gauge and motion preferences. More includes Documents, trip checklists, settings, CSV exports, printable history and JSON backup/restore. Documents accept PNG/JPEG/WebP/PDF up to 5 MiB each; backups are limited to 50 MiB. PDF preview depends on the browser and always includes a download link. Calendar export includes date-based reminders, not background notifications. Phase 6 release hardening remains. See docs/PHASE_STATUS.md, docs/TEST_REPORT.md, docs/DESIGN_SPEC.md and docs/ASSET_CREDITS.md.

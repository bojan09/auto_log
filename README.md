# AutoLog

A free, local-first vehicle garage and offline PWA built with HTML, CSS and vanilla JavaScript. Phases 1–3 provide English/Macedonian screens, custom vehicles (including Fiat Sedici 2010), photos, body-style illustrations, vehicle switching, edit/archive/restore/delete, mileage history and offline persistence. Maintenance adds time/distance schedules, due filters, recurring service completion, cost/provider/notes history and vehicle-specific reminders.

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
Vehicle records and resized photos stay in IndexedDB. Small preferences use localStorage. The service worker caches the app shell and original assets after an initial successful online load. Clearing site data removes records; full backup export is planned for Phase 5. Install controls appear only when the browser supports its install event; other browsers may offer installation through their menus. Updates activate after all old tabs close. No scheduled background notifications or cloud synchronization are promised.

Phases 1–3 are implemented. Fuel logs, expenses and charts are available. Richer vehicle visuals, reports and complete settings follow in later phases. See docs/PHASE_STATUS.md, docs/TEST_REPORT.md, docs/DESIGN_SPEC.md and docs/ASSET_CREDITS.md.

# AutoLog

An English-only, local-first vehicle maintenance PWA. Track vehicles, mileage, service schedules/history, fuel consumption, expenses, documents and trip checklists without an account or backend. Desktop and tablet use a dropdown header. Mobile has no top navigation bar: the vehicle picker or page title sits beside an avatar, and navigation stays in the floating bottom dock. Vehicle entry uses three focused steps with a final review. Fuel, expense and service forms use grouped fields with visible actions, alongside the gauge identity, self-hosted Manrope typography and compact controls.

## Develop

Requires Node 24+, npm, Python 3 and Chromium for browser tests.

```sh
npm ci
npm start
```

Open http://localhost:8080. In another terminal:

```sh
npm run check
npm test
npm run test:browser
npm run build
```

Browser tests use `/usr/bin/chromium` unless `CHROMIUM_PATH` is set. Tests create isolated browser data and screenshots/PDFs in ignored `test-results/`. The release build copies only runtime files into ignored `dist/`; no bundler or runtime package dependency is required.

## Deploy

See [deployment instructions](docs/DEPLOYMENT.md). The manual GitHub Pages workflow publishes `dist/` from `master` only when explicitly started. It has not been run by Codex. HTTPS is required for installation and offline caching outside localhost.

## Profile

Open the avatar button or More → Profile to edit a separate local profile. Add a display name, short bio and your own PNG/JPEG/WebP photo up to 5 MiB. Photos are cropped to a 320px square; removing/changing a photo takes effect after Save profile. Profile data is included in JSON backups. Appearance, units and storage controls remain on the separate app settings page.

## Data and recovery

Records, document files and resized owner photos stay in IndexedDB. Preferences use localStorage with an IndexedDB fallback. No analytics, account, paid API or cloud synchronization is included. Back up through Tools → Backup & restore before clearing browser data, uninstalling or moving to another origin/browser. Backups are unencrypted private files.

Full JSON restore validates schema, records, relationships and encoded documents, then replaces all local data in one transaction after confirmation. It does not merge. Files are limited to 5 MiB each and full backups to 50 MiB. Document types: PNG/JPEG/WebP/PDF. Image previews work offline; native PDF rendering depends on the browser, with download available. CSV and browser print/Save as PDF are supported; XLSX and server-generated PDFs are not.

Fuel economy uses complete full-to-full intervals; partial/missed fills and unit conversions are handled explicitly. Totals remain separate by currency. Maintenance compliance measures recorded schedules and does not diagnose mechanical health. Car artwork is labeled generic; owner photos take priority. Trip preparation provides checklists and dated calendar exports, not GPS tracking. Closed-app background reminders are not promised.

## Release evidence

All six implementation phases are complete within the verified Chromium scope. Thirty-two unit tests and ten browser suites pass, including offline recovery, update activation, accessibility, compact layouts and failure handling. Runtime artwork is 94.4% smaller than the source PNGs; the current staged release totals 801,432 bytes. Original PNGs remain in source control for provenance and are excluded from `dist/` and offline caching.

Firefox, WebKit, physical-device installation/notches and full screen-reader review remain unverified. See [test report](docs/TEST_REPORT.md), [release review](docs/RELEASE_REVIEW.md), [phase status](docs/PHASE_STATUS.md), [design](docs/DESIGN_SPEC.md), [credits](docs/ASSET_CREDITS.md) and [changelog](CHANGELOG.md).

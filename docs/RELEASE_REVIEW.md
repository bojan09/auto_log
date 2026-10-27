# AutoLog 1.0 release review

## Verified scope

Chromium on the managed Linux runner. English UI is enforced even for a Macedonian browser locale or legacy saved preference. Non-English user-entered record text remains valid data. English is the only shipped interface catalog; old backup language values remain import-compatible.

The full journeys cover garage CRUD/photo persistence, mileage corrections, multi-vehicle isolation, schedule recurrence and rollback, full/partial fuel calculations, source-derived expense reconciliation, filters/charts, linked documents, editable checklists, ICS/CSV/print reports, complete backup restoration and persisted preferences. Screenshots cover 360×640, 390×844, 768×1024 and 1440×900, with additional 320px floating-dock checks.

## Performance and assets

Original artwork: 8,117,319 bytes. Optimized runtime WebP: 455,346 bytes (94.4% smaller). Transparency is preserved and existing generic-image labels remain. The complete staged runtime is 36 files / 671,935 bytes, plus a zero-byte `.nojekyll`. Source PNGs and developer dependencies/tests are excluded from publication. Local 4× CPU dashboard readiness measured 315 ms during the final regression run; this is a cached runner measurement, not a mobile network benchmark. A 10,000-record linked backup validates within the 3-second budget (about 46 ms on this runner); the existing 10,000-fill finance check also passes.

## Security and failure review

- User-facing names/notes use textContent; a browser injection fixture remains inert.
- Imported photos accept only embedded raster image URLs; SVG/remote/executable image references are rejected. Documents are bounded, base64-length checked and signature checked on upload and import. PDF frames remain sandboxed with download fallback.
- Backup validation precedes writes. Restore clears/repopulates all stores inside one transaction; abort testing preserves original records. Relationship lookups now use maps so large imports avoid quadratic scans.
- CSV quotes cells and neutralizes formula prefixes. Calendar output escapes text and folds UTF-8 lines; newline-injection coverage passes.
- A self-only content policy restricts scripts, connections, forms and embeds. Inline styles are allowed for generated chart/gauge styling; executable inline scripts are not allowed. There are no runtime remote APIs or tracking scripts.
- Blocked IndexedDB displays a clear recovery message and disables navigation. Simulated quota failure produces a visible failed-save state. When localStorage is blocked but IndexedDB works, saved settings recover after reload.
- Worker installation precaches the complete shell. Update tests exercise waiting, keeping the old tab usable, activation after tabs close, old-cache cleanup and offline refresh. IndexedDB records are not cleared by app updates.
- `npm audit` reported zero known dependency vulnerabilities at the time of this release review. This is a registry advisory check, not a guarantee against unknown issues.

## Design and accessibility

Reviewed compressed-asset screenshots against 1000034610.jpg: slim dropdown header, no sidebar, floating dock, compact action buttons, panoramic hero and dense cards remain. Real data replaces the concept's invented name/weather/range/fuel-level values. All requested makes have appropriate body-style selection rather than a universal BMW picture; the assets are not exact-model photos.

Automated WCAG A/AA scans pass for the covered pages/dialogs and light/dark themes. Keyboard menu Escape, modal containment, add/close, dock touch targets, overflow, reduced-motion overrides and hidden-tab animation behavior have coverage. Automated scans do not replace human assistive-technology testing.

## Outstanding manual/platform checks

Firefox and Playwright WebKit executables are not installed in this environment. Safari/Firefox rendering, real screen readers, Android/iOS install/update UX, notched-device safe areas and slow mobile networks remain unverified. Native PDF display is browser-dependent. No real HTTPS deployment or GitHub Actions publication was performed. A manual workflow and deployment checklist are provided for that final publication step.

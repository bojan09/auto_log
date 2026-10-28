# AutoLog 2.0 presentation system

The October 27 matte-charcoal reference supersedes earlier neon/teal or glossy design specifications. The direct user requirements remain English-only and bottom-only navigation on phones. There is no sidebar.

## Ownership

- `src/design/tokens.css`: font, semantic palette, light/dark/accent preferences.
- `base.css`: native elements, focus, dialog/print foundations, reduced motion.
- `shell.css`: top bar, menus, mobile dock, page container.
- `components.css`: cards, shared actions, metrics, charts and statuses.
- `pages.css`: explicit garage, showcase, fuel, ownership and personal workspace layouts.
- `editors.css`: guided vehicle editor and compact grouped record editors.

All four old stylesheets were deleted. None are imported or shipped. `node scripts/audit-ui.mjs` checks the runtime manifest, explicit stylesheet ownership, forbidden legacy files/imports and a static class-reference audit. The static audit is a useful guard, not proof that every CSS rule executes in every browser. Conditional responsive, print and accessibility rules are retained deliberately.

Version 2.1 adds eight accent colors, five independent surface palettes, and solid/aurora/ocean/sunset/spotlight backgrounds. These work in light and dark themes. Primary buttons use a restrained shadow; surfaces remain opaque for readable content. This intentionally supersedes the original no-gradient restriction following the user’s personalization request. Vehicle imagery appears in showcase/cards/details; owner photos take precedence over labeled body-style illustrations. The original flat A/road emblem and raster install icons use the same palette. Motion preferences remain stored; the presentation avoids decorative animation.

## Workspaces

Dashboard combines a bounded showcase, odometer/next-service summaries, quick actions, actual expense/economy metrics, monthly fuel purchases and recent activity. No weather, fuel-level sensor or sample totals are fabricated.

Fuel & expenses has Overview, Fuel log and Expenses views. Filters and add actions stay available; category chart drilldown selects Expenses. Desktop Expenses navigation opens that view. Vehicle details show specs and actual service/fuel/expense history. Maintenance separates upcoming schedules from history. Trip preparation remains the existing checklist/calendar workflow. Statistics combines monthly fuel purchases with existing exports and printable reports. Profile and Settings remain separate.

The monthly fuel chart filters transaction dates, vehicle and currency. Its average includes zero-spend months through the current incomplete month, or all twelve months for historical years. Future transactions are excluded from an as-of report. Gallons convert to liters for purchase totals. Months expose accessible names/tooltips and click/tap drilldown. These are purchases, not inferred consumption; full-to-full economy logic remains separate.

## Intentional limits

Hash routes preserve destinations across reloads and browser Back. Desktop tools and the mobile All features directory expose the same destination registry. No GPS trips, currency conversion, cloud account, weather feed or closed-app notifications are invented. Device-stored records and backup formats are preserved. Firefox/WebKit, physical phone keyboards and screen-reader review need device verification.

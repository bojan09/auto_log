# Guided entry design — 1.3

The supplied phone screenshot showed a long, undifferentiated vehicle form with actions outside the visible area. This revision makes vehicle entry three short stages: Vehicle, Usage, Review. Photo/identity, purchase details and notes are optional disclosures. Completed stages can be revisited without losing input. A live vehicle preview supports tablet and desktop; on phones it appears at review. Only final confirmation writes a record.

Fuel, expense, service and schedule editors share compact grouped fields, contextual headings, an intentional close control and an anchored action bar. Mobile uses a bottom sheet with internal scrolling and safe-area spacing. Desktop uses a bounded dialog. Inputs retain native semantics and validation; photo errors reveal their field, and invalid images cannot advance. The mobile viewport requests keyboard resizing where supported; physical keyboard behavior remains unverified.

## Sources actually inspected

Porsche's public design-system repository provided online automotive UX guidance:

- [Stepper usage](https://github.com/porsche-design-system/porsche-design-system/blob/main/packages/storefront/src/app/(main)/components/stepper-horizontal/usage/page.mdx): short logical steps, clickable completed steps and a recommended three to five stages.
- [Text input usage](https://github.com/porsche-design-system/porsche-design-system/blob/main/packages/storefront/src/app/(main)/components/input-text/usage/page.mdx): explicit concise labels and validation feedback.
- [Modal usage](https://github.com/porsche-design-system/porsche-design-system/blob/main/packages/storefront/src/app/(main)/components/modal/usage/page.mdx): bounded desktop dialogs, multiple intentional dismissal paths and a bottom action bar.

Live Porsche, Polestar and Lucid websites were blocked by this environment's network policy. No claim is made to have visually reviewed those live sites. No manufacturer code, branding or assets were copied. The existing AutoLog navy/blue direction and the user's automotive reference images guide the appearance.

Screenshots from the automated journeys are generated under ignored `test-results/entry/` at phone, tablet and desktop sizes. They include a short-height phone case and fuel entry. Actual Safari/Firefox, physical devices and screen-reader testing remain outside this verification.

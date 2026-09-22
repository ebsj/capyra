# Site and webapp use stock shadcn/ui

`apps/site` and `apps/web` render exclusively with **shadcn/ui** components from `packages/ui`, including the **default theme**. Do not fork components, add a parallel design system, or invent Capyra color/radius/type tokens for the UI. Compose screens from stock pieces.

Brand illustration is separate: logo and mascots live in [`docs/design/`](../design/README.md) and may appear on the site, webapp, PDF reports and Resend email. PDF cover is the capybara mark plus the word “Capyra” in the default typeface — not a color palette. Do not derive a custom shadcn theme from those drawings.

A custom theme would look more like a brand and would slow every screen. Stripe Checkout stays outside this rule — it is not a shadcn surface. The site may import `packages/ui` and still must not import `apps/web` or `apps/api`.

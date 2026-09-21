# Site and webapp use stock shadcn/ui

`apps/site` and `apps/web` render exclusively with **shadcn/ui** components from `packages/ui`, including the **default theme**. Do not fork components, add a parallel design system, or invent Capyra color/radius/type tokens for the UI. Compose screens from stock pieces.

A custom theme would look more like a brand and would slow every screen. PDF reports, Resend email and Stripe Checkout stay outside this rule — they are not shadcn surfaces. The site may import `packages/ui` and still must not import `apps/web` or `apps/api`.

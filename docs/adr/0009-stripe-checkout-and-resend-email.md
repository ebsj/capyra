# Stripe for checkout; Resend for mail

The `billing` port is Stripe (Checkout / Billing, BRL, recurring). Connecting a **Conta social** changes the subscription to match **Identidades sociais do ciclo**; Stripe webhooks update entitlement. The Capyra UI never names the social vendor; Stripe may appear on the hosted checkout page because Stripe requires it.

The `email` port is Resend: magic link, access code, invites, approval notices, invoices. Templates and From are Capyra. SES, CF Email Routing and SMTP are not used in v1.

Picking these now avoids a fake-generic adapter with no implementation. Swapping later still goes through the ports; the domain does not import the Stripe or Resend SDKs in route handlers.

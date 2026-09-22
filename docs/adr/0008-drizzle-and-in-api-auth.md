# Drizzle plus SQL adapters; auth lives in the API

State is SQL through Drizzle. v1 uses D1 (SQLite); the next cloud is Postgres behind the same `db` port. Blobs stay out of SQL. Prisma was rejected because of the engine process and weak D1/Worker fit.

Operator auth is magic-link or access code implemented in `apps/api`, with sessions in our SQL. Firebase, Clerk and Auth0 would add a vendor in the login path and another thing to white-label. Mail and checkout are separate ports (ADR 0009), not the identity provider.

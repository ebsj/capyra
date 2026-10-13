# Implementation Plan: Capyra Social

**Branch**: `codex/capyra-social` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

Implement the six stories in the approved Social plan with the canonical API as the only business boundary. Foundation, social and web agents work in parallel after this contract freeze; root integrates boundaries and runs convergence. Live Zernio and white-label proof remain pending user validation; unsafe identities fail closed.

## Technical Context

TypeScript/Hono Workers, D1/Drizzle, private R2, Queues/Cron; Next.js/vinext React/shadcn; Python Container for metadata probe and current analysis pipeline. No new frontend state framework. Wrangler emulates bindings locally, Docker runs Python. Vitest Worker tests, node tests, pytest, local UI smoke. No remote migrations, deployments, real publishing or paid calls. Webhook acknowledgement under five seconds; 200 MB direct uploads, 100 MB multipart, 180-second analysis maximum. Bounded social queue concurrency 2 and batch size 1; five retries with DLQ, reconciliation every five minutes; analytics/purge daily.

## Constitution Check

PASS: API-only business boundary; AI stays limited to job R2/OpenAI and exposes private metadata probe; D1 stores queryable state and R2 media/reports. Contracts, consumers and tests change together. Auth/account isolation, bounded retry/idempotency/leases, redacted logs and local validation are explicit. Brand requirement is an approved breaking input change for existing analysis/upload clients; command/tool names and OAuth/polling remain. Full provider proof is excluded from local technical acceptance by user decision, not declared passed.

## Project Structure

- `apps/api/src/foundations.ts`, routes and ledger support foundations; migration 0001.
- `apps/api/src/social/`, routes/social.ts and migration 0002 own provider, state machines, jobs, metrics.
- `apps/web/features/` contains brands, team, social, usage and notifications plus expanded source assets and analyses.
- Root maintains canonical OpenAPI/types, CLI/MCP, runtime wiring and docs.
- [interfaces.md](contracts/interfaces.md) fixes concurrent module/public contracts; [data-model.md](data-model.md) defines invariants.

## Delivery sequence

Spec → quality checklist → research/design/contracts → tasks → analysis → implementation → convergence, repeated until all in-scope gaps close. Use three concurrent subagents, serialize shared-file edits. Each story must have tests and usable UI. Do not stop after foundations or after a single implementation pass.

## Failure, storage, security and cost

One provider post per destination; immutable version and stable attempt IDs. Durable internal idempotency survives external window expiration. Unknown results require read reconciliation, never blind resend. HMAC inbox dedup is durable before queue work. R2 transfer is server-to-server streaming; handoff within six days avoids seven-day provider expiry. No IDs, credentials or provider details in public payloads. Opaque sanitized errors remain actionable. Tokens/state/invite receipts are hashed or short-lived, no OAuth network tokens persisted. External posts are metadata-only. Audit twelve months; originals thirty days after archive/delete request unless open publication blocks purge. Preserve existing report-retention behavior.

## Validation and documentation

Run affected Worker/D1/R2 tests, race/idempotency/failure tests, metadata pytest, CLI/MCP tests, web build/lint/behavioral local smoke, security checks, Wrangler types and deploy dry-run only. Record real-provider scenarios as not executed. Update source plan, ADR interpretation, README, setup/development, architecture/database/security and public consumer docs. Quickstart documents explicit mock/real provider modes and later token/webhook/callback setup.

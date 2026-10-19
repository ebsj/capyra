---
name: capyra-security-local
description: Run Capyra local code and dependency security scans and interpret their reports.
---

# Capyra Security Local

Use this skill to run and interpret the local code/dependency baseline for the
Capyra monorepo.

## Workflow

1. Confirm the current directory is the Capyra repo root.
2. Read `docs/security-baseline.md` only if command scope, environment policy,
   or acceptance criteria are unclear.
3. Run:

```bash
npm run security:local
```

Use `npm run security:local -- --continue-on-error` when the user wants a broad
finding inventory even if one scanner fails.

## Interpretation

- Treat findings from secrets, SAST, dependency audit, filesystem misconfig, and
  package vulnerability checks as the primary output.
- Summarize by severity and subsystem: `apps/api`, `apps/ai`, `apps/web`,
  `apps/site`, `apps/mcp`, `apps/cli`, `infra`, `contracts`, or `tools`.
- Point to reports or generated files under `tmp/security/` when they exist.
- Distinguish scanner/tool failure from confirmed security findings.

## Remediation

- For audit-only requests, report findings. When fixes are already requested,
  apply and validate them within that scope.
- For fixes, prefer the narrowest change that removes the finding without
  changing public API behavior.
- After edits, run the smallest relevant validation first, then rerun
  `npm run security:local` or the failing subcheck when feasible.

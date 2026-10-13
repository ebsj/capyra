---
name: capyra-security-remediate
description: Triage or fix findings from Capyra security scan reports.
---

# Capyra Security Remediate

Use this skill after one or more Capyra security baseline commands have produced
findings or reports.

## Workflow

1. Inspect `tmp/security/` and the terminal output from the relevant scanner.
2. Identify the source stage: local baseline, image scan, or DAST.
3. Classify each finding as:
   - confirmed vulnerability or misconfiguration;
   - dependency/base image CVE;
   - scanner false positive or accepted exception;
   - tool or environment failure.
4. Prioritize P0/P1/P2/P3 using impact, exploitability, exposed environment,
   and which local service or boundary is affected.

## Fixing

- Only edit files when the user asks for remediation, not merely analysis.
- Keep fixes narrow and aligned with existing Capyra patterns.
- Do not change public API shapes unless the user explicitly requests it.
- For dependency updates, prefer the minimal version bump that removes the
  finding.
- For infrastructure findings, update Wrangler manifests, Worker/container code,
  local scripts and docs together.

## Validation

Run the smallest relevant check after a fix:

```bash
npm --workspace @capyra/web run lint
npm --workspace @capyra/api test
npm run security:local
npm run security:images -- --image ai
npm run security:dast -- --target=api=http://localhost:5080
```

Use only the checks that match the touched subsystem and explain any scanner that
was not rerun.

---
name: capyra-security-dast
description: Run Capyra ZAP baseline scans on local or explicitly authorized HTTP targets.
---

# Capyra Security DAST

Use this skill to run ZAP baseline checks safely against Capyra HTTP surfaces.

## Environment Rules

- The default targets are the services from `npm run dev:cloudflare`.
- Non-default targets must be supplied explicitly with `--target=name=url`.
- Do not perform brute force, aggressive upload tests, or exploit attempts.

## Workflow

For local targets, ensure `npm run dev:cloudflare` is already running,
then run:

```bash
npm run security:dast
```

For another authorized target, pass it explicitly:

```bash
npm run security:dast -- --target=api=http://localhost:5080
```

## Interpretation

- Read ZAP outputs from `tmp/security/zap/`.
- Separate informational header findings from exploitable behavior.
- Map affected targets to `site`, `web`, `api`, or `mcp`.
- Confirm findings against the target that produced the report.

## Remediation

- For audit-only requests, report findings. When fixes are already requested,
  apply and validate them within that scope.
- For header and cookie issues, identify whether the fix belongs in vinext,
  the Hono API Worker, the MCP Worker, or Cloudflare configuration.

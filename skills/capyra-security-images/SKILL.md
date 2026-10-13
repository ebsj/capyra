---
name: capyra-security-images
description: Scan the Capyra AI container image and interpret image security findings.
---

# Capyra Security Images

Use this skill to scan and triage Docker image findings for Capyra services.

## Workflow

1. Confirm the current directory is the Capyra repo root.
2. Run the only runtime image scan:

```bash
npm run security:images
```

3. To select it explicitly:

```bash
npm run security:images -- --image ai
```

`ai` is the only valid image name; API, web, site and MCP are Workers.

4. If images are already built and the user only wants scanning, run:

```bash
npm run security:images -- --skip-build
```

## Interpretation

- Group findings by image and severity.
- Separate base image CVEs from application dependency CVEs and Dockerfile
  hardening issues.
- Call out known posture risks from `docs/security-baseline.md`, especially
  runtime images without explicit non-root users.

## Remediation

- For scan-only requests, report findings. When fixes are already requested,
  update and validate the affected image within that scope.
- Prefer patching the affected Dockerfile or dependency pin directly.
- After a fix, rebuild and rescan only the affected image when possible.

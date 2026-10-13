#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID.}"
# Local provisioning supports either an API token or the OAuth session created by
# `wrangler login`. `whoami` is the canonical authentication preflight for both.
npx wrangler whoami --account "$CLOUDFLARE_ACCOUNT_ID" --json >/dev/null

queue_retention_seconds="${CAPYRA_QUEUE_MESSAGE_RETENTION_SECONDS:-345600}"

if npx wrangler d1 info capyra-production --json >/dev/null 2>&1; then
  echo "D1 database capyra-production already exists; keeping it."
else
  npx wrangler d1 create capyra-production
fi

if npx wrangler r2 bucket info capyra-production --json >/dev/null 2>&1; then
  echo "R2 bucket capyra-production already exists; keeping it."
else
  npx wrangler r2 bucket create capyra-production
fi

if npx wrangler queues info capyra-analyses >/dev/null 2>&1; then
  echo "Queue capyra-analyses already exists; keeping it."
else
  npx wrangler queues create capyra-analyses --message-retention-period-secs "$queue_retention_seconds"
fi

if npx wrangler queues info capyra-analyses-dlq >/dev/null 2>&1; then
  echo "Queue capyra-analyses-dlq already exists; keeping it."
else
  npx wrangler queues create capyra-analyses-dlq --message-retention-period-secs "$queue_retention_seconds"
fi

npx wrangler r2 bucket cors set capyra-production --file infra/cloudflare/r2-cors.json --force
npx wrangler r2 bucket lifecycle set capyra-production --file infra/cloudflare/r2-lifecycle.json --force

echo "Provisioning complete. Verify the D1 and account IDs in apps/api/wrangler.jsonc."
echo "Next, configure API Worker secrets; the API Worker forwards OpenAI and R2 credentials to its Container."

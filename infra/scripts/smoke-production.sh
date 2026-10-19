#!/usr/bin/env bash
set -euo pipefail

curl_flags=(--fail --silent --show-error --retry 3 --retry-delay 2 --max-time 20)
smoke_values=("${CAPYRA_SMOKE_EMAIL:-}" "${CAPYRA_SMOKE_PASSWORD:-}" "${CAPYRA_SMOKE_VIDEO_URL:-}")
configured=0
for value in "${smoke_values[@]}"; do
  [[ -n "$value" ]] && configured=$((configured + 1))
done

if [[ "${CAPYRA_REQUIRE_ANALYSIS_SMOKE:-false}" == "true" && "$configured" -ne 3 ]]; then
  echo "Production analysis smoke is required; configure CAPYRA_SMOKE_EMAIL, CAPYRA_SMOKE_PASSWORD and CAPYRA_SMOKE_VIDEO_URL." >&2
  exit 1
fi
if [[ "$configured" -ne 0 && "$configured" -ne 3 ]]; then
  echo "Production analysis smoke is partially configured; set all three CAPYRA_SMOKE_* values." >&2
  exit 1
fi

curl "${curl_flags[@]}" https://api.capyra.co/api/v1/health >/dev/null
curl "${curl_flags[@]}" https://web.capyra.co/api/health >/dev/null
curl "${curl_flags[@]}" https://capyra.co/pt-br >/dev/null
curl "${curl_flags[@]}" https://mcp.capyra.co/healthz >/dev/null
curl "${curl_flags[@]}" https://mcp.capyra.co/.well-known/oauth-protected-resource/mcp >/dev/null

if [[ "$configured" -eq 3 ]]; then
  node ./infra/scripts/smoke-production-analysis.mjs
else
  echo "Production analysis smoke skipped until its dedicated account is configured."
fi

echo "Production HTTP smoke passed."

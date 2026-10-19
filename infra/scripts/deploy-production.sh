#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

node ./infra/scripts/check-production-config.mjs --require-credentials
npx wrangler whoami --account "$CLOUDFLARE_ACCOUNT_ID" --json >/dev/null

previous_version() {
  local app_dir="$1"
  local deployments
  if ! deployments="$(XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-/tmp/capyra-xdg}" npx wrangler deployments list --cwd "$app_dir" --json 2>/dev/null)"; then
    echo "Unable to capture the current deployment for $app_dir; refusing to deploy without a safe rollback target." >&2
    return 1
  fi
  printf '%s' "$deployments" | node ./infra/scripts/select-rollback-version.mjs
}

previous_api="$(previous_version apps/api)"
previous_web="$(previous_version apps/web)"
previous_site="$(previous_version apps/site)"
previous_mcp="$(previous_version apps/mcp)"
attempted_apps=()

previous_version_for() {
  case "$1" in
    api) printf '%s' "$previous_api" ;;
    web) printf '%s' "$previous_web" ;;
    site) printf '%s' "$previous_site" ;;
    mcp) printf '%s' "$previous_mcp" ;;
  esac
}

rollback() {
  local exit_code=$?
  trap - ERR
  echo "Deploy or smoke failed; rolling Workers back." >&2
  local index app version
  for ((index=${#attempted_apps[@]} - 1; index >= 0; index--)); do
    app="${attempted_apps[$index]}"
    version="$(previous_version_for "$app")"
    if [[ -n "$version" ]]; then
      npx wrangler rollback "$version" --cwd "apps/$app" --yes || true
    else
      echo "No previous $app version is available for rollback." >&2
    fi
  done
  exit "$exit_code"
}
trap rollback ERR

npm --workspace @capyra/api run db:migrate:remote
attempted_apps+=(api)
npm --workspace @capyra/api run deploy
attempted_apps+=(web)
npm --workspace @capyra/web run deploy
attempted_apps+=(site)
npm --workspace @capyra/site run deploy
attempted_apps+=(mcp)
npm --workspace @capyra/mcp run deploy
./infra/scripts/smoke-production.sh

trap - ERR
echo "Production deploy completed."

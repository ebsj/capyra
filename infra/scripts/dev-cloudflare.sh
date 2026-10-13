#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
runtime_dir="${TMPDIR:-/tmp}/capyra-cloudflare-dev"
xdg_dir="$runtime_dir/xdg"
mkdir -p "$runtime_dir" "$xdg_dir"

pids=()
names=()

fail() {
  echo "error: $*" >&2
  exit 1
}

for command_name in node npm docker curl; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required."
done
docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker and retry."

remove_local_containers() {
  local attempt
  for attempt in 1 2 3; do
    docker ps --all --filter "name=workerd-capyra-api-AnalysisContainer-" --format '{{.ID}}' |
      while IFS= read -r container_id; do
        if [[ -n "$container_id" ]]; then
          docker rm --force "$container_id" >/dev/null 2>&1 || true
        fi
      done
    sleep 1
  done
}

remove_local_containers

openai_key="${OPENAI_API_KEY:-}"
if [[ -z "$openai_key" && -f "$repo_root/apps/api/.dev.vars" ]]; then
  openai_key="$(awk -F= '/^OPENAI_API_KEY=/{sub(/^[^=]*=/, ""); print; exit}' "$repo_root/apps/api/.dev.vars")"
fi
if [[ -z "$openai_key" || "$openai_key" == replace-with-* ]]; then
  echo "warning: OPENAI_API_KEY is not configured; the stack will start, but analyses will fail explicitly."
fi

cleanup() {
  trap - EXIT HUP INT TERM
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  remove_local_containers
}
trap cleanup EXIT HUP INT TERM

start_service() {
  local name="$1"
  shift
  (
    cd "$repo_root"
    XDG_CONFIG_HOME="$xdg_dir" "$@"
  ) >"$runtime_dir/$name.log" 2>&1 &
  local pid=$!
  names+=("$name")
  pids+=("$pid")
  echo "starting $name (pid=$pid, log=$runtime_dir/$name.log)"
}

wait_for_url() {
  local name="$1"
  local pid="$2"
  local url="$3"
  local timeout_seconds="$4"
  local log_name="${5:-$name}"
  local started_at=$SECONDS
  while ! curl --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "$name stopped before becoming ready:" >&2
      tail -n 80 "$runtime_dir/$log_name.log" >&2 || true
      exit 1
    fi
    if (( SECONDS - started_at >= timeout_seconds )); then
      echo "$name did not become ready at $url after ${timeout_seconds}s:" >&2
      tail -n 80 "$runtime_dir/$log_name.log" >&2 || true
      exit 1
    fi
    sleep 1
  done
  echo "ready: $name ($url)"
}

(
  cd "$repo_root"
  XDG_CONFIG_HOME="$xdg_dir" npm --workspace @capyra/api run db:migrate:local
)

start_service api npm --workspace @capyra/api run dev -- \
  --inspector-port 9229 \
  --var CAPYRA_ENVIRONMENT:local \
  --var CAPYRA_AUTH_ISSUER:http://localhost:5080 \
  --var CAPYRA_WEB_BASE_URL:http://localhost:3000 \
  --var CAPYRA_AUTH_SIGNING_KEY:capyra-local-only-signing-key-32-chars
wait_for_url api "${pids[0]}" http://localhost:5080/api/v1/health 600
wait_for_url ai "${pids[0]}" http://localhost:5080/__dev/container-health 600 api

start_service mcp npm --workspace @capyra/mcp run dev
wait_for_url mcp "${pids[1]}" http://localhost:5090/healthz 120

start_service web npm --workspace @capyra/web run dev
wait_for_url web "${pids[2]}" http://localhost:3000/api/health 180

start_service site npm --workspace @capyra/site run dev
wait_for_url site "${pids[3]}" http://localhost:3001/api/health 180

echo "Capyra is ready:"
echo "  API  http://localhost:5080"
echo "  MCP  http://localhost:5090"
echo "  Web  http://localhost:3000"
echo "  Site http://localhost:3001"
echo "Press Ctrl+C to stop all services."

while :; do
  index=0
  for pid in "${pids[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "${names[$index]} stopped unexpectedly:" >&2
      tail -n 80 "$runtime_dir/${names[$index]}.log" >&2 || true
      exit 1
    fi
    index=$((index + 1))
  done
  sleep 1
done

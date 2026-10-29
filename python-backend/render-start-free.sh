#!/usr/bin/env bash
set -euo pipefail

# Render Free has no Background Worker plan. For a short deployment trial,
# supervise one API and one queue worker inside the same web-service instance.
# Production should split these processes onto appropriately sized services.
python -m tonnze.worker &
worker_pid=$!

uvicorn tonnze.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-10000}" &
api_pid=$!

shutdown() {
  trap - EXIT INT TERM
  kill -TERM "$api_pid" "$worker_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true
  wait "$worker_pid" 2>/dev/null || true
}

trap shutdown EXIT INT TERM

# If either process exits, terminate the other one so Render can restart the
# complete pair instead of leaving a healthy-looking but unusable service.
set +e
wait -n "$api_pid" "$worker_pid"
status=$?
set -e
exit "$status"

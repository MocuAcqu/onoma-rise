#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/onoma-rise"
APP_USER="onoma"
DEPLOY_DIR="$APP_DIR/deploy/aws-lightsail"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run with sudo: sudo bash $0" >&2
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "$APP_DIR is not a Git checkout." >&2
  exit 1
fi

runuser -u "$APP_USER" -- git -C "$APP_DIR" pull --ff-only
runuser -u "$APP_USER" -- bash "$DEPLOY_DIR/install-python.sh" "$APP_DIR" "$APP_DIR/.venv"

install -m 644 "$DEPLOY_DIR/systemd/onoma-recognition-api.service" /etc/systemd/system/onoma-recognition-api.service
install -m 644 "$DEPLOY_DIR/systemd/onoma-recognition-worker.service" /etc/systemd/system/onoma-recognition-worker.service

nginx -t
systemctl daemon-reload
systemctl restart onoma-recognition-api onoma-recognition-worker
systemctl reload nginx

for attempt in {1..20}; do
  HEALTH="$(curl --fail --silent http://127.0.0.1/api/health/recognition || true)"
  if python3 -c 'import json, sys; data=json.loads(sys.argv[1]); assert data.get("api") is True and data.get("worker") is True' "$HEALTH" 2>/dev/null; then
    echo "$HEALTH"
    exit 0
  fi
  sleep 1
done

echo "Update completed, but the health check did not pass." >&2
systemctl --no-pager --full status onoma-recognition-api onoma-recognition-worker >&2 || true
exit 1


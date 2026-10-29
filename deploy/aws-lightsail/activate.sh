#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/etc/onoma-rise/recognition.env"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run with sudo: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE; run install.sh first." >&2
  exit 1
fi

TOKEN="$(awk -F= '$1 == "RECOGNITION_PROXY_TOKEN" {sub(/^[^=]*=/, ""); print; exit}' "$ENV_FILE")"
if [[ -z "$TOKEN" || "$TOKEN" == "CHANGE_ME" || "${#TOKEN}" -lt 32 ]]; then
  echo "Set RECOGNITION_PROXY_TOKEN to at least 32 characters in $ENV_FILE" >&2
  exit 1
fi

nginx -t
systemctl daemon-reload
systemctl enable --now nginx onoma-recognition-api onoma-recognition-worker
systemctl reload nginx

for attempt in {1..20}; do
  HEALTH="$(curl --fail --silent http://127.0.0.1/api/health/recognition || true)"
  if python3 -c 'import json, sys; data=json.loads(sys.argv[1]); assert data.get("api") is True and data.get("worker") is True' "$HEALTH" 2>/dev/null; then
    echo "$HEALTH"
    echo "Onoma Rise recognition service is healthy."
    exit 0
  fi
  sleep 1
done

echo "Services started, but the health check did not pass." >&2
systemctl --no-pager --full status onoma-recognition-api onoma-recognition-worker >&2 || true
exit 1


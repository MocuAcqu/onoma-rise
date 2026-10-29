#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/onoma-rise"
APP_USER="onoma"
ENV_DIR="/etc/onoma-rise"
DATA_DIR="/var/lib/onoma-rise/recognition"
DEPLOY_DIR="$APP_DIR/deploy/aws-lightsail"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run with sudo: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/python-backend/requirements.txt" ]]; then
  echo "Application not found at $APP_DIR" >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python3.12 python3.12-venv build-essential ffmpeg fluidsynth \
  nginx git curl openssl ca-certificates certbot python3-certbot-nginx

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

chown -R "$APP_USER:$APP_USER" "$APP_DIR"
install -d -o "$APP_USER" -g "$APP_USER" "$DATA_DIR"
install -d -m 700 "$ENV_DIR"

runuser -u "$APP_USER" -- bash "$DEPLOY_DIR/install-python.sh" "$APP_DIR" "$APP_DIR/.venv"

if [[ ! -f "$ENV_DIR/recognition.env" ]]; then
  install -m 600 "$DEPLOY_DIR/env.example" "$ENV_DIR/recognition.env"
fi

install -m 644 "$DEPLOY_DIR/systemd/onoma-recognition-api.service" /etc/systemd/system/onoma-recognition-api.service
install -m 644 "$DEPLOY_DIR/systemd/onoma-recognition-worker.service" /etc/systemd/system/onoma-recognition-worker.service
if [[ ! -f /etc/nginx/sites-available/onoma-rise ]]; then
  install -m 644 "$DEPLOY_DIR/nginx/onoma-rise.conf" /etc/nginx/sites-available/onoma-rise
fi
ln -sfn /etc/nginx/sites-available/onoma-rise /etc/nginx/sites-enabled/onoma-rise
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  unlink /etc/nginx/sites-enabled/default
fi

if [[ ! -e /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
fi
if ! swapon --show=NAME --noheadings | grep -Fxq /swapfile; then
  swapon /swapfile
fi
if ! grep -Eq '^/swapfile[[:space:]]' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

nginx -t
systemctl daemon-reload

echo
echo "Installation complete. Services have not been started."
echo "1. Edit $ENV_DIR/recognition.env"
echo "2. Run: sudo bash $DEPLOY_DIR/activate.sh"


#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/opt/onoma-rise}"
VENV_DIR="${2:-/opt/onoma-rise/.venv}"

python3.12 -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --upgrade pip wheel
"$VENV_DIR/bin/pip" install -r "$REPO_DIR/python-backend/requirements.txt"
# Basic Pitch is intentionally installed without its TensorFlow/CoreML extras.
"$VENV_DIR/bin/pip" install --no-deps basic-pitch==0.4.0

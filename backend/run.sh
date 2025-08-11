#!/usr/bin/env bash
set -euo pipefail

# Activate venv if exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

export PYTHONPATH=./
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ORACLE_DIR="$REPO_ROOT/deploy/oracle"

cd "$ORACLE_DIR"

if [[ ! -f app.env ]]; then
  cp app.env.example app.env
  echo "Created deploy/oracle/app.env from example. Fill it in and rerun."
  exit 1
fi

if [[ ! -f oracle.env ]]; then
  cp oracle.env.example oracle.env
  echo "Created deploy/oracle/oracle.env from example. Fill it in and rerun."
  exit 1
fi

echo "==> Pulling latest images"
docker compose pull caddy

echo "==> Building and starting stack"
docker compose up -d --build

echo "==> Active containers"
docker compose ps

echo "==> Health check"
curl -fsS http://localhost:3001/health || true

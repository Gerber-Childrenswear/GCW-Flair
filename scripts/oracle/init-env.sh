#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ORACLE_DIR="$REPO_ROOT/deploy/oracle"

cd "$ORACLE_DIR"

if [[ ! -f app.env ]]; then
  cp app.env.example app.env
  echo "Created app.env"
fi

if [[ ! -f oracle.env ]]; then
  cp oracle.env.example oracle.env
  echo "Created oracle.env"
fi

if ! grep -q '^TOKEN_ENCRYPTION_KEY=' app.env || grep -q 'replace_with_32_byte' app.env; then
  KEY="$(openssl rand -base64 32)"
  if grep -q '^TOKEN_ENCRYPTION_KEY=' app.env; then
    sed -i "s|^TOKEN_ENCRYPTION_KEY=.*|TOKEN_ENCRYPTION_KEY=$KEY|" app.env
  else
    echo "TOKEN_ENCRYPTION_KEY=$KEY" >> app.env
  fi
  echo "Generated TOKEN_ENCRYPTION_KEY in app.env"
fi

echo "Now edit deploy/oracle/app.env and deploy/oracle/oracle.env with your real domain and Shopify values."

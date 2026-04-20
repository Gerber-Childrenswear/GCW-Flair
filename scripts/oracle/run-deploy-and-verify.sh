#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/oracle/run-deploy-and-verify.sh https://your-domain [shop-domain]"
  exit 1
fi

BASE_URL="${1%/}"
SHOP_DOMAIN="${2:-gcw-dev.myshopify.com}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_ROOT"

echo "==> Bootstrapping env files (if missing)"
./scripts/oracle/init-env.sh

echo "==> Deploying stack"
./scripts/oracle/deploy-stack.sh

echo "==> Verifying deployment"
./scripts/oracle/verify-deploy.sh "$BASE_URL"

echo "==> Done"
echo "Install URL: $BASE_URL/api/shopify/install?shop=$SHOP_DOMAIN"

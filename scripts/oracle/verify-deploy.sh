#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/oracle/verify-deploy.sh https://your-domain"
  exit 1
fi

BASE_URL="${1%/}"

echo "==> Checking health"
curl -fsS "$BASE_URL/health" | sed 's/.*/health: &/'

echo "==> Checking config"
CONFIG_JSON="$(curl -fsS "$BASE_URL/health/config")"
echo "$CONFIG_JSON" | sed 's/.*/config: &/'

if ! echo "$CONFIG_JSON" | grep -q '"shopifyApiKeyConfigured":true'; then
  echo "ERROR: SHOPIFY_API_KEY is not configured"
  exit 1
fi

if ! echo "$CONFIG_JSON" | grep -q '"shopifyApiSecretConfigured":true'; then
  echo "ERROR: SHOPIFY_API_SECRET is not configured"
  exit 1
fi

if ! echo "$CONFIG_JSON" | grep -q '"shopifyAppUrlConfigured":true'; then
  echo "ERROR: SHOPIFY_APP_URL is not configured with a valid public HTTPS URL"
  exit 1
fi

if ! echo "$CONFIG_JSON" | grep -q '"tokenEncryptionConfigured":true'; then
  echo "ERROR: TOKEN_ENCRYPTION_KEY is not configured"
  exit 1
fi

echo "==> Checking token store endpoint"
curl -fsS "$BASE_URL/api/shopify/stores" | sed 's/.*/stores: &/'

echo "==> Deployment checks passed"

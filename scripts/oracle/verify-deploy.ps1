param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "==> Checking health"
$health = Invoke-RestMethod -Uri "$BaseUrl/health"
$healthJson = $health | ConvertTo-Json -Compress
Write-Host "health: $healthJson"

Write-Host "==> Checking config"
$config = Invoke-RestMethod -Uri "$BaseUrl/health/config"
$configJson = $config | ConvertTo-Json -Compress
Write-Host "config: $configJson"

if (-not $config.shopifyApiKeyConfigured) {
  throw "SHOPIFY_API_KEY is not configured"
}
if (-not $config.shopifyApiSecretConfigured) {
  throw "SHOPIFY_API_SECRET is not configured"
}
if (-not $config.shopifyAppUrlConfigured) {
  throw "SHOPIFY_APP_URL is not configured with a valid public HTTPS URL"
}
if (-not $config.tokenEncryptionConfigured) {
  throw "TOKEN_ENCRYPTION_KEY is not configured"
}

Write-Host "==> Checking token store endpoint"
$stores = Invoke-RestMethod -Uri "$BaseUrl/api/shopify/stores"
$storesJson = $stores | ConvertTo-Json -Compress
Write-Host "stores: $storesJson"

Write-Host "==> Deployment checks passed"

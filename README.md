# GCW-Flair
Flair app replacement

## Frontend handoff

This repo now contains a replacement Shopify app experience with a custom React frontend in `flair-next/` and an Express backend in `server/`.

### Current frontend state

- Faux Shopify chrome has been removed from the in-app UI.
- The app shell uses a Flair-native workspace layout.
- Campaign editing was expanded into a richer badge/banner builder.
- New modules were added for automations and countdown campaigns.
- The editor includes preview, content, style, conditions, placements, and function custom CSS sections.
- The right rail now uses compact `Status`, `Link`, `Tags`, `Schedule`, and `Display` cards.
- The preview was refactored from a device mock into a flatter inline strip closer to the Flair reference UI.

### Key frontend files

- `flair-next/src/App.tsx` - app shell, navigation, workspace flow
- `flair-next/src/components/CampaignEditor.tsx` - main builder/editor UI
- `flair-next/src/components/CampaignPreview.tsx` - live preview rendering
- `flair-next/src/components/RuleBuilder.tsx` - conditions builder
- `flair-next/src/types/campaign.ts` - campaign model and builder metadata
- `flair-next/src/styles/campaigns.css` - builder and preview styling
- `flair-next/src/styles/rule-builder.css` - condition row styling

### Frontend commands

From `flair-next/`:

- `npm install`
- `npm run dev`
- `npm run build`

### Backend commands

From `server/`:

- `npm install`
- `npm run dev`

### Shopify notes

- The app config was linked and deployed from the local Shopify CLI.
- Redirects should point to `/api/shopify/callback` on the deployed app domain.
- Local tunnel usage appeared to be an anonymous Cloudflare Quick Tunnel rather than an authenticated account-backed tunnel.
- Cloudflare account and named tunnel handoff steps are documented in `CLOUDFLARE_HANDOFF.md`.

### Recommended next frontend pass

- Tighten final spacing and label fidelity against the Flair reference screenshots.
- Continue polishing the builder right rail and section headers.
- Validate the editor against real Shopify admin embedding once backend auth flows are connected end-to-end.

## Oracle Always Free Deployment (24/7)

This repo includes a production deployment path for an Oracle Ubuntu VM using Docker + Caddy.

### 1. Create the Oracle VM

- Create an Ubuntu VM in Oracle Cloud Always Free.
- Open inbound ports 22, 80, and 443 in the Oracle security list.
- Point a domain DNS A record to your VM public IP.

### 2. Prepare the VM

Run on the VM after cloning this repo:

./scripts/oracle/setup-vm.sh

Then log out and back in to refresh Docker group membership.

### 3. Configure env files

Copy and edit:

- deploy/oracle/app.env.example -> deploy/oracle/app.env
- deploy/oracle/oracle.env.example -> deploy/oracle/oracle.env

Or auto-bootstrap both files and generate TOKEN_ENCRYPTION_KEY:

./scripts/oracle/init-env.sh

Set these values:

- SHOPIFY_API_KEY
- SHOPIFY_API_SECRET
- SHOPIFY_APP_URL (https://your-domain)
- FRONTEND_URL (https://your-domain)
- TOKEN_ENCRYPTION_KEY (32-byte key, base64 recommended)
- DOMAIN (your-domain)
- ACME_EMAIL (email for Let's Encrypt)

### 4. Deploy

./scripts/oracle/deploy-stack.sh

This builds the app image, starts the app and Caddy, and enables HTTPS automatically.

### 4.1 Verify deployment

Run after deploy:

./scripts/oracle/verify-deploy.sh https://your-domain

Windows PowerShell alternative:

powershell -ExecutionPolicy Bypass -File .\scripts\oracle\verify-deploy.ps1 -BaseUrl https://your-domain

This validates health, Shopify config values, and encrypted token-store readiness.

### 4.2 One-command deploy + verify

After VM setup and DNS are ready, you can run:

./scripts/oracle/run-deploy-and-verify.sh https://your-domain gcw-dev.myshopify.com

This runs env bootstrap, deploy, and verification in one flow.

### 5. Shopify Partner Dashboard settings

- App URL: https://your-domain
- Allowed redirection URL: https://your-domain/api/shopify/callback

### 6. Install on dev store

https://your-domain/api/shopify/install?shop=gcw-dev.myshopify.com

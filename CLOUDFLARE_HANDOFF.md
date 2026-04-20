# Cloudflare Handoff For Frontend Dev

This app should be connected under your own Cloudflare account, not reused from any other project account.

The local setup that was used during development appears to have been a Cloudflare Quick Tunnel, which is temporary and not tied to a permanent named tunnel in an account. For long-term ownership, create a named tunnel in your own Cloudflare account.

## Goal

Set up your own Cloudflare account and tunnel so you can expose the app safely for Shopify install, OAuth callback, and frontend testing.

## 1. Create your Cloudflare account

1. Go to Cloudflare and create your own account.
2. Do not use any existing Commerce Shield account unless the team explicitly wants shared ownership.
3. If you already have a company-managed Cloudflare account for this app, ask to be added there instead of creating a personal one.

## 2. Decide which hostname you will use

Pick one of these approaches:

1. Preferred: use a subdomain on a domain already managed in Cloudflare, for example `flair-dev.yourdomain.com`.
2. Temporary team setup: use a disposable dev subdomain that can later be replaced in Shopify settings.

You need a stable HTTPS hostname for Shopify.

## 3. Install cloudflared

On Windows, install `cloudflared` from Cloudflare and verify it works:

```powershell
cloudflared --version
```

## 4. Log in to your Cloudflare account from the CLI

Run:

```powershell
cloudflared tunnel login
```

This opens a browser and asks you to authorize a zone in your Cloudflare account. After this succeeds, Cloudflare stores your local tunnel credentials for your account.

## 5. Create a named tunnel

Run:

```powershell
cloudflared tunnel create flairbetrippin-dev
```

Save the tunnel ID that Cloudflare returns.

## 6. Create DNS for the tunnel

If your hostname is `flair-dev.yourdomain.com`, run:

```powershell
cloudflared tunnel route dns flairbetrippin-dev flair-dev.yourdomain.com
```

That creates the DNS routing in your Cloudflare zone.

## 7. Create a local Cloudflare config file

Create `%USERPROFILE%\\.cloudflared\\config.yml` with this shape:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: C:\\Users\\YOUR_USER\\.cloudflared\\YOUR_TUNNEL_ID.json

ingress:
  - hostname: flair-dev.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Use the backend port that actually serves the Shopify app.

If this project is split locally between frontend and backend, the tunnel should still point at the server entry point that handles Shopify auth and callback.

## 8. Run the app locally

Start the app services first.

Frontend:

```powershell
Set-Location .\flair-next
npm install
npm run dev
```

Backend:

```powershell
Set-Location .\server
npm install
npm run dev
```

If backend and frontend ports differ from the tunnel config, update the Cloudflare config to point to the correct local service.

## 9. Run the named tunnel

In a separate terminal:

```powershell
cloudflared tunnel run flairbetrippin-dev
```

If this works, your public hostname should proxy to your local app.

## 10. Update Shopify app URLs

Once the hostname is live, update Shopify app settings to use that hostname.

Important values:

- App URL: `https://flair-dev.yourdomain.com`
- Allowed redirection URL: `https://flair-dev.yourdomain.com/api/shopify/callback`

If the Shopify CLI config is being used locally, make sure the same public URL is reflected in the app config and any local env files.

## 11. Verify end-to-end

Check these flows:

1. The public hostname loads.
2. Shopify app install starts successfully.
3. OAuth callback returns to `/api/shopify/callback` without host mismatch errors.
4. The embedded app loads after install.

## 12. Files and settings to review in this repo

- `shopify.app.toml`
- `server/.env.example`
- `server/src/routes/shopify-auth.ts`
- `server/src/index.ts`
- `README.md`

## Recommended ownership rule

The Cloudflare account or zone used for this app should belong to the team or the frontend dev assigned to maintain it. Do not leave production or long-term dev access tied to a temporary tunnel from someone else's machine.

## Quick summary

1. Create your own Cloudflare account or get added to the team account.
2. Install `cloudflared`.
3. Run `cloudflared tunnel login`.
4. Create a named tunnel.
5. Route DNS for a stable dev hostname.
6. Point Shopify app URLs at that hostname.
7. Run the app locally and start `cloudflared tunnel run`.
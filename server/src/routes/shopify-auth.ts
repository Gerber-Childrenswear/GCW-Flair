import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { registerToken, registerRequiredWebhooks, ensureScriptTag } from "../lib/shopify-api";

type OAuthState = {
  shop: string;
  createdAt: number;
};

type InstalledShop = {
  shop: string;
  accessToken: string;
  scope: string;
  installedAt: string;
};

type EncryptedTokenStore = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  data: string;
};

const router = Router();
const oauthState = new Map<string, OAuthState>();
const installedShops = new Map<string, InstalledShop>();

const STATE_TTL_MS = 10 * 60 * 1000;
const tokenStorePath = process.env.TOKEN_STORE_PATH
  ? path.resolve(process.env.TOKEN_STORE_PATH)
  : path.resolve(process.cwd(), "data", "installed-shops.json");
const tokenEncryptionKeyRaw = process.env.TOKEN_ENCRYPTION_KEY;

function getTokenEncryptionKey(): Buffer | null {
  if (!tokenEncryptionKeyRaw) {
    return null;
  }

  const trimmed = tokenEncryptionKeyRaw.trim();

  // Accept either a base64-encoded 32-byte key or a literal 32-char key for dev convenience.
  try {
    const decoded = Buffer.from(trimmed, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // Fall through to utf8 check.
  }

  const utf8 = Buffer.from(trimmed, "utf8");
  if (utf8.length === 32) {
    return utf8;
  }

  console.error("[shopify-auth] TOKEN_ENCRYPTION_KEY must be 32 bytes (base64 or raw 32-char string).");
  return null;
}

function encryptPayload(plaintext: string, key: Buffer): EncryptedTokenStore {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptPayload(payload: EncryptedTokenStore, key: Buffer): string {
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

function loadInstalledShopsFromDisk() {
  try {
    if (!fs.existsSync(tokenStorePath)) {
      return;
    }

    const raw = fs.readFileSync(tokenStorePath, "utf8");
    const parsedUnknown = JSON.parse(raw) as unknown;
    const encryptionKey = getTokenEncryptionKey();

    let parsed: InstalledShop[] = [];

    if (Array.isArray(parsedUnknown)) {
      // Backward compatibility: previously plaintext JSON array.
      parsed = parsedUnknown as InstalledShop[];
    } else if (
      parsedUnknown &&
      typeof parsedUnknown === "object" &&
      "alg" in parsedUnknown &&
      (parsedUnknown as { alg?: string }).alg === "aes-256-gcm"
    ) {
      if (!encryptionKey) {
        console.error("[shopify-auth] Encrypted token store found but TOKEN_ENCRYPTION_KEY is missing/invalid.");
        return;
      }

      const decryptedRaw = decryptPayload(parsedUnknown as EncryptedTokenStore, encryptionKey);
      parsed = JSON.parse(decryptedRaw) as InstalledShop[];
    } else {
      console.error("[shopify-auth] Unsupported token store format.");
      return;
    }

    for (const item of parsed) {
      if (!item.shop || !item.accessToken) {
        continue;
      }

      installedShops.set(item.shop, item);
      registerToken(item.shop, item.accessToken);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[shopify-auth] Failed to load token store: ${message}`);
  }
}

function saveInstalledShopsToDisk() {
  try {
    fs.mkdirSync(path.dirname(tokenStorePath), { recursive: true });
    const stores = Array.from(installedShops.values());
    const plaintext = JSON.stringify(stores, null, 2);

    const encryptionKey = getTokenEncryptionKey();
    if (!encryptionKey) {
      fs.writeFileSync(tokenStorePath, plaintext, "utf8");
      return;
    }

    const encrypted = encryptPayload(plaintext, encryptionKey);
    fs.writeFileSync(tokenStorePath, JSON.stringify(encrypted, null, 2), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[shopify-auth] Failed to save token store: ${message}`);
  }
}

loadInstalledShopsFromDisk();

function getRequiredEnv() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const scopes = process.env.SHOPIFY_SCOPES;
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!apiKey || !apiSecret || !scopes || !appUrl) {
    return { ok: false as const, error: "Missing SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, or SHOPIFY_APP_URL." };
  }

  const frontendUrl = process.env.FRONTEND_URL ?? appUrl;

  return { ok: true as const, apiKey, apiSecret, scopes, appUrl, frontendUrl };
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function getRawQueryValue(rawQuery: string, key: string): string | null {
  const parts = rawQuery.split("&");
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === key) {
      return rest.join("=");
    }
  }
  return null;
}

function buildOAuthMessageFromRawQuery(rawQuery: string): string {
  return rawQuery
    .split("&")
    .filter((segment) => segment.length > 0)
    .filter((segment) => !segment.startsWith("hmac=") && !segment.startsWith("signature="))
    .sort((a, b) => a.localeCompare(b))
    .join("&");
}

function verifyCallbackHmac(rawQuery: string, secret: string): boolean {
  const hmac = getRawQueryValue(rawQuery, "hmac");
  if (!hmac) {
    return false;
  }

  const msg = buildOAuthMessageFromRawQuery(rawQuery);
  const digest = crypto.createHmac("sha256", secret).update(msg).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(hmac, "utf8"));
  } catch {
    return false;
  }
}

function cleanExpiredStates() {
  const now = Date.now();
  for (const [state, meta] of oauthState.entries()) {
    if (now - meta.createdAt > STATE_TTL_MS) {
      oauthState.delete(state);
    }
  }
}

router.get("/install", (req, res) => {
  const env = getRequiredEnv();
  if (!env.ok) {
    res.status(500).json({ error: env.error });
    return;
  }

  const shop = String(req.query.shop ?? "").trim().toLowerCase();
  if (!isValidShopDomain(shop)) {
    res.status(400).json({ error: "Invalid shop. Expected format: your-shop.myshopify.com" });
    return;
  }

  cleanExpiredStates();
  const state = uuid();
  oauthState.set(state, { shop, createdAt: Date.now() });

  const redirectUri = `${env.appUrl.replace(/\/$/, "")}/api/shopify/callback`;
  const oauthUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  oauthUrl.searchParams.set("client_id", env.apiKey);
  oauthUrl.searchParams.set("scope", env.scopes);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("state", state);

  res.redirect(oauthUrl.toString());
});

router.get("/callback", async (req, res) => {
  const env = getRequiredEnv();
  if (!env.ok) {
    res.status(500).json({ error: env.error });
    return;
  }

  const rawQuery = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?") + 1)
    : "";

  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (Array.isArray(v)) {
      query[k] = String(v[0] ?? "");
    } else {
      query[k] = String(v ?? "");
    }
  }

  const shop = String(query.shop ?? "").trim().toLowerCase();
  const code = String(query.code ?? "");
  const state = String(query.state ?? "");

  if (!isValidShopDomain(shop)) {
    res.status(400).json({ error: "Invalid shop domain." });
    return;
  }

  if (!verifyCallbackHmac(rawQuery, env.apiSecret)) {
    res.status(400).json({
      error: "Invalid OAuth callback signature.",
      hint: "Ensure app URL host and callback host match exactly in Shopify app config.",
    });
    return;
  }

  const stateMeta = oauthState.get(state);
  oauthState.delete(state);

  if (!stateMeta || stateMeta.shop !== shop) {
    res.status(400).json({ error: "Invalid OAuth state." });
    return;
  }

  if (!code) {
    res.status(400).json({ error: "Missing OAuth code." });
    return;
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.apiKey,
        client_secret: env.apiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      res.status(502).json({ error: "Token exchange failed.", details: text });
      return;
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string; scope?: string };
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      res.status(502).json({ error: "No access token in response." });
      return;
    }

    installedShops.set(shop, {
      shop,
      accessToken,
      scope: tokenJson.scope ?? env.scopes,
      installedAt: new Date().toISOString(),
    });
    saveInstalledShopsToDisk();
    registerToken(shop, accessToken);

    // Fire-and-forget post-install: register webhooks and script tag.
    const appUrl = env.appUrl.replace(/\/$/, "");
    const flairScriptSrc = `${appUrl}/flair.js`;
    void (async () => {
      try {
        await registerRequiredWebhooks(shop, appUrl);
        await ensureScriptTag(shop, flairScriptSrc);
        console.log(`[shopify-auth] Post-install complete for ${shop}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[shopify-auth] Post-install error for ${shop}: ${msg}`);
      }
    })();

    // Send users to the embedded app entry inside Shopify Admin after install.
    const embeddedAdminUrl = `https://${shop}/admin/apps/${env.apiKey}`;
    res.redirect(embeddedAdminUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Unexpected callback error.", details: message });
  }
});

router.get("/status", (req, res) => {
  const shop = String(req.query.shop ?? "").trim().toLowerCase();
  if (!isValidShopDomain(shop)) {
    res.status(400).json({ error: "Invalid shop. Expected format: your-shop.myshopify.com" });
    return;
  }

  const installed = installedShops.get(shop);
  res.json({
    installed: Boolean(installed),
    shop,
    installedAt: installed?.installedAt ?? null,
    scope: installed?.scope ?? null,
  });
});

router.get("/stores", (_req, res) => {
  const stores = Array.from(installedShops.values()).map((store) => ({
    shop: store.shop,
    installedAt: store.installedAt,
    scope: store.scope,
  }));

  res.json({
    count: stores.length,
    tokenStorePath,
    tokenStoreEncrypted: Boolean(getTokenEncryptionKey()),
    stores,
  });
});

export default router;

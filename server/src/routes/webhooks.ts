/**
 * GDPR-mandatory and operational webhook handlers.
 *
 * Mounted with express.raw({ type: "application/json" }) in index.ts so that
 * req.body is the raw Buffer before any JSON parsing — required for HMAC verification.
 */

import crypto from "crypto";
import { Router, Request, Response } from "express";

const router = Router();

function verifyWebhookHmac(req: Request): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader) return false;

  // req.body is a Buffer when express.raw() is used at the mount point.
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(hmacHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

function webhookHandler(topic: string) {
  return (req: Request, res: Response): void => {
    if (!verifyWebhookHmac(req)) {
      res.status(401).json({ error: "Invalid webhook signature." });
      return;
    }

    const shop = req.get("X-Shopify-Shop-Domain") ?? "unknown";
    console.log(`[webhook] ${topic} received for ${shop}`);

    // Acknowledge immediately — process async if needed.
    res.status(200).json({ received: true });
  };
}

// ── GDPR mandatory ────────────────────────────────────────────────────────────

/**
 * Shopify sends this when a customer requests data export.
 * Apps must respond to this to comply with GDPR.
 * For Flair we do not store PII tied to customers, so no data to return.
 */
router.post("/customers/data_request", webhookHandler("customers/data_request"));

/**
 * Shopify sends this 10 days after a customer requests deletion.
 * Delete any customer PII stored by the app.
 * Flair stores no customer PII — acknowledge only.
 */
router.post("/customers/redact", webhookHandler("customers/redact"));

/**
 * Shopify sends this 48 hours after a shop uninstalls the app.
 * Delete all data stored for that shop.
 */
router.post("/shop/redact", (req: Request, res: Response): void => {
  if (!verifyWebhookHmac(req)) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }

  const shop = req.get("X-Shopify-Shop-Domain") ?? "unknown";
  console.log(`[webhook] shop/redact received for ${shop} — purging shop data`);

  // TODO: when a database is added, delete all rows for this shop.
  // For now acknowledge immediately.
  res.status(200).json({ received: true });
});

// ── Operational ───────────────────────────────────────────────────────────────

/**
 * App uninstalled — fires immediately when the merchant uninstalls.
 * Clean up active state (token cache, etc.).
 */
router.post("/app/uninstalled", (req: Request, res: Response): void => {
  if (!verifyWebhookHmac(req)) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }

  const shop = req.get("X-Shopify-Shop-Domain") ?? "unknown";
  console.log(`[webhook] app/uninstalled received for ${shop}`);

  // TODO: remove shop token from persistent store on uninstall.
  res.status(200).json({ received: true });
});

export default router;

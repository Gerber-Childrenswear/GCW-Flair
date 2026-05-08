/**
 * Script tag management endpoints.
 * Used to register / unregister the Flair storefront injection script.
 */

import { Router, Request, Response } from "express";
import { getAccessToken, ensureScriptTag, listScriptTags, deleteScriptTag } from "../lib/shopify-api";

const router = Router();

function getShop(req: Request): string | null {
  const shop = String(req.query.shop ?? "").trim().toLowerCase();
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop) ? shop : null;
}

/**
 * GET /api/script-tags/status?shop=
 * Returns all script tags registered by this app for the shop.
 */
router.get("/status", async (req: Request, res: Response): Promise<void> => {
  const shop = getShop(req);
  if (!shop) {
    res.status(400).json({ error: "Invalid or missing shop parameter." });
    return;
  }

  const token = getAccessToken(shop);
  if (!token) {
    res.status(403).json({ error: "Shop not installed or token unavailable." });
    return;
  }

  try {
    const tags = await listScriptTags(shop);
    const flairTags = tags.filter((t) => t.src.includes("flair"));
    res.json({ shop, tags: flairTags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "Failed to fetch script tags.", details: msg });
  }
});

/**
 * POST /api/script-tags/register?shop=
 * Registers the Flair script tag on the shop storefront.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const shop = getShop(req);
  if (!shop) {
    res.status(400).json({ error: "Invalid or missing shop parameter." });
    return;
  }

  const token = getAccessToken(shop);
  if (!token) {
    res.status(403).json({ error: "Shop not installed or token unavailable." });
    return;
  }

  const appUrl = (process.env.SHOPIFY_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) {
    res.status(500).json({ error: "SHOPIFY_APP_URL is not configured." });
    return;
  }

  const src = `${appUrl}/flair.js`;

  try {
    const tag = await ensureScriptTag(shop, src);
    res.json({ success: true, shop, tag });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "Failed to register script tag.", details: msg });
  }
});

/**
 * DELETE /api/script-tags/unregister?shop=&id=
 * Removes a specific script tag by numeric ID.
 */
router.delete("/unregister", async (req: Request, res: Response): Promise<void> => {
  const shop = getShop(req);
  if (!shop) {
    res.status(400).json({ error: "Invalid or missing shop parameter." });
    return;
  }

  const token = getAccessToken(shop);
  if (!token) {
    res.status(403).json({ error: "Shop not installed or token unavailable." });
    return;
  }

  const idParam = Number(req.query.id);
  if (!Number.isInteger(idParam) || idParam <= 0) {
    res.status(400).json({ error: "Missing or invalid script tag id." });
    return;
  }

  try {
    await deleteScriptTag(shop, idParam);
    res.json({ success: true, shop, deletedId: idParam });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "Failed to delete script tag.", details: msg });
  }
});

export default router;

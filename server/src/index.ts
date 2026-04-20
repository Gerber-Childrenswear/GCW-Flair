import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import campaignsRouter from "./routes/campaigns";
import previewRouter from "./routes/preview";
import placementsRouter from "./routes/placements";
import analyticsRouter from "./routes/analytics";
import templatesRouter from "./routes/templates";
import shopifyAuthRouter from "./routes/shopify-auth";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", frontendUrl].filter(
  (origin): origin is string => Boolean(origin),
);
const staticDir = process.env.STATIC_DIR
  ? (path.isAbsolute(process.env.STATIC_DIR)
      ? process.env.STATIC_DIR
      : path.resolve(process.cwd(), process.env.STATIC_DIR))
  : path.resolve(process.cwd(), "public");
const staticIndex = path.join(staticDir, "index.html");
const hasStaticBuild = fs.existsSync(staticIndex);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/campaigns",  campaignsRouter);
app.use("/api/preview",    previewRouter);
app.use("/api/placements", placementsRouter);
app.use("/api/analytics",  analyticsRouter);
app.use("/api/templates",  templatesRouter);
app.use("/api/shopify",    shopifyAuthRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/config", (_req, res) => {
  const appUrl = process.env.SHOPIFY_APP_URL ?? "";
  const appUrlLooksValid = /^https:\/\//.test(appUrl) && !appUrl.includes("your-public-app-url");

  res.json({
    shopifyApiKeyConfigured: Boolean(process.env.SHOPIFY_API_KEY),
    shopifyApiSecretConfigured: Boolean(process.env.SHOPIFY_API_SECRET),
    shopifyAppUrlConfigured: appUrlLooksValid,
    scopesConfigured: Boolean(process.env.SHOPIFY_SCOPES),
    tokenEncryptionConfigured: Boolean(process.env.TOKEN_ENCRYPTION_KEY),
  });
});

if (hasStaticBuild) {
  app.use(express.static(staticDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      next();
      return;
    }

    res.sendFile(staticIndex);
  });
} else {
  app.get("/", (req, res) => {
    const shop = String(req.query.shop ?? "gcw-dev.myshopify.com");
    const installUrl = `/api/shopify/install?shop=${encodeURIComponent(shop)}`;
    const installed = String(req.query.installed ?? "") === "1";

    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>GCW Product Manager</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
    <h1>GCW Product Manager - Shopify App</h1>
    <p>${installed ? "Shopify app installation callback received successfully." : "Use the install link below to start Shopify OAuth."}</p>
    <p><a href="${installUrl}">Install on ${shop}</a></p>
    <p><a href="/health">Health</a> | <a href="/health/config">Config</a></p>
  </body>
</html>`);
  });
}

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 GCW Product Manager server running at http://localhost:${PORT}`);
  console.log(`   Campaigns API → http://localhost:${PORT}/api/campaigns`);
  console.log(`   Preview API   → http://localhost:${PORT}/api/preview/evaluate`);
  console.log(`   Static UI     → ${hasStaticBuild ? staticIndex : "not detected (dev mode)"}`);
});

export default app;

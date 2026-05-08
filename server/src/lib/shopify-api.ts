/**
 * Shopify Admin API client helpers.
 * All functions require a stored access token retrieved via getAccessToken().
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-04";

// ── Token registry (populated by shopify-auth.ts after OAuth) ─────────────────
const _tokenRegistry = new Map<string, string>();

export function registerToken(shop: string, accessToken: string): void {
  _tokenRegistry.set(shop.toLowerCase(), accessToken);
}

export function getAccessToken(shop: string): string | undefined {
  return _tokenRegistry.get(shop.toLowerCase());
}

export function listInstalledShops(): string[] {
  return Array.from(_tokenRegistry.keys());
}

// ── Core fetch helper ─────────────────────────────────────────────────────────
export async function shopifyFetch<T = unknown>(
  shop: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const token = getAccessToken(shop);
  if (!token) {
    throw new Error(`No access token for shop: ${shop}`);
  }

  const url = `https://${shop}/admin/api/${API_VERSION}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify API ${method} ${endpoint} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Script tags ───────────────────────────────────────────────────────────────
type ScriptTagResponse = {
  script_tag: { id: number; src: string; event: string; created_at: string };
};
type ScriptTagsResponse = {
  script_tags: Array<{ id: number; src: string; event: string; created_at: string }>;
};

export async function listScriptTags(shop: string): Promise<ScriptTagsResponse["script_tags"]> {
  const data = await shopifyFetch<ScriptTagsResponse>(shop, "GET", "/script_tags.json");
  return data.script_tags;
}

export async function createScriptTag(
  shop: string,
  src: string,
): Promise<ScriptTagResponse["script_tag"]> {
  const data = await shopifyFetch<ScriptTagResponse>(shop, "POST", "/script_tags.json", {
    script_tag: { event: "onload", src },
  });
  return data.script_tag;
}

export async function deleteScriptTag(shop: string, id: number): Promise<void> {
  await shopifyFetch(shop, "DELETE", `/script_tags/${id}.json`);
}

/**
 * Ensure exactly one Flair script tag is registered.
 * Removes stale tags pointing to old URLs before creating the new one.
 */
export async function ensureScriptTag(shop: string, src: string): Promise<{ id: number; src: string }> {
  const existing = await listScriptTags(shop);

  // Remove any existing Flair tags (same base URL or old domains)
  const stale = existing.filter((t) => t.src !== src && t.src.includes("flair"));
  for (const tag of stale) {
    await deleteScriptTag(shop, tag.id);
  }

  // Check if already registered with the right URL
  const already = existing.find((t) => t.src === src);
  if (already) return already;

  return createScriptTag(shop, src);
}

// ── Webhooks ──────────────────────────────────────────────────────────────────
type WebhookResponse = {
  webhook: { id: number; topic: string; address: string; format: string };
};
type WebhooksResponse = {
  webhooks: Array<{ id: number; topic: string; address: string }>;
};

const REQUIRED_WEBHOOK_TOPICS = [
  // GDPR mandatory
  "customers/data_request",
  "customers/redact",
  "shop/redact",
  // Operational
  "app/uninstalled",
];

export async function listWebhooks(shop: string): Promise<WebhooksResponse["webhooks"]> {
  const data = await shopifyFetch<WebhooksResponse>(shop, "GET", "/webhooks.json");
  return data.webhooks;
}

export async function createWebhook(
  shop: string,
  topic: string,
  address: string,
): Promise<WebhookResponse["webhook"]> {
  const data = await shopifyFetch<WebhookResponse>(shop, "POST", "/webhooks.json", {
    webhook: { topic, address, format: "json" },
  });
  return data.webhook;
}

/**
 * Register all required webhooks. Skips topics already registered at the same address.
 */
export async function registerRequiredWebhooks(shop: string, appUrl: string): Promise<void> {
  const baseUrl = appUrl.replace(/\/$/, "");
  const existing = await listWebhooks(shop);

  for (const topic of REQUIRED_WEBHOOK_TOPICS) {
    const address = `${baseUrl}/webhooks/${topic.replace("/", "/")}`;
    const alreadyRegistered = existing.some(
      (wh) => wh.topic === topic && wh.address === address,
    );
    if (!alreadyRegistered) {
      try {
        await createWebhook(shop, topic, address);
        console.log(`[shopify-api] Registered webhook: ${topic} → ${address}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[shopify-api] Failed to register webhook ${topic}: ${msg}`);
      }
    }
  }
}

// ── Product / Collection helpers (for rule evaluation server-side) ────────────
type ShopifyProduct = {
  id: number;
  title: string;
  product_type: string;
  vendor: string;
  tags: string;
  variants: Array<{
    id: number;
    sku: string;
    price: string;
    compare_at_price: string | null;
    inventory_quantity: number;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
};

export async function getProduct(shop: string, productId: string): Promise<ShopifyProduct> {
  const data = await shopifyFetch<{ product: ShopifyProduct }>(
    shop, "GET", `/products/${productId}.json`,
  );
  return data.product;
}

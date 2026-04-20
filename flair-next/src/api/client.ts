import type { Campaign } from "../types/campaign";

const BASE = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
export function fetchCampaigns(): Promise<Campaign[]> {
  return apiFetch("/campaigns");
}

export function fetchCampaign(id: string): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}`);
}

export function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  return apiFetch("/campaigns", { method: "POST", body: JSON.stringify(data) });
}

export function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteCampaign(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/campaigns/${id}`, { method: "DELETE" });
}

export function publishCampaign(id: string): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}/publish`, { method: "POST" });
}

export function pauseCampaign(id: string): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}/pause`, { method: "POST" });
}

export function duplicateCampaign(id: string): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}/duplicate`, { method: "POST" });
}

// ── Preview / Evaluate ────────────────────────────────────────────────────────
export type PreviewContext = {
  product: {
    id?: string;
    tags: string[];
    productType?: string;
    vendor?: string;
    collections?: string[];
    metafields?: Record<string, string>;
  };
  selectedVariant?: {
    id?: string;
    price: number;
    compareAtPrice?: number | null;
    inventory?: number;
    options?: Record<string, string>;
  };
  customer?: { isLoggedIn?: boolean; tags?: string[] };
  pageType?: string;
  placementSlot?: string;
  device?: string;
};

export type EvalResult = {
  campaignId: string;
  eligible: boolean;
  decision: string;
  humanSummary: string;
};

export function evaluateCampaign(
  campaignId: string,
  context: PreviewContext
): Promise<{ result: EvalResult; resolvedCreative: unknown }> {
  return apiFetch("/preview/evaluate", {
    method: "POST",
    body: JSON.stringify({ campaignId, context }),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export type CampaignMetricsAPI = {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  campaignStatus: string;
  impressions: number;
  clicks: number;
  ctr: number;
  atcs: number;
  revenue: number;
};

export function fetchAnalyticsMetrics(): Promise<CampaignMetricsAPI[]> {
  return apiFetch("/analytics/metrics");
}

export function fetchAnalyticsSummary(): Promise<{
  impressions: number; clicks: number; atcs: number; revenue: number;
  ctr: number; liveCampaigns: number; totalCampaigns: number;
}> {
  return apiFetch("/analytics/summary");
}

// ── Templates ─────────────────────────────────────────────────────────────────
export type TemplateAPI = {
  id: string; name: string; category: string; description: string;
  defaultCreative: Record<string, string>;
};

export function fetchTemplates(category?: string): Promise<TemplateAPI[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch(`/templates${qs}`);
}

// ── Placements ────────────────────────────────────────────────────────────────
export type PlacementAPI = {
  id: string; storeId: string; pageType: string; slotKey: string;
  label: string; description: string; deviceScope: string; isEnabled: boolean;
};

export function fetchPlacements(): Promise<PlacementAPI[]> {
  return apiFetch("/placements");
}

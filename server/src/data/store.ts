import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type {
  Campaign, Template, Placement, AnalyticsEvent, CampaignMetrics,
} from "../types/index";

// ── Campaign file persistence ─────────────────────────────────────────────────
const campaignStorePath = process.env.CAMPAIGN_STORE_PATH
  ? path.resolve(process.env.CAMPAIGN_STORE_PATH)
  : path.resolve(process.cwd(), "data", "campaigns.json");

let _persistenceEnabled = false;

function loadCampaignsFromDisk(): Campaign[] | null {
  try {
    if (!fs.existsSync(campaignStorePath)) return null;
    const raw = fs.readFileSync(campaignStorePath, "utf8");
    const parsed = JSON.parse(raw) as Campaign[];
    if (!Array.isArray(parsed)) return null;
    console.log(`[store] Loaded ${parsed.length} campaigns from ${campaignStorePath}`);
    return parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[store] Failed to load campaigns from disk: ${msg}`);
    return null;
  }
}

export function persistCampaigns(list: Campaign[]): void {
  if (!_persistenceEnabled) return;
  try {
    fs.mkdirSync(path.dirname(campaignStorePath), { recursive: true });
    fs.writeFileSync(campaignStorePath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[store] Failed to persist campaigns: ${msg}`);
  }
}

// ── Placement Registry (canonical slots) ─────────────────────────────────────
export const placements: Placement[] = [
  // PDP
  { id: "pl_pdp_above_title",   storeId: "gcw", pageType: "pdp",        slotKey: "above_title",      label: "Above Title",       description: "Directly above the product title",        deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_below_title",   storeId: "gcw", pageType: "pdp",        slotKey: "below_title",      label: "Below Title",       description: "Between title and price",                 deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_above_price",   storeId: "gcw", pageType: "pdp",        slotKey: "above_price",      label: "Above Price",       description: "Directly above the price block",          deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_below_price",   storeId: "gcw", pageType: "pdp",        slotKey: "below_price",      label: "Below Price",       description: "Between price and add-to-cart",           deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_below_swatches",storeId: "gcw", pageType: "pdp",        slotKey: "below_swatches",   label: "Below Swatches",    description: "Below variant swatch selector",           deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_above_atc",     storeId: "gcw", pageType: "pdp",        slotKey: "above_atc",        label: "Above Add to Cart", description: "Just above the add-to-cart button",       deviceScope: "all", isEnabled: true },
  { id: "pl_pdp_below_atc",     storeId: "gcw", pageType: "pdp",        slotKey: "below_atc",        label: "Below Add to Cart", description: "Below add-to-cart button",                deviceScope: "all", isEnabled: true },
  // Collection
  { id: "pl_col_card_top",      storeId: "gcw", pageType: "collection", slotKey: "card_top",         label: "Card Top",          description: "Overlay on top-left of product card",     deviceScope: "all", isEnabled: true },
  { id: "pl_col_card_bottom",   storeId: "gcw", pageType: "collection", slotKey: "card_bottom",      label: "Card Bottom",       description: "Banner across card bottom",               deviceScope: "all", isEnabled: true },
  // Quick View
  { id: "pl_qv_body",           storeId: "gcw", pageType: "quick_view", slotKey: "quick_view_body",  label: "Quick View Body",   description: "Inside quick view modal, below price",    deviceScope: "all", isEnabled: true },
  // Cart
  { id: "pl_cart_item",         storeId: "gcw", pageType: "cart_drawer",slotKey: "cart_drawer_item", label: "Cart Drawer Item",  description: "Inline with cart line items",             deviceScope: "all", isEnabled: true },
];

// ── Templates ─────────────────────────────────────────────────────────────────
export const templates: Template[] = [
  { id: "tmpl_sale",       name: "Sitewide Sale",      category: "Sale",        description: "Broad sitewide discount messaging",              defaultCreative: { backgroundColor: "#1a3a5c", textColor: "#ffffff", borderColor: "#1a3a5c", stylePreset: "solid-dark" },   defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "sale" }]),    defaultPlacementsJson: JSON.stringify(["pl_pdp_below_price", "pl_col_card_top"]), isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_clearance",  name: "Clearance",          category: "Sale",        description: "Final clearance / last chance",                  defaultCreative: { backgroundColor: "#dc2626", textColor: "#ffffff", borderColor: "#dc2626", stylePreset: "solid-red" },    defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "clearance" }]), defaultPlacementsJson: JSON.stringify(["pl_pdp_above_atc"]),                     isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_new",        name: "New Arrival",        category: "Product",     description: "Highlight newly added products",                 defaultCreative: { backgroundColor: "#2b6ff7", textColor: "#ffffff", borderColor: "#2b6ff7", stylePreset: "solid-blue" },   defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "new-arrival" }]), defaultPlacementsJson: JSON.stringify(["pl_col_card_top"]),                      isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_low_stock",  name: "Limited Stock",      category: "Urgency",     description: "Low inventory urgency signal",                   defaultCreative: { backgroundColor: "#fff3cd", textColor: "#856404", borderColor: "#ffc107", stylePreset: "solid-yellow" }, defaultRulesJson: JSON.stringify([{ field: "inventory", comparator: "lte", value: "10" }]),             defaultPlacementsJson: JSON.stringify(["pl_pdp_below_atc"]),                     isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_organic",    name: "Organic Cotton",     category: "Product",     description: "Highlight organic material certification",        defaultCreative: { backgroundColor: "#d4edda", textColor: "#155724", borderColor: "#c3e6cb", stylePreset: "soft-green" },  defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "organic" }]),  defaultPlacementsJson: JSON.stringify(["pl_pdp_below_title"]),                  isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_free_ship",  name: "Free Shipping",      category: "Shipping",    description: "Highlight free shipping threshold or eligibility",defaultCreative: { backgroundColor: "#d1ecf1", textColor: "#0c5460", borderColor: "#bee5eb", stylePreset: "soft-blue" },  defaultRulesJson: JSON.stringify([{ field: "price", comparator: "gte", value: "50" }]),                 defaultPlacementsJson: JSON.stringify(["pl_pdp_below_price"]),                  isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_bundle",     name: "Bundle Offer",       category: "Promo",       description: "Cross-sell bundle opportunity",                  defaultCreative: { backgroundColor: "#f0eef5", textColor: "#3a2d5c", borderColor: "#d8d0e8", stylePreset: "soft-purple" }, defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "bundle" }]),   defaultPlacementsJson: JSON.stringify(["pl_pdp_above_atc"]),                    isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_holiday",    name: "Holiday Shipping",   category: "Shipping",    description: "Holiday shipping cutoff deadlines",              defaultCreative: { backgroundColor: "#fce4ec", textColor: "#880e4f", borderColor: "#f48fb1", stylePreset: "soft-pink" },   defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "holiday" }]),  defaultPlacementsJson: JSON.stringify(["pl_pdp_above_atc"]),                    isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_matching",   name: "Family Matching",    category: "Product",     description: "Calls out family matching sets",                 defaultCreative: { backgroundColor: "#fff8e1", textColor: "#5d4037", borderColor: "#ffe082", stylePreset: "solid-warm" },  defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "family-matching" }]), defaultPlacementsJson: JSON.stringify(["pl_pdp_below_title"]),           isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "tmpl_online",     name: "Online Only",        category: "Exclusivity", description: "Exclusive online-only products",                 defaultCreative: { backgroundColor: "#e8eaf6", textColor: "#283593", borderColor: "#9fa8da", stylePreset: "soft-indigo" }, defaultRulesJson: JSON.stringify([{ field: "product_tag", comparator: "contains", value: "online-only" }]), defaultPlacementsJson: JSON.stringify(["pl_pdp_above_price"]),           isSystemTemplate: true, createdAt: "2026-01-01T00:00:00Z" },
];

// ── In-memory campaign store ──────────────────────────────────────────────────
function makeCampaign(
  id: string,
  name: string,
  type: "badge" | "banner",
  status: "live" | "draft",
  priority: number,
  bg: string,
  text: string,
  border: string,
  preset: string,
  contentText: string,
  tagValue: string,
  placementIds: string[]
): Campaign {
  const now = "2026-04-01T08:00:00Z";
  const rootGroupId = `rg_root_${id}`;
  const condId = `rc_${id}_1`;

  return {
    id,
    storeId: "gcw",
    name,
    type,
    status,
    priority,
    conflictMode: "replace",
    maxPerPlacement: 1,
    templateId: null,
    creative: { text: contentText, backgroundColor: bg, textColor: text, borderColor: border, stylePreset: preset },
    ruleGroups: [
      { id: rootGroupId, campaignId: id, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    ],
    ruleConditions: [
      { id: condId, groupId: rootGroupId, field: "product_tag", comparator: "contains", value: tagValue, sortOrder: 0 },
    ],
    placements: placementIds.map((pid, i) => ({
      id: `cp_${id}_${i}`,
      campaignId: id,
      placementId: pid,
      layoutKey: "default",
      deviceScope: "all",
      priorityOverride: null,
    })),
    schedule: { id: `sched_${id}`, campaignId: id, startsAt: "2026-04-01T00:00:00Z", endsAt: null, timezone: "America/New_York", isActive: true },
    styleConfig: { id: `style_${id}`, campaignId: id, tokenOverrides: {}, customCssRaw: "", customCssScoped: "", safeMode: "balanced", lintErrors: [], lintWarnings: [] },
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "live" ? now : null,
  };
}

export const campaigns: Campaign[] = [
  makeCampaign("camp_1",  "SITEWIDE SALE",           "badge",  "live",  1,  "#1a3a5c", "#ffffff", "#1a3a5c", "solid-dark",    "SITEWIDE SALE!\nEXTRA 20% OFF IN CART!!\nDiscount applied in cart.",     "sale",            ["pl_pdp_below_price", "pl_col_card_top"]),
  makeCampaign("camp_2",  "Oops - Upside Down",       "badge",  "live",  2,  "#ffffff", "#333333", "#e2e5ea", "outline-light", "Oops for us. Awesome for you!\nPriced extra low!\nWhile quantities last.", "upside-down",     ["pl_col_card_top"]),
  makeCampaign("camp_3",  "FREE EMBROIDERY",          "badge",  "live",  3,  "#f0f4e8", "#2d4a1a", "#d4e4b8", "soft-green",    "Create a keepsake.\nEnjoy FREE EMBROIDERY.\nAdditional processing time.", "embroidery",      ["pl_pdp_below_title"]),
  makeCampaign("camp_4",  "BEST PAJAMA SETS EVER",    "badge",  "live",  4,  "#f5f0eb", "#4a3728", "#e0d5c8", "soft-warm",     "BEST PAJAMA SETS EVER\nButtery soft styles.\nMade to sleep and play!",    "pajamas",         ["pl_pdp_below_title"]),
  makeCampaign("camp_5",  "SNUGGLY FOOTED PJS",       "badge",  "live",  5,  "#eef4f9", "#1a3d5c", "#c8dae8", "soft-blue",     "SNUGGLY-SOFT FOOTED PJS\nTwo-way zipper.\nMade to sleep and play!",       "footed-pjs",      ["pl_col_card_top"]),
  makeCampaign("camp_6",  "MADE TO TWIRL DRESSES",    "badge",  "live",  6,  "#f0eef5", "#3a2d5c", "#d8d0e8", "soft-purple",   "MADE TO TWIRL DRESSES\nLightweight, breathable fabric.\nComfy all day.", "dresses",         ["pl_col_card_top"]),
  makeCampaign("camp_7",  "LAST CHANCE",              "badge",  "live",  0,  "#dc2626", "#ffffff", "#dc2626", "solid-red",     "LAST CHANCE!\nOther discounts cannot be applied.",                         "last-chance",     ["pl_pdp_above_atc"]),
  makeCampaign("camp_10", "SITEWIDE SALE Banner",     "banner", "live",  1,  "#1a3a5c", "#ffffff", "#1a3a5c", "solid-dark",    "SITEWIDE SALE!\nEXTRA 20% OFF IN CART!!\nDiscount applied in cart.",     "sale",            ["pl_pdp_below_price"]),
  makeCampaign("camp_11", "Oops Banner",              "banner", "live",  2,  "#d4edda", "#155724", "#c3e6cb", "soft-green",    "Oops for us. Awesome for you!\nPriced extra low!\nWhile quantities last.", "upside-down",     ["pl_pdp_below_title"]),
  makeCampaign("camp_12", "FREE EMBROIDERY Banner",   "banner", "live",  3,  "#f0f4e8", "#2d4a1a", "#d4e4b8", "soft-green",    "Create a keepsake.\nEnjoy FREE EMBROIDERY.\nAdditional processing time.", "embroidery",      ["pl_pdp_below_atc"]),
  makeCampaign("camp_13", "SEMI ANNUAL SALE",         "banner", "draft", 5,  "#fef3c7", "#92400e", "#fcd34d", "solid-yellow",  "They Grow Fast, SAVE FASTER!\nSEMI ANNUAL SALE\nLimited Time Only.",       "semi-annual",     ["pl_pdp_below_price"]),
  makeCampaign("camp_14", "CLOCK'S TICKING",          "banner", "draft", 4,  "#1e3a5f", "#ffffff", "#1e3a5f", "solid-dark",    "CLOCK'S TICKING!\nFINAL HOURS TO SHOP SEMI ANNUAL SALE.",                 "final-hours",     ["pl_pdp_above_atc"]),
  makeCampaign("camp_15", "Customers Love This",      "banner", "draft", 6,  "#fce4ec", "#880e4f", "#f48fb1", "soft-pink",     "Customers are loving this!\nGrab yours before price goes back up.",        "trending",        ["pl_pdp_below_title"]),
  makeCampaign("camp_16", "FINAL HOURS",              "banner", "draft", 0,  "#dc2626", "#ffffff", "#dc2626", "solid-red",     "FINAL HOURS!\nSave an EXTRA 20% OFF in cart.",                             "final-hours",     ["pl_pdp_above_atc"]),
  makeCampaign("camp_17", "FREE SHIPPING $50+",       "banner", "live",  7,  "#ecfdf5", "#065f46", "#a7f3d0", "soft-green",    "FREE SHIPPING on orders $50+\nLimited Time Only.",                         "free-shipping",   ["pl_pdp_below_price"]),
  makeCampaign("camp_18", "DOORBUSTER DEALS",         "banner", "draft", 2,  "#0ea5e9", "#ffffff", "#0284c7", "solid-blue",    "SHOP EARLY AND SAVE BIG WITH DOORBUSTER DEALS.",                           "doorbuster",      ["pl_pdp_below_atc"]),
];

// Override camp_13 with inventory-based rule for demo
const camp13 = campaigns.find((c) => c.id === "camp_13");
if (camp13) {
  const rootGroupId = `rg_root_camp_13`;
  camp13.ruleGroups = [
    { id: rootGroupId, campaignId: "camp_13", parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    { id: "rg_exclude_camp_13", campaignId: "camp_13", parentGroupId: rootGroupId, operator: "AND", includeMode: "exclude", sortOrder: 1 },
  ];
  camp13.ruleConditions = [
    { id: "rc_camp_13_1", groupId: rootGroupId,           field: "product_tag", comparator: "contains", value: "semi-annual", sortOrder: 0 },
    { id: "rc_camp_13_2", groupId: rootGroupId,           field: "inventory",   comparator: "gt",       value: "0",          sortOrder: 1 },
    { id: "rc_camp_13_3", groupId: "rg_exclude_camp_13", field: "product_tag", comparator: "contains", value: "last-chance", sortOrder: 0 },
  ];
}

// ── Analytics mock data ───────────────────────────────────────────────────────
export const analyticsEvents: AnalyticsEvent[] = [];

// Pre-seed with realistic mock metrics per campaign
const mockMetricsBase: Record<string, { imp: number; click: number; atc: number; rev: number }> = {
  camp_1:  { imp: 48200, click: 4100, atc: 920,  rev: 28400 },
  camp_2:  { imp: 12400, click:  980, atc: 210,  rev:  6800 },
  camp_3:  { imp:  9800, click:  640, atc: 180,  rev:  5200 },
  camp_4:  { imp: 22100, click: 1820, atc: 490,  rev: 14600 },
  camp_5:  { imp: 18400, click: 1340, atc: 360,  rev: 10200 },
  camp_7:  { imp:  6200, click:  820, atc: 240,  rev:  7100 },
  camp_10: { imp: 41000, click: 3500, atc: 780,  rev: 24300 },
  camp_11: { imp: 11200, click:  890, atc: 190,  rev:  5800 },
  camp_12: { imp:  8900, click:  580, atc: 160,  rev:  4600 },
  camp_17: { imp: 19800, click: 2200, atc: 560,  rev: 18900 },
};

export function getCampaignMetrics(): CampaignMetrics[] {
  return campaigns.map((c) => {
    const base = mockMetricsBase[c.id] ?? { imp: 0, click: 0, atc: 0, rev: 0 };
    return {
      campaignId: c.id,
      impressions: base.imp,
      clicks: base.click,
      ctr: base.imp > 0 ? parseFloat(((base.click / base.imp) * 100).toFixed(2)) : 0,
      atcs: base.atc,
      revenue: base.rev,
    };
  });
}

export function findCampaign(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id);
}

export function saveCampaign(data: Campaign): Campaign {
  const idx = campaigns.findIndex((c) => c.id === data.id);
  if (idx >= 0) {
    campaigns[idx] = { ...data, updatedAt: new Date().toISOString() };
    persistCampaigns(campaigns);
    return campaigns[idx];
  }
  const created = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  campaigns.push(created);
  persistCampaigns(campaigns);
  return created;
}

export function deleteCampaign(id: string): boolean {
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  campaigns.splice(idx, 1);
  persistCampaigns(campaigns);
  return true;
}

// ── Bootstrap: load persisted campaigns over seed data ────────────────────────
// Called once from index.ts after env is ready.
export function initCampaignStore(): void {
  _persistenceEnabled = true;
  const persisted = loadCampaignsFromDisk();
  if (persisted && persisted.length > 0) {
    campaigns.length = 0;
    campaigns.push(...persisted);
  } else {
    // First run — persist the seed data so future restarts are consistent.
    persistCampaigns(campaigns);
  }
}

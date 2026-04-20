import type { Campaign, RuleGroup, RuleCondition, CampaignPlacement } from "../types/campaign";

let nextId = 30;
export function generateId(): string {
  return `camp_${++nextId}`;
}

function makeRootGroup(campaignId: string): RuleGroup {
  return { id: `rg_root_${campaignId}`, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 };
}

function tagCond(campaignId: string, value: string, sortOrder = 0): RuleCondition {
  return { id: `rc_${campaignId}_t${sortOrder}`, groupId: `rg_root_${campaignId}`, field: "product_tag", comparator: "contains", value, sortOrder };
}

function typeCond(campaignId: string, value: string, sortOrder = 1): RuleCondition {
  return { id: `rc_${campaignId}_pt${sortOrder}`, groupId: `rg_root_${campaignId}`, field: "product_type", comparator: "eq", value, sortOrder };
}

function invCond(campaignId: string, comparator: "gt" | "gte" | "lt" | "lte", value: string, sortOrder = 0): RuleCondition {
  return { id: `rc_${campaignId}_inv${sortOrder}`, groupId: `rg_root_${campaignId}`, field: "inventory", comparator, value, sortOrder };
}

function pl(campaignId: string, placementId: string, i = 0): CampaignPlacement {
  return { id: `cp_${campaignId}_${i}`, placementId, layoutKey: "default", deviceScope: "all" };
}

const ds = { startsAt: "2026-04-01T00:00:00Z", endsAt: null, timezone: "America/New_York", isActive: true };
const ws = { startsAt: "2026-03-01T00:00:00Z", endsAt: null, timezone: "America/New_York", isActive: true };
const off = { startsAt: null, endsAt: null, timezone: "America/New_York", isActive: false };

export const mockBadges: Campaign[] = [
  {
    id: "camp_1", type: "badge", name: "SITEWIDE SALE", status: "live", priority: 1, conflictMode: "replace",
    creative: { text: "SITEWIDE SALE!\nEXTRA 20% OFF IN CART!!\nDiscount applied in cart.", backgroundColor: "#1a3a5c", textColor: "#ffffff", borderColor: "#1a3a5c", stylePreset: "solid-dark" },
    ruleGroups: [makeRootGroup("camp_1")],
    ruleConditions: [tagCond("camp_1","sale",0), tagCond("camp_1","sitewide",1)],
    placements: [pl("camp_1","pl_pdp_below_price",0), pl("camp_1","pl_col_card_top",1)],
    schedule: ds, createdAt: "2026-03-15T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
    targetScope: "product",
    promotionGroup: "Spring Launch 2026",
    automationMode: "scheduled",
    countdown: { enabled: true, label: "Sale ends in", endsAt: "2026-05-01T03:00:00Z", urgencyThresholdHours: 36 },
  },
  {
    id: "camp_2", type: "badge", name: "Oops - Upside Down", status: "live", priority: 2, conflictMode: "replace",
    creative: { text: "Oops for us. Awesome for you!\nWe printed UPSIDE DOWN so now it'\''s priced extra low!\nWhile quantities last. All sales final.", backgroundColor: "#ffffff", textColor: "#333333", borderColor: "#e2e5ea", stylePreset: "outline-light" },
    ruleGroups: [makeRootGroup("camp_2")],
    ruleConditions: [tagCond("camp_2","upside-down")],
    placements: [pl("camp_2","pl_col_card_top")],
    schedule: ds, createdAt: "2026-03-20T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_3", type: "badge", name: "FREE EMBROIDERY", status: "live", priority: 3, conflictMode: "replace",
    creative: { text: "Create a keepsake as unique as your little one.\nEnjoy FREE EMBROIDERY for a limited time.\nAdditional processing days may be required.", backgroundColor: "#f0f4e8", textColor: "#2d4a1a", borderColor: "#d4e4b8", stylePreset: "soft-green" },
    ruleGroups: [makeRootGroup("camp_3")],
    ruleConditions: [tagCond("camp_3","embroidery",0), tagCond("camp_3","personalize",1)],
    placements: [pl("camp_3","pl_pdp_below_title")],
    schedule: ds, createdAt: "2026-03-10T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_4", type: "badge", name: "BEST PAJAMA SETS EVER", status: "live", priority: 4, conflictMode: "replace",
    creative: { text: "BEST PAJAMA SETS EVER\nButtery soft styles designed for comfort.\nMade to sleep, snuggle and play!", backgroundColor: "#f5f0eb", textColor: "#4a3728", borderColor: "#e0d5c8", stylePreset: "soft-warm" },
    ruleGroups: [makeRootGroup("camp_4")],
    ruleConditions: [tagCond("camp_4","pajamas",0), typeCond("camp_4","Sleepwear",1), tagCond("camp_4","best-seller",2)],
    placements: [pl("camp_4","pl_pdp_below_title")],
    schedule: ws, createdAt: "2026-02-20T10:00:00Z", updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "camp_5", type: "badge", name: "SNUGGLY-SOFT FOOTED PJS", status: "live", priority: 5, conflictMode: "replace",
    creative: { text: "SNUGGLY-SOFT FOOTED PJS\nFeaturing new two-way zipper for effortless changes.\nMade to sleep, snuggle and play!", backgroundColor: "#eef4f9", textColor: "#1a3d5c", borderColor: "#c8dae8", stylePreset: "soft-blue" },
    ruleGroups: [makeRootGroup("camp_5")],
    ruleConditions: [tagCond("camp_5","footed-pjs")],
    placements: [pl("camp_5","pl_col_card_top")],
    schedule: ws, createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "camp_6", type: "badge", name: "MADE TO TWIRL DRESSES", status: "live", priority: 6, conflictMode: "replace",
    creative: { text: "MADE TO TWIRL DRESSES\nLightweight, breathable fabric with the perfect amount of stretch.\nComfy fitting for all day wear.", backgroundColor: "#f0eef5", textColor: "#3a2d5c", borderColor: "#d8d0e8", stylePreset: "soft-purple" },
    ruleGroups: [makeRootGroup("camp_6")],
    ruleConditions: [tagCond("camp_6","dresses",0), tagCond("camp_6","twirl",1), typeCond("camp_6","Dress",2), tagCond("camp_6","spring",3)],
    placements: [pl("camp_6","pl_col_card_top")],
    schedule: ws, createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "camp_7", type: "badge", name: "LAST CHANCE", status: "live", priority: 0, conflictMode: "replace",
    creative: { text: "LAST CHANCE!\nOther discounts cannot be applied.", backgroundColor: "#dc2626", textColor: "#ffffff", borderColor: "#dc2626", stylePreset: "solid-red" },
    ruleGroups: [makeRootGroup("camp_7")],
    ruleConditions: [tagCond("camp_7","last-chance")],
    placements: [pl("camp_7","pl_pdp_above_atc")],
    schedule: ds, createdAt: "2026-03-28T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
    targetScope: "variant",
    promotionGroup: "Clearance",
    automationMode: "always_on",
    countdown: { enabled: true, label: "Final hours", endsAt: "2026-04-28T02:00:00Z", urgencyThresholdHours: 12 },
  },
];

export const mockBanners: Campaign[] = [
  {
    id: "camp_10", type: "banner", name: "SITEWIDE SALE Banner", status: "live", priority: 1, conflictMode: "replace",
    creative: { text: "SITEWIDE SALE!\nEXTRA 20% OFF IN CART!!\nDiscount applied in cart.", backgroundColor: "#1a3a5c", textColor: "#ffffff", borderColor: "#1a3a5c", stylePreset: "solid-dark" },
    ruleGroups: [makeRootGroup("camp_10")],
    ruleConditions: [tagCond("camp_10","sale",0), tagCond("camp_10","sitewide",1)],
    placements: [pl("camp_10","pl_pdp_below_price")],
    schedule: ds, createdAt: "2026-03-15T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
    targetScope: "product",
    promotionGroup: "Spring Launch 2026",
    automationMode: "scheduled",
    countdown: { enabled: true, label: "Offer ends in", endsAt: "2026-05-01T03:00:00Z", urgencyThresholdHours: 36 },
  },
  {
    id: "camp_11", type: "banner", name: "Oops Banner", status: "live", priority: 2, conflictMode: "replace",
    creative: { text: "Oops for us. Awesome for you!\nPriced extra low! While quantities last.", backgroundColor: "#d4edda", textColor: "#155724", borderColor: "#c3e6cb", stylePreset: "soft-green" },
    ruleGroups: [makeRootGroup("camp_11")],
    ruleConditions: [tagCond("camp_11","upside-down")],
    placements: [pl("camp_11","pl_pdp_below_title")],
    schedule: ds, createdAt: "2026-03-20T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_12", type: "banner", name: "FREE EMBROIDERY Banner", status: "live", priority: 3, conflictMode: "replace",
    creative: { text: "Create a keepsake.\nEnjoy FREE EMBROIDERY.\nAdditional processing time.", backgroundColor: "#f0f4e8", textColor: "#2d4a1a", borderColor: "#d4e4b8", stylePreset: "soft-green" },
    ruleGroups: [makeRootGroup("camp_12")],
    ruleConditions: [tagCond("camp_12","embroidery")],
    placements: [pl("camp_12","pl_pdp_below_atc")],
    schedule: ds, createdAt: "2026-03-10T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_13", type: "banner", name: "SEMI ANNUAL SALE", status: "draft", priority: 5, conflictMode: "replace",
    creative: { text: "They Grow Fast, SAVE FASTER!\nSEMI ANNUAL SALE\nLimited Time Only.", backgroundColor: "#fef3c7", textColor: "#92400e", borderColor: "#fcd34d", stylePreset: "solid-yellow" },
    ruleGroups: [makeRootGroup("camp_13"), { id: "rg_excl_camp_13", parentGroupId: "rg_root_camp_13", operator: "AND", includeMode: "exclude", sortOrder: 1 }],
    ruleConditions: [tagCond("camp_13","semi-annual",0), invCond("camp_13","gt","0",1), { id: "rc_camp_13_ex", groupId: "rg_excl_camp_13", field: "product_tag", comparator: "contains", value: "last-chance", sortOrder: 0 }],
    placements: [pl("camp_13","pl_pdp_below_price")],
    schedule: off, createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_14", type: "banner", name: "CLOCK'\''S TICKING", status: "draft", priority: 4, conflictMode: "replace",
    creative: { text: "CLOCK'\''S TICKING!\nFINAL HOURS TO SHOP SEMI ANNUAL SALE.", backgroundColor: "#1e3a5f", textColor: "#ffffff", borderColor: "#1e3a5f", stylePreset: "solid-dark" },
    ruleGroups: [makeRootGroup("camp_14")],
    ruleConditions: [tagCond("camp_14","final-hours")],
    placements: [pl("camp_14","pl_pdp_above_atc")],
    schedule: off, createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
    targetScope: "cart",
    promotionGroup: "Final Push",
    automationMode: "scheduled",
    countdown: { enabled: true, label: "Ending soon", endsAt: "2026-04-24T00:00:00Z", urgencyThresholdHours: 24 },
  },
  {
    id: "camp_15", type: "banner", name: "Customers Love This", status: "draft", priority: 6, conflictMode: "replace",
    creative: { text: "Customers are loving this!\nGrab yours before the price goes back up.", backgroundColor: "#fce4ec", textColor: "#880e4f", borderColor: "#f48fb1", stylePreset: "soft-pink" },
    ruleGroups: [makeRootGroup("camp_15")],
    ruleConditions: [tagCond("camp_15","trending")],
    placements: [pl("camp_15","pl_pdp_below_title")],
    schedule: off, createdAt: "2026-03-08T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_16", type: "banner", name: "FINAL HOURS", status: "draft", priority: 0, conflictMode: "replace",
    creative: { text: "FINAL HOURS!\nSave an EXTRA 20% OFF in cart.", backgroundColor: "#dc2626", textColor: "#ffffff", borderColor: "#dc2626", stylePreset: "solid-red" },
    ruleGroups: [makeRootGroup("camp_16")],
    ruleConditions: [tagCond("camp_16","final-hours")],
    placements: [pl("camp_16","pl_pdp_above_atc")],
    schedule: off, createdAt: "2026-03-15T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
    targetScope: "cart",
    promotionGroup: "Final Push",
    automationMode: "scheduled",
    countdown: { enabled: true, label: "Ends in", endsAt: "2026-04-22T00:00:00Z", urgencyThresholdHours: 18 },
  },
  {
    id: "camp_17", type: "banner", name: "FREE SHIPPING $50+", status: "live", priority: 7, conflictMode: "replace",
    creative: { text: "FREE SHIPPING on orders $50+\nLimited Time Only.", backgroundColor: "#ecfdf5", textColor: "#065f46", borderColor: "#a7f3d0", stylePreset: "soft-green" },
    ruleGroups: [makeRootGroup("camp_17")],
    ruleConditions: [{ id: "rc_camp_17_price", groupId: "rg_root_camp_17", field: "price", comparator: "gte", value: "50", sortOrder: 0 }],
    placements: [pl("camp_17","pl_pdp_below_price")],
    schedule: ds, createdAt: "2026-03-20T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "camp_18", type: "banner", name: "DOORBUSTER DEALS", status: "draft", priority: 2, conflictMode: "replace",
    creative: { text: "SHOP EARLY AND SAVE BIG WITH DOORBUSTER DEALS.", backgroundColor: "#0ea5e9", textColor: "#ffffff", borderColor: "#0284c7", stylePreset: "solid-blue" },
    ruleGroups: [makeRootGroup("camp_18")],
    ruleConditions: [tagCond("camp_18","doorbuster")],
    placements: [pl("camp_18","pl_pdp_below_atc")],
    schedule: off, createdAt: "2026-03-25T10:00:00Z", updatedAt: "2026-04-01T08:00:00Z",
  },
];

export const allCampaigns: Campaign[] = [...mockBadges, ...mockBanners];

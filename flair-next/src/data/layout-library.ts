import type { CampaignPlacement, CampaignType, DeviceScope } from "../types/campaign";

export type LayoutDefinition = {
  id: string;
  name: string;
  type: CampaignType;
  appliesTo: string;
  pageTypes: string[];
  capabilities: string[];
  variant: "pdp" | "card" | "topbar" | "inline" | "chip" | "stacked" | "custom";
  isCustom?: boolean;
  placements: Array<{
    placementId: string;
    deviceScope: DeviceScope;
  }>;
};

const BANNER_LAYOUTS: LayoutDefinition[] = [
  {
    id: "banner-pdp",
    name: "PDP Banner",
    type: "banner",
    appliesTo: "All banners",
    pageTypes: ["product"],
    capabilities: ["Inline merchandising", "Desktop + mobile", "Theme-safe"],
    variant: "pdp",
    placements: [
      { placementId: "pl_pdp_above_price", deviceScope: "all" },
    ],
  },
  {
    id: "banner-card",
    name: "Product Card",
    type: "banner",
    appliesTo: "All banners",
    pageTypes: ["product cards", "featured collections"],
    capabilities: ["Collection-ready", "Card width", "Supports stacking"],
    variant: "card",
    placements: [
      { placementId: "pl_col_card_bottom", deviceScope: "all" },
    ],
  },
  {
    id: "banner-top",
    name: "Top Banner",
    type: "banner",
    appliesTo: "All banners",
    pageTypes: ["cart", "collection", "home", "search"],
    capabilities: ["Sitewide announcement", "Sticky ready", "Campaign rotation"],
    variant: "topbar",
    placements: [
      { placementId: "pl_collection_top_banner", deviceScope: "all" },
      { placementId: "pl_home_top_banner", deviceScope: "all" },
      { placementId: "pl_search_top_banner", deviceScope: "all" },
      { placementId: "pl_cart_top_banner", deviceScope: "all" },
    ],
  },
  {
    id: "banner-inline",
    name: "Inline Add-to-Cart",
    type: "banner",
    appliesTo: "Promotional banners",
    pageTypes: ["product", "quick view"],
    capabilities: ["ATC adjacency", "Countdown compatible", "High urgency"],
    variant: "inline",
    placements: [
      { placementId: "pl_pdp_below_atc", deviceScope: "all" },
      { placementId: "pl_qv_body", deviceScope: "all" },
    ],
  },
];

const BADGE_LAYOUTS: LayoutDefinition[] = [
  {
    id: "badge-image-chip",
    name: "Product Image Chip",
    type: "badge",
    appliesTo: "All badges",
    pageTypes: ["product cards", "featured collections"],
    capabilities: ["Overlay position", "Sale-ready", "Compact footprint"],
    variant: "chip",
    placements: [
      { placementId: "pl_col_card_top", deviceScope: "all" },
    ],
  },
  {
    id: "badge-title-inline",
    name: "Title Inline",
    type: "badge",
    appliesTo: "All badges",
    pageTypes: ["product"],
    capabilities: ["Above title", "Low visual weight", "Theme-safe"],
    variant: "inline",
    placements: [
      { placementId: "pl_pdp_above_title", deviceScope: "all" },
    ],
  },
  {
    id: "badge-price-stack",
    name: "Price Stack",
    type: "badge",
    appliesTo: "Promotional badges",
    pageTypes: ["product", "quick view"],
    capabilities: ["Price adjacency", "Supports urgency", "Great for offers"],
    variant: "stacked",
    placements: [
      { placementId: "pl_pdp_below_price", deviceScope: "all" },
      { placementId: "pl_qv_body", deviceScope: "all" },
    ],
  },
  {
    id: "badge-cart-chip",
    name: "Cart Drawer Chip",
    type: "badge",
    appliesTo: "Cart messaging",
    pageTypes: ["cart drawer"],
    capabilities: ["Cart line item", "Mobile optimized", "Cross-sell friendly"],
    variant: "chip",
    placements: [
      { placementId: "pl_cart_item", deviceScope: "all" },
    ],
  },
];

export const ALL_LAYOUTS: LayoutDefinition[] = [...BADGE_LAYOUTS, ...BANNER_LAYOUTS];

export function getLayoutsByType(type: CampaignType): LayoutDefinition[] {
  return ALL_LAYOUTS.filter((layout) => layout.type === type);
}

export function getLayoutById(id: string): LayoutDefinition | undefined {
  return ALL_LAYOUTS.find((layout) => layout.id === id);
}

export function buildCampaignPlacements(layout: LayoutDefinition): CampaignPlacement[] {
  return layout.placements.map((placement, index) => ({
    id: `cp_${layout.id}_${index}_${Date.now()}`,
    placementId: placement.placementId,
    layoutKey: layout.id,
    deviceScope: placement.deviceScope,
  }));
}

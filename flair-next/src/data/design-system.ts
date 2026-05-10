import type { Campaign, Creative, DesignSystemConfig } from "../types/campaign";

export type DesignPreset = {
  id: string;
  label: string;
  creative: Partial<Creative>;
};

export type DesignAsset = {
  id: string;
  label: string;
  defaultPresetId: string;
  description: string;
};

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "gerber-core-navy",
    label: "Gerber Core Navy",
    creative: {
      backgroundColor: "#1a3a5c",
      textColor: "#ffffff",
      borderColor: "#1a3a5c",
      stylePreset: "solid-dark",
      textSize: "14px",
      fontWeight: "700",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-sale-red",
    label: "Gerber Sale Red",
    creative: {
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      borderColor: "#dc2626",
      stylePreset: "solid-red",
      textSize: "14px",
      fontWeight: "700",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-soft-cream",
    label: "Gerber Soft Cream",
    creative: {
      backgroundColor: "#f5f0eb",
      textColor: "#4a3728",
      borderColor: "#e0d5c8",
      stylePreset: "soft-warm",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-soft-green",
    label: "Gerber Soft Green",
    creative: {
      backgroundColor: "#ecfdf5",
      textColor: "#065f46",
      borderColor: "#a7f3d0",
      stylePreset: "soft-green",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-clean-white",
    label: "Gerber Clean White",
    creative: {
      backgroundColor: "#ffffff",
      textColor: "#333333",
      borderColor: "#e2e5ea",
      stylePreset: "outline-light",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
];

export const DESIGN_ASSETS: DesignAsset[] = [
  {
    id: "default-core",
    label: "Default Core",
    defaultPresetId: "gerber-core-navy",
    description: "Baseline house style for all storefront placements.",
  },
  {
    id: "seasonal-promo",
    label: "Seasonal Promo",
    defaultPresetId: "gerber-sale-red",
    description: "High-contrast promotional asset set for sale windows.",
  },
  {
    id: "editorial-soft",
    label: "Editorial Soft",
    defaultPresetId: "gerber-soft-cream",
    description: "Softer merchandising look for content and collection campaigns.",
  },
];

export function getDesignPresetById(id: string): DesignPreset | undefined {
  return DESIGN_PRESETS.find((preset) => preset.id === id);
}

export function getDefaultDesignSystemConfig(): DesignSystemConfig {
  return {
    mode: "default",
    defaultPresetId: "gerber-core-navy",
    assetId: "default-core",
    customDesignLabel: null,
    productTagRules: [
      { tag: "sale", presetId: "gerber-sale-red" },
      { tag: "clearance", presetId: "gerber-sale-red" },
    ],
    metafieldRules: [
      { namespace: "custom", key: "flair_theme", presetId: "gerber-core-navy" },
    ],
    metaobjectRules: [
      { type: "flair_theme", field: "variant", value: "default", presetId: "gerber-core-navy" },
    ],
  };
}

export function applyDesignPresetToCreative(campaign: Campaign, presetId: string): Campaign {
  const preset = getDesignPresetById(presetId);
  if (!preset) return campaign;

  return {
    ...campaign,
    creative: {
      ...campaign.creative,
      ...preset.creative,
      cornerPreset: campaign.type === "banner"
        ? campaign.creative.cornerPreset ?? "square"
        : campaign.creative.cornerPreset ?? "rounded",
    },
  };
}

export function resolveCampaignCreative(campaign: Campaign): Creative {
  const config = campaign.designSystemConfig;
  if (!config) return campaign.creative;

  let presetId = config.defaultPresetId;

  if (config.mode === "asset" && config.assetId) {
    const asset = DESIGN_ASSETS.find((item) => item.id === config.assetId);
    if (asset) presetId = asset.defaultPresetId;
  }

  const tagTokens = [
    ...(campaign.tags ?? []),
    ...campaign.ruleConditions
      .filter((condition) => condition.field === "product_tag")
      .map((condition) => condition.value),
  ].map((token) => token.trim().toLowerCase());

  const matchedRule = config.productTagRules.find((rule) =>
    tagTokens.some((token) => token.includes(rule.tag.trim().toLowerCase())),
  );

  if (matchedRule) {
    presetId = matchedRule.presetId;
  }

  const preset = getDesignPresetById(presetId);
  if (!preset) return campaign.creative;

  return {
    ...campaign.creative,
    ...preset.creative,
  };
}

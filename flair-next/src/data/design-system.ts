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

export type ColorOption = {
  name: string;
  hex: string;
  category: string;
};

export type TypographySize = {
  size: string;
  label: string;
};

export type FontWeight = {
  weight: string;
  label: string;
};

// Gerber brand colors from Design System V1.0
export const GERBER_COLORS: ColorOption[] = [
  // Brand Colors Official (Canonical)
  { name: "Oxford Blue", hex: "#002744", category: "Brand Official" },
  { name: "Jordy Blue", hex: "#85B7EA", category: "Brand Official" },
  { name: "Hawkes Blue", hex: "#CEE2F7", category: "Brand Official" },
  { name: "Spring Wood", hex: "#F9F5F3", category: "Brand Official" },
  { name: "Ronchi", hex: "#F2C94C", category: "Brand Official" },
  { name: "Sandy Brown", hex: "#F4A261", category: "Brand Official" },
  { name: "Geraldine", hex: "#F28C82", category: "Brand Official" },
  { name: "Sea Nymph", hex: "#86B3A1", category: "Brand Official" },
  
  // Navy Shades (from Oxford Blue)
  { name: "Navy 80", hex: "#335369", category: "Navy Shades" },
  { name: "Navy 60", hex: "#667F8E", category: "Navy Shades" },
  { name: "Navy 40", hex: "#99A9B4", category: "Navy Shades" },
  { name: "Navy 20", hex: "#CCD4D9", category: "Navy Shades" },
  
  // Neutrals & Accents
  { name: "White", hex: "#FFFFFF", category: "Neutrals" },
  { name: "Off-White 2", hex: "#F4EFEC", category: "Neutrals" },
  { name: "Hairline", hex: "#E6E8EC", category: "Neutrals" },
  { name: "Sky", hex: "#5A9FDB", category: "Accents" },
  { name: "Sky 700 (Focus)", hex: "#2B7AC1", category: "Accents" },
  
  // Functional
  { name: "Coral (Sale)", hex: "#BF360C", category: "Functional" },
  { name: "Coral Tint", hex: "#FBE9E4", category: "Functional" },
  { name: "Success", hex: "#1A7F37", category: "Functional" },
];

// Typography sizes from Design System V1.0 (Montserrat scale)
export const TYPOGRAPHY_SIZES: TypographySize[] = [
  { size: "12px", label: "Caption / Eyebrow" },
  { size: "13px", label: "Button Label" },
  { size: "14px", label: "Body" },
  { size: "16px", label: "Body Large / H6" },
  { size: "18px", label: "H5" },
  { size: "22px", label: "H4" },
  { size: "28px", label: "H3" },
  { size: "32px", label: "H2" },
  { size: "40px", label: "H1" },
  { size: "64px", label: "Display 2" },
  { size: "91.4px", label: "Display 1" },
];

// Font weights from Design System V1.0
export const FONT_WEIGHTS: FontWeight[] = [
  { weight: "400", label: "Regular" },
  { weight: "500", label: "Medium" },
  { weight: "600", label: "Semibold" },
  { weight: "700", label: "Bold" },
];

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "gerber-core-navy",
    label: "Gerber Core Navy",
    creative: {
      backgroundColor: "#002744",
      textColor: "#ffffff",
      borderColor: "#002744",
      stylePreset: "solid-dark",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-sale-coral",
    label: "Gerber Sale Coral",
    creative: {
      backgroundColor: "#BF360C",
      textColor: "#ffffff",
      borderColor: "#BF360C",
      stylePreset: "solid-red",
      textSize: "14px",
      fontWeight: "700",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-spring-wood",
    label: "Gerber Spring Wood",
    creative: {
      backgroundColor: "#F9F5F3",
      textColor: "#002744",
      borderColor: "#E6E8EC",
      stylePreset: "outline-light",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-sea-nymph",
    label: "Gerber Sea Nymph",
    creative: {
      backgroundColor: "#86B3A1",
      textColor: "#ffffff",
      borderColor: "#86B3A1",
      stylePreset: "soft-green",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-sandy-brown",
    label: "Gerber Sandy Brown",
    creative: {
      backgroundColor: "#F4A261",
      textColor: "#ffffff",
      borderColor: "#F4A261",
      stylePreset: "solid-orange",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-jordy-blue",
    label: "Gerber Jordy Blue",
    creative: {
      backgroundColor: "#85B7EA",
      textColor: "#002744",
      borderColor: "#85B7EA",
      stylePreset: "solid-blue",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-ronchi",
    label: "Gerber Ronchi",
    creative: {
      backgroundColor: "#F2C94C",
      textColor: "#002744",
      borderColor: "#F2C94C",
      stylePreset: "solid-yellow",
      textSize: "14px",
      fontWeight: "600",
      borderWidthPreset: "thin",
      cornerPreset: "rounded",
    },
  },
  {
    id: "gerber-geraldine",
    label: "Gerber Geraldine",
    creative: {
      backgroundColor: "#F28C82",
      textColor: "#ffffff",
      borderColor: "#F28C82",
      stylePreset: "soft-pink",
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
      { namespace: "custom", key: "campaign_theme", presetId: "gerber-core-navy" },
    ],
    metaobjectRules: [
      { type: "campaign_theme", field: "variant", value: "default", presetId: "gerber-core-navy" },
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

import { useState } from "react";
import type { Campaign, CampaignType, RuleGroup, RuleCondition, CampaignPlacement } from "../types/campaign";
import CampaignPreview from "./CampaignPreview";
import RuleBuilder from "./RuleBuilder";
import PlacementPicker from "./PlacementPicker";
import TemplateLibrary, { type TemplateDef } from "./TemplateLibrary";
import { generateId } from "../data/mock-campaigns";
import {
  DESIGN_ASSETS,
  DESIGN_PRESETS,
  GERBER_COLORS,
  TYPOGRAPHY_SIZES,
  FONT_WEIGHTS,
  getDefaultDesignSystemConfig,
  getDesignPresetById,
  applyDesignPresetToCreative,
} from "../data/design-system";

type Props = {
  campaign: Campaign | null;
  type: CampaignType;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
};

const presetColors = GERBER_COLORS.map(color => ({
  name: color.name,
  bg: color.hex,
  text: getContrastingTextColor(color.hex),
  border: color.hex,
  preset: color.category.toLowerCase().replace(/\s+/g, "-"),
  className: `preset-swatch--${color.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
}));

// Helper function to determine contrasting text color
function getContrastingTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#002744" : "#ffffff";
}

const paddingOptions = ["tight", "normal", "spacious"] as const;
const letterSpacingOptions = ["normal", "wide", "wider"] as const;
const borderWidthOptions = ["none", "thin", "medium"] as const;
const shadowOptions = ["none", "small", "medium"] as const;
const cornerOptions = ["square", "rounded", "pill"] as const;

function compileScopedCss(rawCss: string, campaignId: string, safeMode: "strict" | "balanced" | "off"): string {
  const trimmed = rawCss.trim();
  if (!trimmed) return "";

  let css = trimmed;
  const scopeClass = `.gcw-campaign-${campaignId}`;

  // Block high-risk patterns outside of explicit "off" mode.
  if (safeMode !== "off") {
    css = css
      .replace(/@import[^;]*;?/gi, "")
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/javascript\s*:/gi, "");
  }

  // Strict mode also strips fixed positioning to avoid layout takeover in preview.
  if (safeMode === "strict") {
    css = css
      .replace(/position\s*:\s*fixed\s*;?/gi, "")
      .replace(/z-index\s*:\s*\d+\s*;?/gi, "");
  }

  const blocks = css.split("}");
  const scopedBlocks = blocks
    .map((block) => {
      const parts = block.split("{");
      if (parts.length < 2) return "";

      const selectorPart = parts[0].trim();
      const body = parts.slice(1).join("{").trim();
      if (!selectorPart || !body) return "";

      if (selectorPart.startsWith("@")) {
        return `${selectorPart} { ${body} }`;
      }

      const scopedSelector = selectorPart
        .split(",")
        .map((selector) => selector.trim())
        .filter(Boolean)
        .map((selector) => {
          if (selector.includes(".flair-campaign") || selector.includes(".gcw-campaign")) {
            return selector
              .replace(/\.(?:flair|gcw)-campaign-[A-Za-z0-9_-]+/g, scopeClass)
              .replace(/\.(?:flair|gcw)-campaign\b/g, scopeClass);
          }
          return `${scopeClass} ${selector}`;
        })
        .join(", ");

      return `${scopedSelector} { ${body} }`;
    })
    .filter(Boolean)
    .join("\n");

  return scopedBlocks;
}

function createBlank(type: CampaignType): Campaign {
  const now = new Date().toISOString();
  const id  = generateId();
  const rootGroupId = `rg_root_${id}`;
  const designSystemConfig = getDefaultDesignSystemConfig();
  const defaultPreset = getDesignPresetById(designSystemConfig.defaultPresetId);
  return {
    id,
    type,
    status: "draft",
    name: "",
    creative: {
      text: "",
      backgroundColor: defaultPreset?.creative.backgroundColor ?? "#1a3a5c",
      textColor: defaultPreset?.creative.textColor ?? "#ffffff",
      borderColor: defaultPreset?.creative.borderColor ?? "#1a3a5c",
      stylePreset: defaultPreset?.creative.stylePreset ?? "solid-dark",
      contentMode: "text",
      textSize: defaultPreset?.creative.textSize ?? "14px",
      fontWeight: defaultPreset?.creative.fontWeight ?? "700",
      paddingPreset: defaultPreset?.creative.paddingPreset ?? "normal",
      letterSpacingPreset: defaultPreset?.creative.letterSpacingPreset ?? "normal",
      borderWidthPreset: defaultPreset?.creative.borderWidthPreset ?? "thin",
      shadowPreset: defaultPreset?.creative.shadowPreset ?? "none",
      cornerPreset: type === "banner" ? "square" : "rounded",
    },
    ruleGroups: [
      { id: rootGroupId, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    ],
    ruleConditions: [],
    placements: [],
    priority: 10,
    conflictMode: "replace",
    schedule: { startsAt: null, endsAt: null, timezone: "America/New_York", isActive: false, timeOfDayStart: "00:00", timeOfDayEnd: "03:00" },
    targetScope: "product",
    promotionGroup: null,
    automationMode: "manual",
    countdown: {
      enabled: false,
      label: "Sale ends in",
      endsAt: null,
      urgencyThresholdHours: 24,
    },
    linkUrl: null,
    tags: [],
    styleConfig: {
      customCssRaw: "",
      customCssScoped: "",
      safeMode: "balanced",
    },
    designSystemConfig,
    abTestConfig: undefined,
    variantTargets: undefined,
    workflowConfig: undefined,
    notificationConfig: undefined,
    metricsConfig: undefined,
    recommendationConfig: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function hydrateDesignSystemConfig(campaign: Campaign): Campaign {
  if (campaign.designSystemConfig) return campaign;
  return {
    ...campaign,
    designSystemConfig: getDefaultDesignSystemConfig(),
  };
}

function toTagArray(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export default function CampaignEditor({ campaign, type, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Campaign>(hydrateDesignSystemConfig(campaign ?? createBlank(type)));
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(Boolean(campaign?.linkUrl));
  const [showTagsEditor, setShowTagsEditor] = useState(Boolean(campaign?.tags?.length));

  const update = (patch: Partial<Campaign>) =>
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));

  const updateCreative = (patch: Partial<Campaign["creative"]>) =>
    update({ creative: { ...draft.creative, ...patch } });

  const updateSchedule = (patch: Partial<Campaign["schedule"]>) =>
    update({ schedule: { ...draft.schedule, ...patch } });

  const updateStyleConfig = (patch: Partial<NonNullable<Campaign["styleConfig"]>>) => {
    update({
      styleConfig: {
        customCssRaw: draft.styleConfig?.customCssRaw ?? "",
        customCssScoped: draft.styleConfig?.customCssScoped ?? "",
        safeMode: draft.styleConfig?.safeMode ?? "balanced",
        ...patch,
      },
    });
  };

  const updateDesignSystemConfig = (patch: Partial<NonNullable<Campaign["designSystemConfig"]>>) => {
    const base = draft.designSystemConfig ?? getDefaultDesignSystemConfig();
    update({
      designSystemConfig: {
        ...base,
        ...patch,
      },
    });
  };

  const applyDesignPreset = (presetId: string) => {
    const next = applyDesignPresetToCreative(draft, presetId);
    update({
      creative: next.creative,
      designSystemConfig: {
        ...(draft.designSystemConfig ?? getDefaultDesignSystemConfig()),
        defaultPresetId: presetId,
      },
    });
  };

  const parseTagRuleLines = (input: string) =>
    input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [tag, presetId] = line.split("=>").map((part) => part.trim());
        return { tag, presetId };
      })
      .filter((row) => row.tag && row.presetId);

  const parseMetafieldRuleLines = (input: string) =>
    input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [metaKey, presetId] = line.split("=>").map((part) => part.trim());
        const [namespace, key] = (metaKey ?? "").split(".");
        return { namespace: namespace?.trim(), key: key?.trim(), presetId };
      })
      .filter((row) => row.namespace && row.key && row.presetId) as { namespace: string; key: string; presetId: string }[];

  const parseMetaobjectRuleLines = (input: string) =>
    input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [lhs, presetId] = line.split("=>").map((part) => part.trim());
        const [typePart, valuePart] = (lhs ?? "").split(":").map((part) => part.trim());
        const [field, value] = (valuePart ?? "").split("=").map((part) => part.trim());
        return {
          type: typePart,
          field: field || undefined,
          value: value || undefined,
          presetId,
        };
      })
      .filter((row) => row.type && row.presetId);

  const setCustomCss = (rawCss: string) => {
    updateStyleConfig({
      customCssRaw: rawCss,
      customCssScoped: compileScopedCss(rawCss, draft.id, draft.styleConfig?.safeMode ?? "balanced"),
    });
  };

  const handleSave = () => {
    const name = draft.name.trim() || draft.creative.text.split("\n")[0] || "Untitled";
    onSave({ ...draft, name });
  };

  const applyTemplate = (tmpl: TemplateDef) => {
    updateCreative({
      backgroundColor: tmpl.defaultCreative.backgroundColor,
      textColor:       tmpl.defaultCreative.textColor,
      borderColor:     tmpl.defaultCreative.borderColor,
      stylePreset:     tmpl.defaultCreative.stylePreset,
      ...(tmpl.defaultCreative.text ? { text: tmpl.defaultCreative.text } : {}),
    });
    setShowTemplates(false);
  };

  const tagsValue = (draft.tags ?? []).join(", ");
  const dsConfig = draft.designSystemConfig ?? getDefaultDesignSystemConfig();
  const tagRuleText = dsConfig.productTagRules.map((rule) => `${rule.tag} => ${rule.presetId}`).join("\n");
  const metafieldRuleText = dsConfig.metafieldRules.map((rule) => `${rule.namespace}.${rule.key} => ${rule.presetId}`).join("\n");
  const metaobjectRuleText = dsConfig.metaobjectRules
    .map((rule) => `${rule.type}${rule.field ? `:${rule.field}${rule.value ? `=${rule.value}` : ""}` : ""} => ${rule.presetId}`)
    .join("\n");
  const rootGroup = draft.ruleGroups.find((g) => g.parentGroupId === null) ?? draft.ruleGroups[0];
  const isAnyCondition = rootGroup?.operator === "OR";

  if (showTemplates) {
    return (
      <TemplateLibrary
        onApply={applyTemplate}
        onClose={() => setShowTemplates(false)}
      />
    );
  }

  return (
    <div className="editor-layout editor-layout--flair">
      <div className="editor-form editor-form--flair">
        {/* Header */}
        <div className="editor-header">
          <button className="ghost-btn" onClick={onCancel}>← Back</button>
          <h2>{campaign ? "Edit" : "New"} {type === "badge" ? "Badge" : "Banner"}</h2>
          <div className="editor-header-actions">
            <button className="ghost-btn" onClick={() => setShowTemplates(true)}>
              Templates
            </button>
            <button className="ghost-btn" onClick={onCancel}>Discard</button>
            <button className="primary-btn" onClick={handleSave}>Save {type}</button>
          </div>
        </div>

        <div className="flair-builder-grid">
          <section className="flair-builder-main">
            {/* Campaign name */}
            <fieldset className="editor-section editor-section--compact">
              <legend>{type === "badge" ? "Badge" : "Banner"} name</legend>
              <input
                className="editor-name-input"
                type="text"
                placeholder={`e.g. Summer sale ${type}`}
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </fieldset>

            <fieldset className="editor-section">
              <legend>Preview</legend>
              <CampaignPreview campaign={draft} />
            </fieldset>

            <fieldset className="editor-section">
              <legend>Content</legend>
              <div className="content-type-row">
                <label className="inline-radio">
                  <input
                    type="radio"
                    checked={(draft.creative.contentMode ?? "text") === "text"}
                    onChange={() => updateCreative({ contentMode: "text" })}
                  />
                  <span>Text</span>
                </label>
                <label className="inline-radio">
                  <input
                    type="radio"
                    checked={(draft.creative.contentMode ?? "text") === "image"}
                    onChange={() => updateCreative({ contentMode: "image" })}
                  />
                  <span>Image</span>
                </label>
              </div>

              <label className="field-label">
                {type === "badge" ? "Badge text" : "Banner text"}
                <textarea
                  id="creative-text-area"
                  className="field-textarea"
                  rows={4}
                  value={draft.creative.text}
                  onChange={(e) => updateCreative({ text: e.target.value })}
                />
              </label>

              {/* Dynamic text token insertion */}
              <div className="dynamic-text-bar">
                <span>Insert:</span>
                {[
                  { label: "{{sale_percent_max}}", title: "Max sale %" },
                  { label: "{{sale_amount_max}}", title: "Max $ savings" },
                  { label: "{{inventory_total}}", title: "Stock remaining" },
                  { label: "{{customer_first_name}}", title: "Customer first name" },
                  { label: "{{price_max_discount_percent_20}}", title: "Calculated discount price" },
                ].map(({ label, title }) => (
                  <button
                    key={label}
                    className="token-btn"
                    title={title}
                    onClick={() => {
                      const el = document.getElementById("creative-text-area") as HTMLTextAreaElement | null;
                      if (el) {
                        const start = el.selectionStart ?? draft.creative.text.length;
                        const end   = el.selectionEnd   ?? start;
                        const next  = draft.creative.text.slice(0, start) + label + draft.creative.text.slice(end);
                        updateCreative({ text: next });
                        requestAnimationFrame(() => {
                          el.selectionStart = el.selectionEnd = start + label.length;
                          el.focus();
                        });
                      } else {
                        updateCreative({ text: draft.creative.text + label });
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {type === "banner" && (
                <div className="css-snippet-row">
                  <button className="ghost-btn" onClick={() => update({ linkUrl: draft.linkUrl ?? "/collections/sale" })}>
                    + Add button
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() =>
                      update({
                        countdown: {
                          enabled: true,
                          label: draft.countdown?.label ?? "Sale ends in",
                          endsAt: draft.countdown?.endsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                          urgencyThresholdHours: draft.countdown?.urgencyThresholdHours ?? 24,
                        },
                      })
                    }
                  >
                    + Add countdown
                  </button>
                </div>
              )}
            </fieldset>

            <fieldset className="editor-section">
              <legend>Design System</legend>

              <div className="design-system-grid">
                <label className="field-label">
                  Design mode
                  <select
                    value={dsConfig.mode}
                    onChange={(e) => updateDesignSystemConfig({ mode: e.target.value as "default" | "asset" | "custom" })}
                  >
                    <option value="default">Default system</option>
                    <option value="asset">Design asset</option>
                    <option value="custom">Custom design</option>
                  </select>
                </label>

                <label className="field-label">
                  Default preset
                  <div className="design-preset-row">
                    <select
                      value={dsConfig.defaultPresetId}
                      onChange={(e) => updateDesignSystemConfig({ defaultPresetId: e.target.value })}
                    >
                      {DESIGN_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                    <button className="ghost-btn" onClick={() => applyDesignPreset(dsConfig.defaultPresetId)}>Apply</button>
                  </div>
                </label>
              </div>

              {dsConfig.mode === "asset" && (
                <label className="field-label">
                  Design asset pack
                  <div className="design-preset-row">
                    <select
                      value={dsConfig.assetId ?? ""}
                      onChange={(e) => {
                        const asset = DESIGN_ASSETS.find((a) => a.id === e.target.value) ?? null;
                        updateDesignSystemConfig({
                          assetId: asset?.id ?? null,
                          defaultPresetId: asset?.defaultPresetId ?? dsConfig.defaultPresetId,
                        });
                      }}
                    >
                      {DESIGN_ASSETS.map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.label}</option>
                      ))}
                    </select>
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        const asset = DESIGN_ASSETS.find((a) => a.id === dsConfig.assetId);
                        if (asset) applyDesignPreset(asset.defaultPresetId);
                      }}
                    >
                      Use asset
                    </button>
                  </div>
                </label>
              )}

              {dsConfig.mode === "custom" && (
                <label className="field-label">
                  Custom design label
                  <input
                    type="text"
                    value={dsConfig.customDesignLabel ?? ""}
                    placeholder="e.g. Hyper Seasonal Capsule"
                    onChange={(e) => updateDesignSystemConfig({ customDesignLabel: e.target.value || null })}
                  />
                </label>
              )}

              <p className="design-system-note">
                Set default standards, then override by product tags or store data models for automated campaign theming.
              </p>

              <label className="field-label">
                Product tag rules
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={tagRuleText}
                  onChange={(e) => updateDesignSystemConfig({ productTagRules: parseTagRuleLines(e.target.value) })}
                  placeholder={`sale => gerber-sale-red\nclearance => gerber-sale-red`}
                />
              </label>

              <label className="field-label">
                Metafield rules
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={metafieldRuleText}
                  onChange={(e) => updateDesignSystemConfig({ metafieldRules: parseMetafieldRuleLines(e.target.value) })}
                  placeholder={`custom.campaign_theme => gerber-core-navy\ncustom.badge_theme => gerber-soft-green`}
                />
              </label>

              <label className="field-label">
                Metaobject rules
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={metaobjectRuleText}
                  onChange={(e) => updateDesignSystemConfig({ metaobjectRules: parseMetaobjectRuleLines(e.target.value) })}
                  placeholder={`campaign_theme:variant=default => gerber-core-navy\ncampaign_theme:variant=sale => gerber-sale-red`}
                />
              </label>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Style</legend>
              <div className="color-presets">
                <span className="field-label">Style preset</span>
                <div className="preset-grid">
                  {presetColors.map((p) => (
                    <button
                      key={p.name}
                      className={`preset-swatch ${p.className} ${draft.creative.backgroundColor === p.bg ? "active" : ""}`}
                      onClick={() => updateCreative({ backgroundColor: p.bg, textColor: p.text, borderColor: p.border, stylePreset: p.preset })}
                      title={p.name}
                    >Aa</button>
                  ))}
                </div>
              </div>

              <div className="style-grid">
                <label className="field-label">
                  Background
                  <input type="color" value={draft.creative.backgroundColor} onChange={(e) => updateCreative({ backgroundColor: e.target.value })} />
                </label>
                <label className="field-label">
                  Text color
                  <input type="color" value={draft.creative.textColor} onChange={(e) => updateCreative({ textColor: e.target.value })} />
                </label>
                <label className="field-label">
                  Border color
                  <input type="color" value={draft.creative.borderColor} onChange={(e) => updateCreative({ borderColor: e.target.value })} />
                </label>
                <label className="field-label">
                  Text size
                  <select
                    value={draft.creative.textSize ?? "14px"}
                    onChange={(e) => updateCreative({ textSize: e.target.value as Campaign["creative"]["textSize"] })}
                  >
                    {TYPOGRAPHY_SIZES.map((t) => <option key={t.size} value={t.size}>{t.size} - {t.label}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Text style
                  <select
                    value={draft.creative.fontWeight ?? "600"}
                    onChange={(e) => updateCreative({ fontWeight: e.target.value as Campaign["creative"]["fontWeight"] })}
                  >
                    {FONT_WEIGHTS.map((w) => <option key={w.weight} value={w.weight}>{w.label} ({w.weight})</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Padding
                  <select
                    value={draft.creative.paddingPreset ?? "normal"}
                    onChange={(e) => updateCreative({ paddingPreset: e.target.value as Campaign["creative"]["paddingPreset"] })}
                  >
                    {paddingOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Letter spacing
                  <select
                    value={draft.creative.letterSpacingPreset ?? "normal"}
                    onChange={(e) => updateCreative({ letterSpacingPreset: e.target.value as Campaign["creative"]["letterSpacingPreset"] })}
                  >
                    {letterSpacingOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Border size
                  <select
                    value={draft.creative.borderWidthPreset ?? "thin"}
                    onChange={(e) => updateCreative({ borderWidthPreset: e.target.value as Campaign["creative"]["borderWidthPreset"] })}
                  >
                    {borderWidthOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Shadow
                  <select
                    value={draft.creative.shadowPreset ?? "none"}
                    onChange={(e) => updateCreative({ shadowPreset: e.target.value as Campaign["creative"]["shadowPreset"] })}
                  >
                    {shadowOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Corners
                  <select
                    value={draft.creative.cornerPreset ?? (type === "banner" ? "square" : "rounded")}
                    onChange={(e) => updateCreative({ cornerPreset: e.target.value as Campaign["creative"]["cornerPreset"] })}
                  >
                    {cornerOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Conditions</legend>
              <div className="condition-mode-row">
                <span>Show based on:</span>
                <label className="inline-radio">
                  <input
                    type="radio"
                    checked={!isAnyCondition}
                    onChange={() =>
                      rootGroup && update({
                        ruleGroups: draft.ruleGroups.map((g) =>
                          g.id === rootGroup.id ? { ...g, operator: "AND" } : g,
                        ),
                      })
                    }
                  />
                  <span>ALL conditions</span>
                </label>
                <label className="inline-radio">
                  <input
                    type="radio"
                    checked={isAnyCondition}
                    onChange={() =>
                      rootGroup && update({
                        ruleGroups: draft.ruleGroups.map((g) =>
                          g.id === rootGroup.id ? { ...g, operator: "OR" } : g,
                        ),
                      })
                    }
                  />
                  <span>ANY conditions</span>
                </label>
              </div>

              <RuleBuilder
                groups={draft.ruleGroups}
                conditions={draft.ruleConditions}
                onChange={(groups: RuleGroup[], conditions: RuleCondition[]) =>
                  update({ ruleGroups: groups, ruleConditions: conditions })
                }
              />

              <div className="quick-target-row">
                <span className="quick-target-label">Quick add:</span>
                {[
                  { label: "+ Product tag", field: "product_tag" as const, value: "" },
                  { label: "+ Metafield", field: "metafield_value" as const, value: "" },
                  { label: "+ Metaobject", field: "metaobject_handle" as const, value: "" },
                  { label: "+ Collection", field: "collection_id" as const, value: "" },
                  { label: "+ Compare-at price", field: "compare_at_price" as const, value: "" },
                ].map(({ label, field, value }) => (
                  <button
                    key={field}
                    className="css-snippet-btn"
                    onClick={() => {
                      if (!rootGroup) return;
                      const newCond: RuleCondition = {
                        id: generateId(),
                        groupId: rootGroup.id,
                        field,
                        comparator: field === "compare_at_price" ? "gt" : field === "metafield_value" ? "eq" : "contains",
                        value,
                        sortOrder: draft.ruleConditions.length,
                      };
                      update({ ruleConditions: [...draft.ruleConditions, newCond] });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Placements</legend>
              <PlacementPicker
                selected={draft.placements}
                onChange={(placements: CampaignPlacement[]) => update({ placements })}
              />
            </fieldset>

            <details className="advanced-section">
              <summary>Advanced options</summary>
              <div className="advanced-section-body">

            <fieldset className="editor-section">
              <legend>A/B Testing</legend>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.abTestConfig?.enabled ?? false}
                  onChange={(e) => update({
                    abTestConfig: {
                      enabled: e.target.checked,
                      testName: draft.abTestConfig?.testName ?? "Variant Test",
                      variants: draft.abTestConfig?.variants ?? [
                        { id: "var_a", name: "Variant A", creative: draft.creative, allocationPercent: 50 },
                        { id: "var_b", name: "Variant B", creative: { ...draft.creative, backgroundColor: "#dc2626" }, allocationPercent: 50 },
                      ],
                    }
                  })}
                />
                <span>Enable A/B testing for this campaign</span>
              </label>
              {draft.abTestConfig?.enabled && (
                <div className="section-callout">
                  <label className="field-label">
                    Test name
                    <input
                      type="text"
                      value={draft.abTestConfig.testName}
                      onChange={(e) => update({
                        abTestConfig: { ...draft.abTestConfig!, testName: e.target.value }
                      })}
                    />
                  </label>
                  <label className="field-label">
                    Winner criteria
                    <select
                      value={draft.abTestConfig.winnerCriteria ?? "conversion"}
                      onChange={(e) => update({
                        abTestConfig: { ...draft.abTestConfig!, winnerCriteria: e.target.value as any }
                      })}
                    >
                      <option value="conversion">Conversion Rate</option>
                      <option value="clicks">Click-Through Rate</option>
                      <option value="engagement">Engagement</option>
                      <option value="revenue">Revenue</option>
                    </select>
                  </label>
                  <p className="helper-copy">
                    {draft.abTestConfig.variants?.length || 0} variant(s) configured
                  </p>
                </div>
              )}
            </fieldset>

            <fieldset className="editor-section">
              <legend>Advanced Scheduling</legend>
              <div className="schedule-grid">
                <label className="field-label">
                  Days of week
                  <input
                    type="text"
                    placeholder="mon, wed, fri (leave blank for daily)"
                    value={draft.schedule.daysOfWeek?.join(", ") ?? ""}
                    onChange={(e) => updateSchedule({
                      daysOfWeek: e.target.value ? e.target.value.split(",").map(d => d.trim() as any) : undefined
                    })}
                  />
                </label>
                <label className="field-label">
                  Time of day start
                  <input
                    type="time"
                    value={draft.schedule.timeOfDayStart ?? ""}
                    onChange={(e) => updateSchedule({ timeOfDayStart: e.target.value || undefined })}
                  />
                </label>
                <label className="field-label">
                  Time of day end
                  <input
                    type="time"
                    value={draft.schedule.timeOfDayEnd ?? ""}
                    onChange={(e) => updateSchedule({ timeOfDayEnd: e.target.value || undefined })}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Variant Targeting</legend>
              <p className="helper-copy helper-copy--block">
                Optionally target specific product variants. Leave empty to target all matching products.
              </p>
              <label className="field-label">
                Target specific variants (comma-separated SKUs)
                <input
                  type="text"
                  placeholder="SKU-001, SKU-002, SKU-003"
                  value={(draft.variantTargets ?? []).map((v) => v.sku).join(", ")}
                  onChange={(e) => {
                    const skus = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    update({
                      variantTargets: skus.map((sku, i) => ({
                        id: `vt_${draft.id}_${i}`,
                        variantId: sku,
                        sku,
                        title: `Variant: ${sku}`,
                      })),
                    });
                  }}
                />
              </label>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Workflows</legend>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.workflowConfig?.enabled ?? false}
                  onChange={(e) => update({
                    workflowConfig: {
                      enabled: e.target.checked,
                      name: draft.workflowConfig?.name ?? "Default Workflow",
                      trigger: "campaign_start",
                      steps: [],
                    }
                  })}
                />
                <span>Enable advanced workflows</span>
              </label>
              {draft.workflowConfig?.enabled && (
                <div className="section-callout">
                  <label className="field-label">
                    Workflow trigger
                    <select
                      value={draft.workflowConfig.trigger}
                      onChange={(e) => update({
                        workflowConfig: { ...draft.workflowConfig!, trigger: e.target.value as any }
                      })}
                    >
                      <option value="campaign_start">Campaign Start</option>
                      <option value="manual">Manual</option>
                      <option value="schedule">On Schedule</option>
                      <option value="performance_milestone">Performance Milestone</option>
                    </select>
                  </label>
                  <p className="helper-copy">
                    Workflows will execute {draft.workflowConfig.trigger} automatically
                  </p>
                </div>
              )}
            </fieldset>

            <fieldset className="editor-section">
              <legend>Notifications</legend>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.notificationConfig?.emailOnLaunch ?? false}
                  onChange={(e) => update({
                    notificationConfig: {
                      ...(draft.notificationConfig || {}),
                      emailOnLaunch: e.target.checked,
                      emailOnPause: draft.notificationConfig?.emailOnPause ?? false,
                      emailOnWarnings: draft.notificationConfig?.emailOnWarnings ?? false,
                      emailAddresses: draft.notificationConfig?.emailAddresses ?? [],
                    } as any
                  })}
                />
                <span>Email notification on campaign launch</span>
              </label>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.notificationConfig?.emailOnPause ?? false}
                  onChange={(e) => update({
                    notificationConfig: {
                      ...(draft.notificationConfig || {}),
                      emailOnLaunch: draft.notificationConfig?.emailOnLaunch ?? false,
                      emailOnPause: e.target.checked,
                      emailOnWarnings: draft.notificationConfig?.emailOnWarnings ?? false,
                      emailAddresses: draft.notificationConfig?.emailAddresses ?? [],
                    } as any
                  })}
                />
                <span>Email notification on pause</span>
              </label>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.notificationConfig?.emailOnWarnings ?? false}
                  onChange={(e) => update({
                    notificationConfig: {
                      ...(draft.notificationConfig || {}),
                      emailOnLaunch: draft.notificationConfig?.emailOnLaunch ?? false,
                      emailOnPause: draft.notificationConfig?.emailOnPause ?? false,
                      emailOnWarnings: e.target.checked,
                      emailAddresses: draft.notificationConfig?.emailAddresses ?? [],
                    } as any
                  })}
                />
                <span>Alert on low performance</span>
              </label>
            </fieldset>

            <fieldset className="editor-section">
              <legend>Metrics & ROI</legend>
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={draft.metricsConfig?.enabled ?? false}
                  onChange={(e) => update({
                    metricsConfig: {
                      enabled: e.target.checked,
                      trackingEnabled: e.target.checked,
                      snapshots: [],
                    }
                  })}
                />
                <span>Enable revenue and ROI tracking</span>
              </label>
              {draft.metricsConfig?.enabled && (
                <div className="section-callout">
                  <label className="field-label">
                    ROI target (%)
                    <input
                      type="number"
                      value={draft.metricsConfig.roiTarget ?? 0}
                      onChange={(e) => update({
                        metricsConfig: {
                          ...draft.metricsConfig!,
                          roiTarget: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </label>
                  <label className="field-label">
                    Cost per 1000 impressions ($)
                    <input
                      type="number"
                      step="0.01"
                      value={draft.metricsConfig.costPerImpression ?? 0}
                      onChange={(e) => update({
                        metricsConfig: {
                          ...draft.metricsConfig!,
                          costPerImpression: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </label>
                </div>
              )}
            </fieldset>

              </div>{/* end advanced-section-body */}
            </details>

            <fieldset className="editor-section">
              <legend>Custom CSS</legend>

              <div className="css-safe-mode-row">
                <label htmlFor="css-safe-mode-select">Safety mode</label>
                <select
                  id="css-safe-mode-select"
                  value={draft.styleConfig?.safeMode ?? "balanced"}
                  onChange={(e) => {
                    const nextMode = e.target.value as "strict" | "balanced" | "off";
                    updateStyleConfig({
                      safeMode: nextMode,
                      customCssScoped: compileScopedCss(draft.styleConfig?.customCssRaw ?? "", draft.id, nextMode),
                    });
                  }}
                >
                  <option value="strict">Strict (most restrictive)</option>
                  <option value="balanced">Balanced</option>
                  <option value="off">Off (advanced)</option>
                </select>
              </div>

              <div className="css-status-box">
                <div className="css-status-chip">
                  {(draft.styleConfig?.customCssRaw ?? "").trim() ? "Custom CSS active" : "No custom CSS"}
                </div>
                <div className="css-status-meta">Scope target: .gcw-campaign-{draft.id}</div>
                <div className="css-status-meta">Preview applies scoped CSS in real time.</div>
              </div>

              <div className="css-code-box">
                <div className="css-code-box-header">
                  <span>CSS</span>
                  <span className="css-code-box-scope">{`.gcw-campaign-${draft.id}`}</span>
                </div>
                <textarea
                  id="css-editor-area"
                  className="css-code-textarea"
                  rows={12}
                  value={draft.styleConfig?.customCssRaw ?? ""}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder={`.gcw-campaign {\n  border-radius: 12px;\n  box-shadow: 0 6px 18px rgba(17, 37, 63, 0.18);\n}\n\n.gcw-campaign .headline {\n  letter-spacing: 0.08em;\n}`}
                  spellCheck={false}
                />
                <div className="css-code-footer">
                  <button
                    className="css-snippet-btn"
                    onClick={() =>
                      setCustomCss(`${draft.styleConfig?.customCssRaw ?? ""}\n.gcw-campaign {\n  border-radius: 14px;\n}`.trim())
                    }
                  >
                    + Rounded corners
                  </button>
                  <button
                    className="css-snippet-btn"
                    onClick={() =>
                      setCustomCss(`${draft.styleConfig?.customCssRaw ?? ""}\n.gcw-campaign {\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}`.trim())
                    }
                  >
                    + Bold headline
                  </button>
                  <button
                    className="css-snippet-btn"
                    onClick={() =>
                      setCustomCss(`${draft.styleConfig?.customCssRaw ?? ""}\n.gcw-campaign {\n  animation: campaign-pulse 1.8s ease-in-out infinite;\n}\n@keyframes campaign-pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.65; }\n}`.trim())
                    }
                  >
                    + Pulse animation
                  </button>
                  <button
                    className="css-snippet-btn css-snippet-btn--clear"
                    onClick={() => setCustomCss("")}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </fieldset>
          </section>

          <aside className="flair-builder-side">
            <fieldset className="editor-section editor-section--compact">
              <legend>Status</legend>
              <label className="field-label">
                Current status
                <select value={draft.status} onChange={(e) => update({ status: e.target.value as Campaign["status"] })}>
                  <option value="live">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </fieldset>

            <fieldset className="editor-section editor-section--compact">
              <div className="rail-section-head">
                <legend>Link</legend>
                <button className="rail-action" onClick={() => setShowLinkEditor((v) => !v)}>
                  {showLinkEditor ? "Hide" : "+ Add"}
                </button>
              </div>
              {showLinkEditor ? (
                <label className="field-label">
                  Destination URL
                  <input
                    type="url"
                    value={draft.linkUrl ?? ""}
                    placeholder="https://your-store.com/collections/sale"
                    onChange={(e) => update({ linkUrl: e.target.value || null })}
                  />
                </label>
              ) : (
                <div className="rail-empty">No link added</div>
              )}
            </fieldset>

            <fieldset className="editor-section editor-section--compact">
              <div className="rail-section-head">
                <legend>Tags</legend>
                <button className="rail-action" onClick={() => setShowTagsEditor((v) => !v)}>
                  {showTagsEditor ? "Hide" : "+ Add"}
                </button>
              </div>
              {showTagsEditor ? (
                <label className="field-label">
                  Labels
                  <input
                    type="text"
                    value={tagsValue}
                    placeholder="sale, spring, bestseller"
                    onChange={(e) => update({ tags: toTagArray(e.target.value) })}
                  />
                </label>
              ) : (
                <div className="rail-empty">No tags added</div>
              )}
            </fieldset>

            <fieldset className="editor-section editor-section--compact">
              <legend>Schedule</legend>
              <label className="field-label">
                Starts at
                <input
                  type="datetime-local"
                  value={draft.schedule.startsAt?.slice(0, 16) ?? ""}
                  onChange={(e) => updateSchedule({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </label>
              <label className="field-label">
                Ends at
                <input
                  type="datetime-local"
                  value={draft.schedule.endsAt?.slice(0, 16) ?? ""}
                  onChange={(e) => updateSchedule({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </label>
            </fieldset>

            <fieldset className="editor-section editor-section--compact">
              <legend>Display</legend>
              <label className="field-label">
                Target scope
                <select
                  value={draft.targetScope ?? "product"}
                  onChange={(e) => update({ targetScope: e.target.value as Campaign["targetScope"] })}
                >
                  <option value="product">Product</option>
                  <option value="variant">Variant</option>
                  <option value="cart">Cart</option>
                </select>
              </label>
              <label className="field-label">
                Automation mode
                <select
                  value={draft.automationMode ?? "manual"}
                  onChange={(e) => update({ automationMode: e.target.value as Campaign["automationMode"] })}
                >
                  <option value="manual">Manual</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="always_on">Always on</option>
                </select>
              </label>
              <label className="field-label">
                Promotion group
                <input
                  type="text"
                  value={draft.promotionGroup ?? ""}
                  onChange={(e) => update({ promotionGroup: e.target.value || null })}
                  placeholder="e.g. Spring Launch 2026"
                />
              </label>
              <label className="field-label">
                Conflict mode
                <select value={draft.conflictMode} onChange={(e) => update({ conflictMode: e.target.value as Campaign["conflictMode"] })}>
                  <option value="replace">Replace</option>
                  <option value="stack">Stack</option>
                  <option value="suppress">Suppress</option>
                </select>
              </label>
              <label className="field-label">
                Priority
                <input type="number" min={0} value={draft.priority} onChange={(e) => update({ priority: Number(e.target.value) })} />
              </label>
            </fieldset>

            <div className="save-row">
              <button className="primary-btn" onClick={handleSave}>Save</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

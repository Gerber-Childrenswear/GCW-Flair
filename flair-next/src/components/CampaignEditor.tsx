import { useState } from "react";
import type { Campaign, CampaignType, RuleGroup, RuleCondition, CampaignPlacement } from "../types/campaign";
import CampaignPreview from "./CampaignPreview";
import RuleBuilder from "./RuleBuilder";
import PlacementPicker from "./PlacementPicker";
import TemplateLibrary, { type TemplateDef } from "./TemplateLibrary";
import { generateId } from "../data/mock-campaigns";

type Props = {
  campaign: Campaign | null;
  type: CampaignType;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
};

const presetColors = [
  { name: "Dark Navy",   bg: "#1a3a5c", text: "#ffffff", border: "#1a3a5c", preset: "solid-dark"    },
  { name: "Red Alert",   bg: "#dc2626", text: "#ffffff", border: "#dc2626", preset: "solid-red"     },
  { name: "Soft Green",  bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0", preset: "soft-green"    },
  { name: "Warm Cream",  bg: "#f5f0eb", text: "#4a3728", border: "#e0d5c8", preset: "soft-warm"     },
  { name: "Soft Pink",   bg: "#fce4ec", text: "#880e4f", border: "#f48fb1", preset: "soft-pink"     },
  { name: "Sky Blue",    bg: "#0ea5e9", text: "#ffffff", border: "#0284c7", preset: "solid-blue"    },
  { name: "Yellow",      bg: "#fef3c7", text: "#92400e", border: "#fcd34d", preset: "solid-yellow"  },
  { name: "Clean White", bg: "#ffffff", text: "#333333", border: "#e2e5ea", preset: "outline-light" },
  { name: "Soft Purple", bg: "#f0eef5", text: "#3a2d5c", border: "#d8d0e8", preset: "soft-purple"   },
  { name: "Soft Blue",   bg: "#eef4f9", text: "#1a3d5c", border: "#c8dae8", preset: "soft-blue"     },
];

const textSizeOptions = ["12px", "14px", "16px", "18px"] as const;
const fontWeightOptions = ["500", "600", "700"] as const;
const paddingOptions = ["tight", "normal", "spacious"] as const;
const letterSpacingOptions = ["normal", "wide", "wider"] as const;
const borderWidthOptions = ["none", "thin", "medium"] as const;
const shadowOptions = ["none", "small", "medium"] as const;
const cornerOptions = ["square", "rounded", "pill"] as const;

function createBlank(type: CampaignType): Campaign {
  const now = new Date().toISOString();
  const id  = generateId();
  const rootGroupId = `rg_root_${id}`;
  return {
    id,
    type,
    status: "draft",
    name: "",
    creative: {
      text: "",
      backgroundColor: "#1a3a5c",
      textColor: "#ffffff",
      borderColor: "#1a3a5c",
      stylePreset: "solid-dark",
      contentMode: "text",
      textSize: "14px",
      fontWeight: "700",
      paddingPreset: "normal",
      letterSpacingPreset: "normal",
      borderWidthPreset: "thin",
      shadowPreset: "none",
      cornerPreset: type === "banner" ? "square" : "rounded",
    },
    ruleGroups: [
      { id: rootGroupId, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    ],
    ruleConditions: [],
    placements: [],
    priority: 10,
    conflictMode: "replace",
    schedule: { startsAt: null, endsAt: null, timezone: "America/New_York", isActive: false },
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
    createdAt: now,
    updatedAt: now,
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
  const [draft, setDraft] = useState<Campaign>(campaign ?? createBlank(type));
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
                  className="field-textarea"
                  rows={4}
                  value={draft.creative.text}
                  onChange={(e) => updateCreative({ text: e.target.value })}
                />
              </label>

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
              <legend>Style</legend>
              <div className="color-presets">
                <span className="field-label">Style preset</span>
                <div className="preset-grid">
                  {presetColors.map((p) => (
                    <button
                      key={p.name}
                      className={`preset-swatch ${draft.creative.backgroundColor === p.bg ? "active" : ""}`}
                      style={{ backgroundColor: p.bg, color: p.text, borderColor: p.border }}
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
                    {textSizeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Text style
                  <select
                    value={draft.creative.fontWeight ?? "700"}
                    onChange={(e) => updateCreative({ fontWeight: e.target.value as Campaign["creative"]["fontWeight"] })}
                  >
                    {fontWeightOptions.map((v) => <option key={v} value={v}>{v === "700" ? "bold" : v}</option>)}
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
            </fieldset>

            <fieldset className="editor-section">
              <legend>Placements</legend>
              <PlacementPicker
                selected={draft.placements}
                onChange={(placements: CampaignPlacement[]) => update({ placements })}
              />
            </fieldset>

            <fieldset className="editor-section">
              <legend>Function Custom CSS</legend>
              <p className="css-note">
                CSS will be scoped to <strong>{`.flair-campaign-${draft.id}`}</strong> at render time.
              </p>

              <div className="schedule-grid">
                <label className="field-label">
                  CSS safety mode
                  <select
                    value={draft.styleConfig?.safeMode ?? "balanced"}
                    onChange={(e) => updateStyleConfig({ safeMode: e.target.value as "strict" | "balanced" | "off" })}
                  >
                    <option value="strict">Strict (most restrictive)</option>
                    <option value="balanced">Balanced</option>
                    <option value="off">Off (advanced)</option>
                  </select>
                </label>
              </div>

              <label className="field-label">
                Custom CSS
                <textarea
                  className="field-textarea css-textarea"
                  rows={10}
                  value={draft.styleConfig?.customCssRaw ?? ""}
                  onChange={(e) =>
                    updateStyleConfig({
                      customCssRaw: e.target.value,
                      customCssScoped: e.target.value,
                    })
                  }
                  placeholder={".flair-campaign {\n  border-radius: 12px;\n  box-shadow: 0 6px 18px rgba(17, 37, 63, 0.18);\n}\n\n.flair-campaign .headline {\n  letter-spacing: 0.08em;\n}"}
                />
              </label>

              <div className="css-snippet-row">
                <button
                  className="ghost-btn"
                  onClick={() =>
                    updateStyleConfig({
                      customCssRaw: `${draft.styleConfig?.customCssRaw ?? ""}\n.flair-campaign {\n  border-radius: 14px;\n}`.trim(),
                      customCssScoped: `${draft.styleConfig?.customCssRaw ?? ""}\n.flair-campaign {\n  border-radius: 14px;\n}`.trim(),
                    })
                  }
                >
                  + Rounded
                </button>
                <button
                  className="ghost-btn"
                  onClick={() =>
                    updateStyleConfig({
                      customCssRaw: `${draft.styleConfig?.customCssRaw ?? ""}\n.flair-campaign {\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}`.trim(),
                      customCssScoped: `${draft.styleConfig?.customCssRaw ?? ""}\n.flair-campaign {\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}`.trim(),
                    })
                  }
                >
                  + Bold headline
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => updateStyleConfig({ customCssRaw: "", customCssScoped: "" })}
                >
                  Clear CSS
                </button>
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

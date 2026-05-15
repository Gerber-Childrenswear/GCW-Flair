// Badge editor — the lean "edit a single Badge" surface.
//
// Per the Phase-2 redesign: a Badge instance carries CONTENT (text, link,
// tags, conditions) + a reference to a Global Style (visual treatment). All
// scheduling lives on the Campaigns page now, not here.
//
// Layout:
//   Left  : Type · Preview · Content · Conditions
//   Right : Status · Global Style · Link · Tags
//
// Conditions is the original Flair rule builder unchanged.

import { useMemo, useState } from "react";
import type { Campaign, CampaignStatus, RuleGroup, RuleCondition } from "../types/campaign";
import BadgeConditions from "./BadgeConditions";
import ImageUpload from "./ImageUpload";
import type { ImageContent } from "./ImageUpload";
import { SEED_STYLES } from "../data/style-palette";
import { BadgePreview } from "./StylePreviews";
import type { BadgeStyleConfig } from "../types/style";

type Props = {
  campaign: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
};

const STATUS_OPTIONS: { id: CampaignStatus; label: string; dot: string }[] = [
  { id: "live",      label: "Published", dot: "ok" },
  { id: "scheduled", label: "Scheduled", dot: "warn" },
  { id: "draft",     label: "Draft",     dot: "idle" },
  { id: "paused",    label: "Paused",    dot: "idle" },
  { id: "archived",  label: "Archived",  dot: "idle" },
];

type ContentType = "text" | "image";

// ─── New-badge skeleton — used when `campaign` is null ──────────────────────
function makeNewBadge(): Campaign {
  const id = `camp_new_${Date.now()}`;
  return {
    id,
    type: "badge",
    status: "draft",
    name: "New badge",
    styleId: "sty_default_navy",
    creative: {
      text: "BADGE TEXT",
      backgroundColor: "#002744",
      textColor: "#FFFFFF",
      borderColor: "#002744",
      stylePreset: "solid-dark",
    },
    ruleGroups: [{ id: `rg_root_${id}`, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 }],
    ruleConditions: [],
    placements: [],
    priority: 1,
    conflictMode: "stack",
    schedule: { startsAt: null, endsAt: null, timezone: "America/New_York", isActive: false },
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function BadgeEditor({ campaign, onSave, onCancel }: Props) {
  const [working, setWorking] = useState<Campaign>(() => campaign ?? makeNewBadge());
  const [contentType, setContentType] = useState<ContentType>(
    working.creative.contentMode === "image" ? "image" : "text",
  );
  const [linkExpanded, setLinkExpanded] = useState<boolean>(!!working.linkUrl);
  const [tagsExpanded, setTagsExpanded] = useState<boolean>((working.tags ?? []).length > 0);
  const [newTag, setNewTag] = useState("");

  // Only Styles configured for the badge surface are pickable.
  const badgeStyleOptions = useMemo(
    () => SEED_STYLES.filter((s) => s.badge !== null),
    [],
  );
  const selectedStyle = badgeStyleOptions.find((s) => s.id === working.styleId) ?? null;
  const badgeConfig: BadgeStyleConfig | null = selectedStyle?.badge ?? null;

  const update = (patch: Partial<Campaign>) => setWorking((w) => ({ ...w, ...patch }));
  const updateCreative = (patch: Partial<Campaign["creative"]>) =>
    setWorking((w) => ({ ...w, creative: { ...w.creative, ...patch } }));

  // Badges are single-line. Keep preview and the input in lockstep by always
  // pulling from the first line of creative.text. Seeded campaigns may carry
  // multi-line legacy text; we preview/edit only the first line until saved.
  const badgeText = (working.creative.text || "").split("\n")[0];

  const dirty = JSON.stringify(working) !== JSON.stringify(campaign);

  const handleSave = () => {
    onSave({ ...working, updatedAt: new Date().toISOString() });
  };

  const handleAddTag = () => {
    const v = newTag.trim();
    if (!v) return;
    const existing = working.tags ?? [];
    if (existing.includes(v)) {
      setNewTag("");
      return;
    }
    update({ tags: [...existing, v] });
    setNewTag("");
  };

  const handleRemoveTag = (t: string) => {
    update({ tags: (working.tags ?? []).filter((x) => x !== t) });
  };

  const handleConditionsChange = (groups: RuleGroup[], conditions: RuleCondition[]) => {
    update({ ruleGroups: groups, ruleConditions: conditions });
  };

  return (
    <div className="be-page">
      <div className="be-head">
        <button type="button" className="be-back" onClick={onCancel}>
          ← Edit Badge
        </button>
        <div className="be-head-actions">
          <button type="button" className="sc-btn sc-btn--ghost" onClick={onCancel}>
            Discard
          </button>
          <button
            type="button"
            className="sc-btn sc-btn--primary"
            disabled={!dirty}
            onClick={handleSave}
          >
            Save badge
          </button>
        </div>
      </div>

      <div className="be-editor-grid">
        {/* ─── Left column ────────────────────────────────────────────── */}
        <div className="be-editor-col">
          {/* Type */}
          <section className="be-card">
            <div className="be-card-title">Type</div>
            <div className="be-radio-row">
              <label className={"be-radio " + (contentType === "text" ? "is-active" : "")}>
                <input
                  type="radio"
                  name="content-type"
                  checked={contentType === "text"}
                  onChange={() => {
                    setContentType("text");
                    updateCreative({ contentMode: "text" });
                  }}
                />
                <span>Text</span>
              </label>
              <label className={"be-radio " + (contentType === "image" ? "is-active" : "")} title="Image badges land in a follow-up slice">
                <input
                  type="radio"
                  name="content-type"
                  checked={contentType === "image"}
                  onChange={() => {
                    setContentType("image");
                    updateCreative({ contentMode: "image" });
                  }}
                />
                <span>Image</span>
              </label>
            </div>
          </section>

          {/* Preview */}
          <section className="be-card">
            <div className="be-card-title">Preview</div>
            <div className="be-preview-shell">
              {!badgeConfig ? (
                <div className="be-preview-empty">
                  Pick a Global Style to see the preview.
                </div>
              ) : contentType === "image" && !working.creative.imageUrl ? (
                /* Image mode but nothing uploaded yet — show a placeholder
                   so the preview reflects the active type instead of
                   falling back to the text label (which made Image mode
                   look indistinguishable from Text mode). */
                <div className="be-preview-image-placeholder">
                  <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden>
                    <path
                      d="M19 5v9.59l-2.29-2.3a1 1 0 0 0-1.42 0L11 16.59l-2.29-2.3a1 1 0 0 0-1.42 0L5 16.59V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                      fill="currentColor"
                    />
                    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
                  </svg>
                  <div>Upload an image to preview</div>
                </div>
              ) : (
                <BadgePreview
                  config={badgeConfig}
                  label={(badgeText || "BADGE").toUpperCase().slice(0, 28)}
                  image={
                    contentType === "image" && working.creative.imageUrl
                      ? {
                          url: working.creative.imageUrl,
                          alt: working.creative.altText ?? "",
                          width: working.creative.imageWidth ?? null,
                          height: working.creative.imageHeight ?? null,
                        }
                      : null
                  }
                />
              )}
            </div>
          </section>

          {/* Content — text input for Text type, image upload for Image type */}
          <section className="be-card">
            <div className="be-card-title">
              Content{" "}
              <span
                className="be-info-dot"
                title={
                  contentType === "image"
                    ? "The image rendered inside the badge."
                    : "The text rendered inside the badge."
                }
              >
                i
              </span>
            </div>
            {contentType === "image" ? (
              <ImageUpload
                value={{
                  imageUrl: working.creative.imageUrl ?? null,
                  imageFileName: working.creative.imageFileName ?? null,
                  imageWidth: working.creative.imageWidth ?? null,
                  imageHeight: working.creative.imageHeight ?? null,
                  imageSourceUrl: working.creative.imageSourceUrl ?? null,
                  altText: working.creative.altText ?? "",
                }}
                onChange={(patch: Partial<ImageContent>) => updateCreative(patch)}
              />
            ) : (
              <input
                type="text"
                className="be-input"
                value={badgeText}
                onChange={(e) => updateCreative({ text: e.target.value })}
                placeholder="FREE EMBROIDERY"
              />
            )}
          </section>

          {/* Conditions — lean Flair-style picker. Value chips are mocked
              today; Nick wires real type-ahead data in BadgeConditions. */}
          <section className="be-card">
            <div className="be-card-title">Conditions</div>
            <BadgeConditions
              groups={working.ruleGroups}
              conditions={working.ruleConditions}
              onChange={handleConditionsChange}
            />
          </section>
        </div>

        {/* ─── Right column ───────────────────────────────────────────── */}
        <div className="be-editor-col">
          {/* Status */}
          <section className="be-card">
            <div className="be-card-title">Status</div>
            <div className="be-status-pill">
              <span className={`dot ${STATUS_OPTIONS.find((s) => s.id === working.status)?.dot ?? "idle"}`} />
              <select
                className="be-select"
                value={working.status}
                onChange={(e) => update({ status: e.target.value as CampaignStatus })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Global Style */}
          <section className="be-card">
            <div className="be-card-title">Global Style</div>
            <select
              className="be-select be-select--full"
              value={working.styleId ?? ""}
              onChange={(e) => update({ styleId: e.target.value || null })}
            >
              <option value="" disabled>
                Select a style…
              </option>
              {badgeStyleOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " · Default" : ""}
                </option>
              ))}
            </select>
            {/* Always render the deck so the card height doesn't change when
                a different Style is picked. CSS reserves two lines of space
                and clamps longer descriptions with an ellipsis. */}
            <div className="be-style-deck">
              {selectedStyle?.description ?? ""}
            </div>
          </section>

          {/* Link */}
          <section className="be-card">
            <div className="be-card-title-row">
              <span className="be-card-title">Link</span>
              {!linkExpanded ? (
                <button type="button" className="be-add-btn" onClick={() => setLinkExpanded(true)}>
                  + Add
                </button>
              ) : (
                <button
                  type="button"
                  className="be-add-btn be-add-btn--remove"
                  onClick={() => {
                    setLinkExpanded(false);
                    update({ linkUrl: null });
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            {linkExpanded && (
              <input
                type="url"
                className="be-input"
                value={working.linkUrl ?? ""}
                onChange={(e) => update({ linkUrl: e.target.value })}
                placeholder="https://gerberchildrenswear.com/..."
              />
            )}
          </section>

          {/* Tags */}
          <section className="be-card">
            <div className="be-card-title-row">
              <span className="be-card-title">
                Tags <span className="be-info-dot" title="Internal labels for filtering and grouping.">i</span>
              </span>
              {!tagsExpanded && (
                <button type="button" className="be-add-btn" onClick={() => setTagsExpanded(true)}>
                  + Add
                </button>
              )}
            </div>
            {tagsExpanded && (
              <div className="be-tags">
                <div className="be-tag-chips">
                  {(working.tags ?? []).map((t) => (
                    <span key={t} className="be-tag-chip">
                      {t}
                      <button
                        type="button"
                        className="be-tag-remove"
                        onClick={() => handleRemoveTag(t)}
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="be-tag-input-row">
                  <input
                    type="text"
                    className="be-input"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag…"
                  />
                  <button type="button" className="be-add-btn" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

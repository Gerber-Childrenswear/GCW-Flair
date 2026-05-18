// Banner editor — the per-banner edit surface.
//
// Layout:
//   Left  : Preview · Elements (drag-to-reorder) · Conditions
//   Right : Library state · Global Style · Link · Tags · Used in Campaigns · Delete
//
// Four elements ship with every banner — Headline, Copy, Details, Countdown.
// All four sit in the Elements list at once; leaving a text field blank hides
// that element from the rendered banner. Multiples are not supported — the
// element list is closed to keep the surface predictable.
//
// Drag handles let the merchant reorder elements (so countdown can sit at
// the top if that's what the promo calls for). Per-banner content lives in
// Creative.bannerHeadline / bannerCopy / bannerDetails / bannerCountdownLabel
// and Creative.bannerElementOrder; the Style cascade drives visual styling.
//
// Countdown timing: the actual start / end times for the live ticker are
// set on the parent Campaign. The Banner editor previews a sample "48h
// from now" timer so the merchant can review the styling. A disclaimer in
// the Countdown row makes the boundary explicit.

import { useMemo, useState } from "react";
import type {
  Campaign,
  RuleGroup,
  RuleCondition,
  BannerElement,
} from "../types/campaign";
import { DEFAULT_BANNER_ELEMENT_ORDER } from "../types/campaign";
import BadgeConditions from "./BadgeConditions";
import { SEED_STYLES } from "../data/style-palette";
import { BannerPreview } from "./StylePreviews";
import type { BannerStyleConfig } from "../types/style";

type Props = {
  campaign: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
  onDelete?: (campaignId: string) => void;
};

type LibraryState = "active" | "archived";

// ─── Mocked "used in Campaigns" list ────────────────────────────────────────
// Same shape as BadgeEditor's mock — see that file for the FOR NICK note on
// why this list is synthesised today.
const MOCK_CAMPAIGN_POOL = [
  "Spring Sale — Boys",
  "Summer Drop announcement",
  "Final Hours Q4",
  "Free Shipping over $40",
  "Sitewide Sale — May",
  "Mother's Day promo",
  "Back to School banner",
];

function getMockUsedInCampaigns(id: string): string[] {
  const seed = Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const count = (seed % 3) + 1;
  const start = seed % MOCK_CAMPAIGN_POOL.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(MOCK_CAMPAIGN_POOL[(start + i) % MOCK_CAMPAIGN_POOL.length]);
  }
  return out;
}

// ─── New-banner skeleton ────────────────────────────────────────────────────
function makeNewBanner(): Campaign {
  const id = `camp_new_${Date.now()}`;
  return {
    id,
    type: "banner",
    status: "live",
    name: "New banner",
    styleId: "sty_default_navy",
    creative: {
      text: "",
      backgroundColor: "#002744",
      textColor: "#FFFFFF",
      borderColor: "#002744",
      stylePreset: "solid-dark",
      bannerHeadline: "SUMMER SALE",
      bannerCopy: "20% off everything",
      bannerDetails: "Terms apply. Some restrictions.",
      bannerCountdownLabel: "Sale ends in",
      bannerCountdownEnabled: true,
      bannerElementOrder: DEFAULT_BANNER_ELEMENT_ORDER,
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

// ─── Element metadata ───────────────────────────────────────────────────────
const ELEMENT_META: Record<BannerElement, { label: string; placeholder: string }> = {
  headline:  { label: "Headline",  placeholder: "e.g. SUMMER SALE!" },
  copy:      { label: "Copy",      placeholder: "e.g. 20% off everything." },
  details:   { label: "Details",   placeholder: "e.g. Terms apply. While supplies last." },
  countdown: { label: "Countdown", placeholder: "e.g. Sale ends in" },
};

export default function BannerEditor({ campaign, onSave, onCancel, onDelete }: Props) {
  const [working, setWorking] = useState<Campaign>(() => campaign ?? makeNewBanner());
  const [linkExpanded, setLinkExpanded] = useState<boolean>(!!working.linkUrl);
  const [tagsExpanded, setTagsExpanded] = useState<boolean>((working.tags ?? []).length > 0);
  const [newTag, setNewTag] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Drag-drop reorder state — tracks the element currently being dragged.
  const [draggingKey, setDraggingKey] = useState<BannerElement | null>(null);
  const [dragOverKey, setDragOverKey] = useState<BannerElement | null>(null);

  // Preview countdown: 48h from when the editor first opened. Stable for
  // the lifetime of this editor instance so the preview ticks down
  // smoothly while the merchant works.
  const previewEndsAt = useMemo(() => new Date(Date.now() + 48 * 60 * 60 * 1000), []);

  // Library state — same Active / Archived collapse as BadgeEditor.
  // Countdown on/off toggle. Defaults to false for legacy banners that
  // never had this flag set; new banners seed `true` in makeNewBanner.
  const countdownEnabled = working.creative.bannerCountdownEnabled ?? false;

  const libraryState: LibraryState = working.status === "archived" ? "archived" : "active";
  const setLibraryState = (next: LibraryState) => {
    update({ status: next === "archived" ? "archived" : "live" });
  };

  const usedInCampaigns = useMemo(() => getMockUsedInCampaigns(working.id), [working.id]);

  // Only Styles configured for the banner surface are pickable.
  const bannerStyleOptions = useMemo(
    () => SEED_STYLES.filter((s) => s.banner !== null),
    [],
  );
  const selectedStyle = bannerStyleOptions.find((s) => s.id === working.styleId) ?? null;
  const bannerConfig: BannerStyleConfig | null = selectedStyle?.banner ?? null;

  const update = (patch: Partial<Campaign>) => setWorking((w) => ({ ...w, ...patch }));
  const updateCreative = (patch: Partial<Campaign["creative"]>) =>
    setWorking((w) => ({ ...w, creative: { ...w.creative, ...patch } }));

  // Element order — always a full permutation of the 4 keys. If the loaded
  // campaign has a partial / missing order, normalise to the default.
  const elementOrder: BannerElement[] = useMemo(() => {
    const stored = working.creative.bannerElementOrder ?? [];
    const seen = new Set<BannerElement>();
    const out: BannerElement[] = [];
    for (const key of stored) {
      if (DEFAULT_BANNER_ELEMENT_ORDER.includes(key) && !seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
    for (const key of DEFAULT_BANNER_ELEMENT_ORDER) {
      if (!seen.has(key)) out.push(key);
    }
    return out;
  }, [working.creative.bannerElementOrder]);

  const reorderElements = (from: BannerElement, to: BannerElement) => {
    if (from === to) return;
    const next = [...elementOrder];
    const fromIdx = next.indexOf(from);
    const toIdx = next.indexOf(to);
    if (fromIdx < 0 || toIdx < 0) return;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    updateCreative({ bannerElementOrder: next });
  };

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

  // ─── Per-element value getters / setters ───────────────────────────────
  const getElementValue = (key: BannerElement): string => {
    switch (key) {
      case "headline":  return working.creative.bannerHeadline ?? "";
      case "copy":      return working.creative.bannerCopy ?? "";
      case "details":   return working.creative.bannerDetails ?? "";
      case "countdown": return working.creative.bannerCountdownLabel ?? "";
    }
  };

  const setElementValue = (key: BannerElement, value: string) => {
    switch (key) {
      case "headline":  updateCreative({ bannerHeadline: value }); break;
      case "copy":      updateCreative({ bannerCopy: value }); break;
      case "details":   updateCreative({ bannerDetails: value }); break;
      case "countdown": updateCreative({ bannerCountdownLabel: value }); break;
    }
  };

  return (
    <div className="be-page">
      <div className="be-head">
        <button type="button" className="be-back" onClick={onCancel}>
          ← Edit Banner
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
            Save banner
          </button>
        </div>
      </div>

      <div className="be-editor-grid">
        {/* ─── Left column ────────────────────────────────────────────── */}
        <div className="be-editor-col">
          {/* Preview */}
          <section className="be-card">
            <div className="be-card-title">Preview</div>
            <div className="be-preview-shell be-preview-shell--banner">
              {bannerConfig ? (
                <BannerPreview
                  config={bannerConfig}
                  elementOrder={elementOrder}
                  headlineText={working.creative.bannerHeadline ?? ""}
                  copyText={working.creative.bannerCopy ?? ""}
                  detailsText={working.creative.bannerDetails ?? ""}
                  countdownLabel={working.creative.bannerCountdownLabel ?? ""}
                  countdownEndsAt={previewEndsAt}
                  countdownEnabled={countdownEnabled}
                />
              ) : (
                <div className="be-preview-empty">
                  Pick a Global Style to see the preview.
                </div>
              )}
            </div>
          </section>

          {/* Elements — drag-to-reorder. Blank text fields hide that
              element from the storefront render. */}
          <section className="be-card">
            <div className="be-card-title">
              Elements{" "}
              <span
                className="be-info-dot"
                title="Drag any row to reorder. Leave a field blank to hide that element."
              >
                i
              </span>
            </div>
            <ul className="be-elements-list">
              {elementOrder.map((key) => {
                const meta = ELEMENT_META[key];
                const value = getElementValue(key);
                const isDragging = draggingKey === key;
                const isDragOver = dragOverKey === key && draggingKey !== key;
                return (
                  <li
                    key={key}
                    className={
                      "be-element-row" +
                      (isDragging ? " is-dragging" : "") +
                      (isDragOver ? " is-drag-over" : "")
                    }
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", key);
                      setDraggingKey(key);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverKey !== key) setDragOverKey(key);
                    }}
                    onDragLeave={() => {
                      if (dragOverKey === key) setDragOverKey(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = e.dataTransfer.getData("text/plain") as BannerElement;
                      if (from && from !== key) reorderElements(from, key);
                      setDraggingKey(null);
                      setDragOverKey(null);
                    }}
                    onDragEnd={() => {
                      setDraggingKey(null);
                      setDragOverKey(null);
                    }}
                  >
                    <button
                      type="button"
                      className="be-drag-handle"
                      title="Drag to reorder"
                      aria-label={`Drag ${meta.label} to reorder`}
                      tabIndex={-1}
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
                        <circle cx="5" cy="4" r="1.4" fill="currentColor" />
                        <circle cx="11" cy="4" r="1.4" fill="currentColor" />
                        <circle cx="5" cy="8" r="1.4" fill="currentColor" />
                        <circle cx="11" cy="8" r="1.4" fill="currentColor" />
                        <circle cx="5" cy="12" r="1.4" fill="currentColor" />
                        <circle cx="11" cy="12" r="1.4" fill="currentColor" />
                      </svg>
                    </button>
                    <div className="be-element-body">
                      <div className="be-element-header">
                        <label className="be-element-label">{meta.label}</label>
                        {key === "countdown" && (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={countdownEnabled}
                            aria-label="Show countdown on this banner"
                            className={"be-switch " + (countdownEnabled ? "is-on" : "")}
                            onClick={() =>
                              updateCreative({ bannerCountdownEnabled: !countdownEnabled })
                            }
                          >
                            <span className="be-switch-track" aria-hidden>
                              <span className="be-switch-thumb" />
                            </span>
                            <span className="be-switch-state">
                              {countdownEnabled ? "On" : "Off"}
                            </span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="be-input"
                        value={value}
                        onChange={(e) => setElementValue(key, e.target.value)}
                        placeholder={meta.placeholder}
                        disabled={key === "countdown" && !countdownEnabled}
                      />
                      {key === "countdown" && (
                        <div className="be-element-note">
                          Campaigns set the actual start and end times. The preview here
                          uses a sample 48-hour countdown.
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Conditions — same picker as the Badge editor. */}
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
          {/* Library state */}
          <section className="be-card">
            <div className="be-card-title">Library state</div>
            <div className="be-segmented" role="radiogroup" aria-label="Library state">
              <button
                type="button"
                role="radio"
                aria-checked={libraryState === "active"}
                className={"be-segmented-btn " + (libraryState === "active" ? "is-active" : "")}
                onClick={() => setLibraryState("active")}
              >
                <span className="dot ok" aria-hidden />
                Active
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={libraryState === "archived"}
                className={"be-segmented-btn " + (libraryState === "archived" ? "is-active" : "")}
                onClick={() => setLibraryState("archived")}
              >
                <span className="dot idle" aria-hidden />
                Archived
              </button>
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
              {bannerStyleOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " · Default" : ""}
                </option>
              ))}
            </select>
            <div className="be-style-deck">{selectedStyle?.description ?? ""}</div>
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
                Tags{" "}
                <span className="be-info-dot" title="Internal labels for filtering and grouping.">
                  i
                </span>
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

          {/* Used in Campaigns */}
          <section className="be-card">
            <div className="be-card-title">Used in Campaigns</div>
            {usedInCampaigns.length === 0 ? (
              <div className="be-used-in-empty">
                No Campaigns reference this banner yet.
              </div>
            ) : (
              <ul className="be-used-in-list">
                {usedInCampaigns.map((name) => (
                  <li key={name} className="be-used-in-item">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Delete */}
          {onDelete && (
            <section className="be-card be-danger-zone">
              <button
                type="button"
                className="be-danger-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete this banner…
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && onDelete && (
        <div
          className="be-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="be-banner-delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
        >
          <div className="be-modal">
            <h2 id="be-banner-delete-title" className="be-modal-title">
              Delete this banner?
            </h2>
            <p className="be-modal-body">
              {usedInCampaigns.length === 0
                ? "This banner isn't referenced by any Campaigns. Deleting it can't be undone."
                : `This banner is used in ${usedInCampaigns.length} Campaign${
                    usedInCampaigns.length === 1 ? "" : "s"
                  }. It will be removed from each of them. This can't be undone.`}
            </p>
            {usedInCampaigns.length > 0 && (
              <ul className="be-modal-list">
                {usedInCampaigns.map((name) => (
                  <li key={name} className="be-modal-list-item">
                    {name}
                  </li>
                ))}
              </ul>
            )}
            <div className="be-modal-actions">
              <button
                type="button"
                className="sc-btn sc-btn--ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sc-btn sc-btn--danger"
                onClick={() => {
                  setShowDeleteModal(false);
                  onDelete(working.id);
                }}
              >
                Yes, delete banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global Styles — the canonical Style management surface.
//
// Lists every Style in the library with live Badge + Banner previews,
// each row's per-Style usage count, and edit / delete actions. The Edit
// action mounts StyleEditor — a two-pane Badge/Banner picker that builds
// the whole Style from curated brand tokens (no raw px/hex anywhere).
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision
// #2 — two surface configurations per Style; Countdown is a Banner
// sub-element, not a peer surface).

import { useState } from "react";
import { SEED_STYLES, SEED_STYLE_AUDIT_LOG } from "../data/style-palette";
import { BadgePreview, BannerPreview } from "./StylePreviews";
import StyleEditor from "./StyleEditor";
import type { Style } from "../types/style";

// Mock usage counts — replaced by real counts once Badges/Banners
// reference Styles by ID.
const MOCK_STYLE_USAGE: Record<string, { campaigns: number; instances: number }> = {
  sty_default_navy:    { campaigns: 4, instances: 28 },
  sty_summer_sale:     { campaigns: 3, instances: 17 },
  sty_final_hours:     { campaigns: 2, instances: 9 },
  sty_trust_pill:      { campaigns: 1, instances: 6 },
  sty_soft_newsletter: { campaigns: 1, instances: 2 },
};

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════

export default function GlobalStyles() {
  const [styles, setStyles] = useState<Style[]>(SEED_STYLES);
  const [auditLog] = useState(SEED_STYLE_AUDIT_LOG);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Radio-button semantics: exactly one Style carries isDefault at a time.
  // New badges and banners inherit the default when no Style is picked.
  function handleSetDefault(styleId: string) {
    setStyles((prev) =>
      prev.map((s) => ({
        ...s,
        isDefault: s.id === styleId,
        updatedAt: s.id === styleId || s.isDefault ? new Date().toISOString() : s.updatedAt,
      })),
    );
  }

  function handleSaveStyle(updated: Style) {
    setStyles((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingId(null);
  }

  // ─── Editor mode ────────────────────────────────────────────────────────
  if (editingId) {
    const styleBeingEdited = styles.find((s) => s.id === editingId);
    if (styleBeingEdited) {
      return (
        <div className="row g-4">
          <div className="col-12">
            <StyleEditor
              style={styleBeingEdited}
              onSave={handleSaveStyle}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </div>
      );
    }
  }

  // ─── List mode ──────────────────────────────────────────────────────────
  const visibleStyles = search.trim()
    ? styles.filter((s) => {
        const q = search.trim().toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
      })
    : styles;

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="gs-page-head">
          <div>
            <div className="gs-eyebrow">Global Styles</div>
            <h1 className="gs-title">Styles</h1>
            <p className="gs-deck">
              The visual library. Define a Style once — its Badge and Banner configurations together — and
              every Badge or Banner that references it inherits the look. Edit the Style and every
              instance using it updates. Colors are picked by name from{" "}
              <strong>Settings → Colors</strong>; no hex inputs at this layer.
            </p>
          </div>
          <div className="gs-page-actions">
            <button type="button" className="sc-btn sc-btn--ghost" disabled title="Coming next slice">
              Export JSON
            </button>
            <button type="button" className="sc-btn sc-btn--ghost" disabled title="Coming next slice">
              Import JSON
            </button>
            <button type="button" className="sc-btn sc-btn--primary" disabled title="Coming next slice">
              + Add Style
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        {/* Toolbar */}
        <div className="gs-toolbar">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Styles by name or description…"
            className="gs-search"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="sc-btn sc-btn--ghost">
              Clear
            </button>
          )}
          <div className="gs-count">
            Showing <strong>{visibleStyles.length}</strong>
            {visibleStyles.length !== styles.length && (
              <span style={{ color: "var(--text-muted)" }}> of {styles.length}</span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="gs-table">
          <div className="gs-table-head">
            <div>Name</div>
            <div>As Badge</div>
            <div>As Banner</div>
            <div>Used by</div>
            <div className="gs-table-head-right">Actions</div>
          </div>
          {visibleStyles.map((style) => {
            const usage = MOCK_STYLE_USAGE[style.id] ?? { campaigns: 0, instances: 0 };
            return (
              <div key={style.id} className="gs-table-row">
                <div>
                  <div className="gs-table-name">{style.name}</div>
                  {style.isDefault ? (
                    <span
                      className="gs-default-pill"
                      title="Default Style — new badges and banners inherit this when no Style is picked"
                    >
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="gs-set-default-link"
                      onClick={() => handleSetDefault(style.id)}
                      title="Make this the default Style for new badges and banners"
                    >
                      Set as default
                    </button>
                  )}
                </div>
                <div className="gs-preview-cell">
                  {style.badge ? (
                    <BadgePreview
                      config={style.badge}
                      label={style.name.toUpperCase().slice(0, 14)}
                      scale={0.7}
                    />
                  ) : (
                    <span className="gs-preview-none">Not configured</span>
                  )}
                </div>
                <div className="gs-preview-cell">
                  {style.banner ? (
                    <BannerPreview
                      config={style.banner}
                      headlineText={style.name.toUpperCase()}
                      copyText="Supporting copy line goes here"
                      detailsText="Terms apply"
                      scale={0.55}
                    />
                  ) : (
                    <span className="gs-preview-none">Not configured</span>
                  )}
                </div>
                <div className="gs-table-used">
                  {usage.campaigns > 0 ? (
                    <>
                      <strong>{usage.campaigns}</strong> campaign{usage.campaigns === 1 ? "" : "s"}
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{usage.instances} live instances</div>
                    </>
                  ) : (
                    <span className="gs-table-used-empty">Not in use</span>
                  )}
                </div>
                <div className="gs-table-actions">
                  <button
                    type="button"
                    className="gs-row-action"
                    onClick={() => setEditingId(style.id)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit log */}
        <div className="panel gs-audit">
          <div className="gs-audit-title">Recent changes · audit log</div>
          <ul className="gs-audit-list">
            {auditLog.slice(0, 8).map((entry) => (
              <li key={entry.id} className="gs-audit-row">
                <span className="gs-audit-ts">{new Date(entry.timestamp).toLocaleString()}</span>
                <span className="gs-audit-action">{entry.action}</span>
                <span>
                  <strong>{entry.targetId}</strong>
                  {entry.diff?.after && (
                    <>
                      <span style={{ color: "var(--text-secondary)" }}> — </span>
                      <span>{String((entry.diff.after as { name?: string }).name ?? "")}</span>
                    </>
                  )}
                </span>
                <span className="gs-audit-actor">{entry.actor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

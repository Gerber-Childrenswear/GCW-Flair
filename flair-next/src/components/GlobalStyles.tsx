// Global Styles — the canonical Style management surface.
//
// Lists every Style in the library with live Badge + Banner previews,
// each row's per-Style usage count, and edit / delete actions. Style
// editor opens in a follow-up slice.
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision
// #2 — two surface configurations per Style; Countdown is a Banner
// sub-element, not a peer surface).

import { useState } from "react";
import { SEED_STYLES, SEED_STYLE_AUDIT_LOG } from "../data/style-palette";
import { SEED_COLORS } from "../data/color-palette";
import type { Style, BadgeStyleConfig, BannerStyleConfig } from "../types/style";
import type { ColorId } from "../types/color";

// Mock usage counts — replaced by real counts once Badges/Banners
// reference Styles by ID.
const MOCK_STYLE_USAGE: Record<string, { campaigns: number; instances: number }> = {
  sty_default_navy:    { campaigns: 4, instances: 28 },
  sty_summer_sale:     { campaigns: 3, instances: 17 },
  sty_final_hours:     { campaigns: 2, instances: 9 },
  sty_trust_pill:      { campaigns: 1, instances: 6 },
  sty_soft_newsletter: { campaigns: 1, instances: 2 },
};

// Quick lookup from ColorId → hex for previews.
function buildColorMap(): Record<ColorId, string> {
  return Object.fromEntries(SEED_COLORS.map((c) => [c.id, c.hex]));
}

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════

export default function GlobalStyles() {
  const [styles] = useState<Style[]>(SEED_STYLES);
  const [auditLog] = useState(SEED_STYLE_AUDIT_LOG);
  const [search, setSearch] = useState("");

  const colorMap = buildColorMap();

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
                  {style.description && <div className="gs-table-desc">{style.description}</div>}
                </div>
                <div className="gs-preview-cell">
                  {style.badge ? (
                    <BadgePreview config={style.badge} colorMap={colorMap} label={style.name.toUpperCase()} />
                  ) : (
                    <span className="gs-preview-none">Not configured</span>
                  )}
                </div>
                <div className="gs-preview-cell">
                  {style.banner ? (
                    <BannerPreview config={style.banner} colorMap={colorMap} label={style.name.toUpperCase()} />
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
                  <button type="button" className="gs-row-action" disabled title="Editor coming next slice">
                    Edit
                  </button>
                  <button type="button" className="gs-row-action gs-row-action--danger" disabled title="Delete coming next slice">
                    Delete
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

// ═══════════════════════════════════════════════════════════════════════════
// Surface previews — render a Style's Badge / Banner configuration
// ═══════════════════════════════════════════════════════════════════════════

const BORDER_RADIUS_FOR_SHAPE: Record<string, string> = {
  square: "0",
  rounded: "4px",
  pill: "999px",
  tag: "0",
};

const SHADOW_FOR_LEVEL: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,39,68,0.08)",
  md: "0 2px 6px rgba(0,39,68,0.12)",
};

function BadgePreview({
  config,
  colorMap,
  label,
}: {
  config: BadgeStyleConfig;
  colorMap: Record<ColorId, string>;
  label: string;
}) {
  const bg = colorMap[config.bgColor] ?? "#ccc";
  const fg = colorMap[config.textColor] ?? "#000";
  const border = config.borderColor ? colorMap[config.borderColor] : "transparent";

  // Mixed left/right corner radii are produced by combining the two
  // shape values — the four corner radius properties.
  const left = BORDER_RADIUS_FOR_SHAPE[config.leftShape] ?? "4px";
  const right = BORDER_RADIUS_FOR_SHAPE[config.rightShape] ?? "4px";

  return (
    <span
      className="gs-badge-preview"
      style={{
        background: bg,
        color: fg,
        border: config.borderSize > 0 ? `${config.borderSize}px solid ${border}` : "none",
        borderTopLeftRadius: left,
        borderBottomLeftRadius: left,
        borderTopRightRadius: right,
        borderBottomRightRadius: right,
        padding: `${Math.max(2, config.paddingY - 2)}px ${Math.max(6, config.paddingX - 2)}px`,
        fontSize: Math.min(11, config.textSize),
        letterSpacing: `${config.letterSpacing}em`,
        boxShadow: SHADOW_FOR_LEVEL[config.shadow] ?? "none",
        fontWeight: config.textStyle === "regular" ? 400 : config.textStyle === "medium" ? 500 : 700,
        textTransform: config.textStyle === "bold-caps" ? "uppercase" : "none",
      }}
    >
      {label.slice(0, 14)}
    </span>
  );
}

function BannerPreview({
  config,
  colorMap,
  label,
}: {
  config: BannerStyleConfig;
  colorMap: Record<ColorId, string>;
  label: string;
}) {
  const bg = colorMap[config.bgColor] ?? "#ccc";
  const border = config.borderColor ? colorMap[config.borderColor] : "transparent";

  const headlineColor = colorMap[config.headline.color] ?? "#000";
  const copyColor = colorMap[config.copy.color] ?? "#000";

  return (
    <div
      className="gs-banner-preview"
      style={{
        background: bg,
        border: config.borderSize > 0 ? `${config.borderSize}px solid ${border}` : "none",
        boxShadow: SHADOW_FOR_LEVEL[config.shadow] ?? "none",
      }}
    >
      <div
        className="gs-banner-preview-headline"
        style={{
          color: headlineColor,
          fontWeight: config.headline.weight,
          fontStyle: config.headline.italic ? "italic" : "normal",
          textTransform: config.headline.uppercase ? "uppercase" : "none",
          letterSpacing: `${config.headline.letterSpacing}em`,
        }}
      >
        {label}
      </div>
      <div
        className="gs-banner-preview-copy"
        style={{
          color: copyColor,
          fontWeight: config.copy.weight,
          fontStyle: config.copy.italic ? "italic" : "normal",
        }}
      >
        Supporting copy line goes here
      </div>
    </div>
  );
}

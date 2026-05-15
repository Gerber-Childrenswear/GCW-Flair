import { useState } from "react";
import SettingsColors from "./SettingsColors";
import SettingsBrandToken from "./SettingsBrandToken";
import SettingsAppBlocks from "./SettingsAppBlocks";
import SettingsThemeTriggers from "./SettingsThemeTriggers";
import LayoutLibrary from "./LayoutLibrary";
import {
  SEED_SHAPES,
  SEED_BORDERS,
  SEED_PADDING,
  SEED_SHADOWS,
  SEED_TEXT_SIZES,
  SEED_TEXT_STYLES,
} from "../data/brand-tokens";
import type { LayoutDefinition } from "../data/layout-library";

type SettingsProps = {
  onNavigate: (view: string) => void;
  onSelectLayout?: (layout: LayoutDefinition) => void;
};

// Sub-pages within Settings (per brief Decision #5 Phase 2 +
// Theme/Layouts admin curation, 2026-05-15).
type SettingsSubView =
  | "general"
  | "colors"
  | "shapes"
  | "borders"
  | "padding"
  | "shadows"
  | "textsizes"
  | "textstyles"
  | "badge_layouts"
  | "banner_layouts"
  | "theme_triggers"
  | "app_blocks";

export default function Settings({ onNavigate, onSelectLayout }: SettingsProps) {
  const [subView, setSubView] = useState<SettingsSubView>("general");

  // ─── Sub-page wrapper (back button + child page) ─────────────────────────
  if (subView !== "general") {
    return (
      <div>
        <button type="button" onClick={() => setSubView("general")} className="sc-back">
          ‹ Back to Settings
        </button>
        {subView === "colors" && <SettingsColors />}
        {subView === "shapes" && (
          <SettingsBrandToken
            eyebrow="Shapes"
            title="Shapes"
            description="Badge corner styles. Each Style in Global Styles picks from this list for left and right corners — no free-form pixel values, so badge corners stay on-brand."
            tokens={SEED_SHAPES}
            columns={[
              {
                label: "Preview",
                width: "120px",
                render: (t) => (
                  <span
                    style={{
                      display: "inline-block",
                      width: 36,
                      height: 22,
                      background: "var(--color-oxford-blue)",
                      borderRadius: t.borderRadius,
                    }}
                  />
                ),
              },
              {
                label: "CSS",
                width: "140px",
                render: (t) => (
                  <code style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}>
                    border-radius: {t.borderRadius}
                  </code>
                ),
              },
            ]}
          />
        )}
        {subView === "borders" && (
          <SettingsBrandToken
            eyebrow="Borders"
            title="Borders"
            description="Border-width presets used everywhere Styles call for an outline. Curated so badge and banner borders stay consistent."
            tokens={SEED_BORDERS}
            columns={[
              {
                label: "Preview",
                width: "120px",
                render: (t) => (
                  <span
                    style={{
                      display: "inline-block",
                      width: 36,
                      height: 22,
                      background: "var(--bg-surface)",
                      border: `${t.width}px solid var(--color-oxford-blue)`,
                    }}
                  />
                ),
              },
              {
                label: "Width",
                width: "100px",
                render: (t) => (
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.width}px</span>
                ),
              },
            ]}
          />
        )}
        {subView === "padding" && (
          <SettingsBrandToken
            eyebrow="Padding"
            title="Padding"
            description="Internal spacing presets. Style editor picks Tight / Normal / Spacious / Generous instead of typing pixel values, so badge and banner padding stays consistent."
            tokens={SEED_PADDING}
            columns={[
              {
                label: "Preview",
                width: "160px",
                render: (t) => (
                  <span
                    style={{
                      display: "inline-block",
                      background: "var(--color-oxford-blue)",
                      color: "var(--text-inverse)",
                      padding: `${t.paddingY}px ${t.paddingX}px`,
                      fontSize: 11,
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                    }}
                  >
                    Sample
                  </span>
                ),
              },
              {
                label: "X / Y (px)",
                width: "100px",
                render: (t) => (
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {t.paddingX} / {t.paddingY}
                  </span>
                ),
              },
            ]}
          />
        )}
        {subView === "shadows" && (
          <SettingsBrandToken
            eyebrow="Shadows"
            title="Shadows"
            description="Box-shadow presets — controls the visual weight a Style carries off its surface. Most Styles use None or Soft; reserve Lifted for moments that need real lift."
            tokens={SEED_SHADOWS}
            columns={[
              {
                label: "Preview",
                width: "140px",
                render: (t) => (
                  <span
                    style={{
                      display: "inline-block",
                      width: 60,
                      height: 24,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: t.css,
                    }}
                  />
                ),
              },
              {
                label: "CSS",
                width: "1fr",
                render: (t) => (
                  <code style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}>
                    {t.css}
                  </code>
                ),
              },
            ]}
          />
        )}
        {subView === "textsizes" && (
          <SettingsBrandToken
            eyebrow="Text Sizes"
            title="Text Sizes"
            description="The Montserrat scale Styles use for badges, banner headlines, supporting copy, and fine print. Picking a named size guarantees Styles stack consistently across surfaces."
            tokens={SEED_TEXT_SIZES}
            columns={[
              {
                label: "Preview",
                width: "200px",
                render: (t) => (
                  <span style={{ fontSize: t.size, fontFamily: "var(--font-display)", color: "var(--color-oxford-blue)", fontWeight: 600 }}>
                    Aa
                  </span>
                ),
              },
              {
                label: "Size",
                width: "80px",
                render: (t) => (
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.size}px</span>
                ),
              },
            ]}
          />
        )}
        {subView === "textstyles" && (
          <SettingsBrandToken
            eyebrow="Text Styles"
            title="Text Styles"
            description="Weight + transform combos used across the editor. 'Bold Caps' is the badge-label default; 'Regular' is body copy; 'Italic' is for fine print and disclaimers."
            tokens={SEED_TEXT_STYLES}
            columns={[
              {
                label: "Preview",
                width: "180px",
                render: (t) => (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: t.weight,
                      fontStyle: t.italic ? "italic" : "normal",
                      textTransform: t.uppercase ? "uppercase" : "none",
                      color: "var(--color-oxford-blue)",
                      letterSpacing: t.uppercase ? "0.06em" : 0,
                      fontSize: 14,
                    }}
                  >
                    The quick brown fox
                  </span>
                ),
              },
              {
                label: "Spec",
                width: "1fr",
                render: (t) => (
                  <code style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}>
                    {t.weight}{t.italic ? " · italic" : ""}{t.uppercase ? " · uppercase" : ""}
                  </code>
                ),
              },
            ]}
          />
        )}
        {subView === "badge_layouts" && (
          <LayoutLibrary
            type="badge"
            onBack={() => setSubView("general")}
            onSelectLayout={(layout) => onSelectLayout?.(layout)}
          />
        )}
        {subView === "banner_layouts" && (
          <LayoutLibrary
            type="banner"
            onBack={() => setSubView("general")}
            onSelectLayout={(layout) => onSelectLayout?.(layout)}
          />
        )}
        {subView === "theme_triggers" && <SettingsThemeTriggers />}
        {subView === "app_blocks" && <SettingsAppBlocks />}
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="settings-group">
          <div className="settings-group-title">General</div>

          <div className="settings-card-surface">
            <div className="settings-row settings-row--status">
              <div className="settings-icon settings-icon--status">✓</div>
              <div className="settings-info">
                <div className="settings-info-title">App status</div>
                <div className="settings-info-subtitle">Campaign app is enabled</div>
              </div>
              <div className="settings-action">
                <button className="ghost-btn settings-action-btn" onClick={() => onNavigate("Overview")}>Disable</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="settings-group">
          <div className="settings-group-title">Brand</div>

          <div className="settings-card-surface">
            <button className="settings-row settings-row--nav" onClick={() => setSubView("colors")}>
              <span className="settings-icon settings-icon--nav">◐</span>
              <span className="settings-info">
                <span className="settings-info-title">Colors</span>
                <span className="settings-info-subtitle muted">Brand palette — the single source of truth for hex values. Styles consume these by name.</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("shapes")}>
              <span className="settings-icon settings-icon--nav">◧</span>
              <span className="settings-info">
                <span className="settings-info-title">Shapes</span>
                <span className="settings-info-subtitle muted">Badge corner styles (Square, Rounded, Pill, Tag). Styles pick from this list — no free-form radii.</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("borders")}>
              <span className="settings-icon settings-icon--nav">▢</span>
              <span className="settings-info">
                <span className="settings-info-title">Borders</span>
                <span className="settings-info-subtitle muted">Border-width presets used wherever a Style calls for an outline.</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("padding")}>
              <span className="settings-icon settings-icon--nav">⊟</span>
              <span className="settings-info">
                <span className="settings-info-title">Padding</span>
                <span className="settings-info-subtitle muted">Internal spacing presets (Tight, Normal, Spacious, Generous).</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("shadows")}>
              <span className="settings-icon settings-icon--nav">◌</span>
              <span className="settings-info">
                <span className="settings-info-title">Shadows</span>
                <span className="settings-info-subtitle muted">Box-shadow presets — controls the visual weight a Style carries off its surface.</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("textsizes")}>
              <span className="settings-icon settings-icon--nav">Aa</span>
              <span className="settings-info">
                <span className="settings-info-title">Text Sizes</span>
                <span className="settings-info-subtitle muted">The Montserrat scale Styles use for headlines, copy, fine print.</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("textstyles")}>
              <span className="settings-icon settings-icon--nav">B/I</span>
              <span className="settings-info">
                <span className="settings-info-title">Text Styles</span>
                <span className="settings-info-subtitle muted">Weight + transform combos (Regular, Bold, Bold Caps, Italic).</span>
              </span>
              <span className="settings-chevron">›</span>
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="settings-group">
          <div className="settings-group-title">Theme</div>
          <div className="settings-card-surface">
            <button className="settings-row settings-row--nav" onClick={() => setSubView("badge_layouts")}>
              <span className="settings-icon settings-icon--nav">⛶</span>
              <span className="settings-info">
                <span className="settings-info-title">Badge Layouts</span>
                <span className="settings-info-subtitle muted">
                  Placement patterns for where badges appear on product pages and collection grids.
                  Admins curate this list; coordinators pick a layout by name when building a badge.
                </span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("banner_layouts")}>
              <span className="settings-icon settings-icon--nav">▭</span>
              <span className="settings-info">
                <span className="settings-info-title">Banner Layouts</span>
                <span className="settings-info-subtitle muted">
                  Placement patterns for where banners appear (announcement bars, PDP strips,
                  cart drawer slots). Admin-curated; coordinators pick by name.
                </span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("theme_triggers")}>
              <span className="settings-icon settings-icon--nav">⚡</span>
              <span className="settings-info">
                <span className="settings-info-title">Theme Triggers</span>
                <span className="settings-info-subtitle muted">
                  Storefront events that re-render Flair (cart:update, variant:change, custom DOM
                  events). Presets cover popular themes; Event/Content for everything else.
                </span>
              </span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-row settings-row--nav" onClick={() => setSubView("app_blocks")}>
              <span className="settings-icon settings-icon--nav">⛬</span>
              <span className="settings-info">
                <span className="settings-info-title">App Blocks</span>
                <span className="settings-info-subtitle muted">
                  Status of Flair app blocks installed in your Shopify theme. Read-only stub;
                  full integration pending Shopify Admin API wiring (see code note for Nick).
                </span>
              </span>
              <span className="settings-chevron">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

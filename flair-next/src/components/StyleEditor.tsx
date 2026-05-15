// Style Editor — the canonical "design a Style" surface.
//
// Two-pane editor: As Badge / As Banner. Each surface holds its own full
// property set (per brief Decision #2). EVERY field is a dropdown picker
// reading from the Settings → Brand curated tokens — no free-form pixel
// inputs anywhere. Color fields source from Settings → Colors. WCAG
// indicator surfaces inline whenever a bg + text pair is picked.
//
// Architectural enforcement (brief Decision #5):
//   - Hex never visible in the editor; admins set it in Settings → Colors
//   - Px values never typed; admins curate the brand tokens in Settings
//   - Coordinators picking from the resulting Style library cannot drift

import { useMemo, useState } from "react";
import { SEED_COLORS } from "../data/color-palette";
import {
  SEED_SHAPES,
  SEED_BORDERS,
  SEED_PADDING,
  SEED_SHADOWS,
  SEED_TEXT_SIZES,
  SEED_TEXT_STYLES,
  SEED_LETTER_SPACING,
} from "../data/brand-tokens";
import {
  resolveColor,
  resolveTextSize,
  resolveTextStyle,
} from "../data/style-resolver";
import { BadgePreview, BannerPreview } from "./StylePreviews";
import type {
  Style,
  BadgeStyleConfig,
  BannerStyleConfig,
  BannerTextTier,
} from "../types/style";
import type { ColorId } from "../types/color";

// ─── WCAG helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function luminance(hex: string) {
  if (!hex.startsWith("#")) return 0.5;
  const { r, g, b } = hexToRgb(hex);
  const norm = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}
function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function wcagLabel(bg: string, fg: string, isLargeText: boolean) {
  const ratio = contrastRatio(bg, fg);
  const aaa = isLargeText ? 4.5 : 7.0;
  const aa = isLargeText ? 3.0 : 4.5;
  if (ratio >= aaa) return { level: "AAA", cls: "wcag--aaa", ratio: ratio.toFixed(2) };
  if (ratio >= aa) return { level: "AA", cls: "wcag--aa", ratio: ratio.toFixed(2) };
  return { level: "Fails", cls: "wcag--fail", ratio: ratio.toFixed(2) };
}

// ═══════════════════════════════════════════════════════════════════════════
// Color picker — name-only dropdown, no hex visible
// ═══════════════════════════════════════════════════════════════════════════
function ColorField({
  label,
  value,
  onChange,
  allowNone = false,
}: {
  label: string;
  value: ColorId | null;
  onChange: (v: ColorId | null) => void;
  allowNone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = value ? SEED_COLORS.find((c) => c.id === value) : null;
  return (
    <div className="se-field">
      <label className="se-field-label">{label}</label>
      <div
        className="se-picker"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
      >
        <span
          className="se-picker-swatch"
          style={{ background: current ? current.hex : "var(--bg-muted)" }}
        />
        <span className="se-picker-name">
          {current?.name ?? (allowNone ? "None" : "Select")}
        </span>
        <span className="se-picker-chev">▾</span>
        {open && (
          <div
            className="se-picker-pop"
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => e.stopPropagation()}
          >
            {allowNone && (
              <div
                className={"se-picker-item " + (value === null ? "is-active" : "")}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <span
                  className="se-picker-swatch"
                  style={{
                    background:
                      "linear-gradient(135deg, transparent 45%, #d33 45%, #d33 55%, transparent 55%), var(--bg-muted)",
                  }}
                />
                <span>None</span>
              </div>
            )}
            {SEED_COLORS.map((c) => (
              <div
                key={c.id}
                className={"se-picker-item " + (c.id === value ? "is-active" : "")}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                <span
                  className="se-picker-swatch"
                  style={{ background: c.hex }}
                />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Generic token dropdown
// ═══════════════════════════════════════════════════════════════════════════
function TokenField<T extends { id: string; name: string }>({
  label,
  value,
  options,
  onChange,
  preview,
}: {
  label: string;
  value: string;
  options: T[];
  onChange: (id: string) => void;
  preview?: (token: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <div className="se-field">
      <label className="se-field-label">{label}</label>
      <div
        className="se-picker"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
      >
        {preview && current && (
          <span className="se-picker-preview">{preview(current)}</span>
        )}
        <span className="se-picker-name">{current?.name ?? "Select"}</span>
        <span className="se-picker-chev">▾</span>
        {open && (
          <div
            className="se-picker-pop"
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o) => (
              <div
                key={o.id}
                className={"se-picker-item " + (o.id === value ? "is-active" : "")}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {preview && (
                  <span className="se-picker-preview">{preview(o)}</span>
                )}
                <span>{o.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Badge pane
// ═══════════════════════════════════════════════════════════════════════════
function BadgePane({
  config,
  onChange,
}: {
  config: BadgeStyleConfig;
  onChange: (c: BadgeStyleConfig) => void;
}) {
  const update = (patch: Partial<BadgeStyleConfig>) => onChange({ ...config, ...patch });

  const wcag = useMemo(() => {
    const bg = resolveColor(config.bgColor);
    const fg = resolveColor(config.textColor);
    if (bg === "transparent" || fg === "transparent") return null;
    const px = resolveTextSize(config.textSize);
    const style = resolveTextStyle(config.textStyle);
    const isLarge = px >= 24 || (px >= 19 && style.weight >= 600);
    return wcagLabel(bg, fg, isLarge);
  }, [config.bgColor, config.textColor, config.textSize, config.textStyle]);

  return (
    <div className="se-pane">
      <h3 className="se-pane-title">As Badge</h3>
      <div className="se-preview-shell">
        <BadgePreview config={config} label="BADGE TEXT" />
      </div>

      <div className="se-section-label">Color</div>
      <ColorField
        label="Background"
        value={config.bgColor}
        onChange={(v) => v && update({ bgColor: v })}
      />
      <div className="se-field-with-meta">
        <ColorField
          label="Text color"
          value={config.textColor}
          onChange={(v) => v && update({ textColor: v })}
        />
        {wcag && (
          <div className={"se-wcag " + wcag.cls}>
            {wcag.level} <span className="se-wcag-ratio">{wcag.ratio}:1</span>
          </div>
        )}
      </div>
      <ColorField
        label="Border color"
        value={config.borderColor}
        onChange={(v) => update({ borderColor: v })}
        allowNone
      />

      <div className="se-section-label">Shape</div>
      <TokenField
        label="Left corner"
        value={config.leftShape}
        options={SEED_SHAPES}
        onChange={(id) => update({ leftShape: id })}
        preview={(t) => (
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 14,
              background: "var(--color-oxford-blue)",
              borderTopLeftRadius: t.borderRadius,
              borderBottomLeftRadius: t.borderRadius,
            }}
          />
        )}
      />
      <TokenField
        label="Right corner"
        value={config.rightShape}
        options={SEED_SHAPES}
        onChange={(id) => update({ rightShape: id })}
        preview={(t) => (
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 14,
              background: "var(--color-oxford-blue)",
              borderTopRightRadius: t.borderRadius,
              borderBottomRightRadius: t.borderRadius,
            }}
          />
        )}
      />

      <div className="se-section-label">Type</div>
      <TokenField
        label="Text size"
        value={config.textSize}
        options={SEED_TEXT_SIZES}
        onChange={(id) => update({ textSize: id })}
        preview={(t) => (
          <span style={{ fontSize: Math.min(t.size, 18), fontWeight: 600 }}>Aa</span>
        )}
      />
      <TokenField
        label="Text style"
        value={config.textStyle}
        options={SEED_TEXT_STYLES}
        onChange={(id) => update({ textStyle: id })}
        preview={(t) => (
          <span
            style={{
              fontWeight: t.weight,
              fontStyle: t.italic ? "italic" : "normal",
              textTransform: t.uppercase ? "uppercase" : "none",
              fontSize: 12,
            }}
          >
            {t.uppercase ? "AB" : "Ab"}
          </span>
        )}
      />
      <TokenField
        label="Letter spacing"
        value={config.letterSpacing}
        options={SEED_LETTER_SPACING}
        onChange={(id) => update({ letterSpacing: id })}
      />

      <div className="se-section-label">Spacing & frame</div>
      <TokenField
        label="Padding"
        value={config.padding}
        options={SEED_PADDING}
        onChange={(id) => update({ padding: id })}
      />
      <TokenField
        label="Border size"
        value={config.borderSize}
        options={SEED_BORDERS}
        onChange={(id) => update({ borderSize: id })}
      />
      <TokenField
        label="Shadow"
        value={config.shadow}
        options={SEED_SHADOWS}
        onChange={(id) => update({ shadow: id })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Banner pane
// ═══════════════════════════════════════════════════════════════════════════
function BannerPane({
  config,
  onChange,
}: {
  config: BannerStyleConfig;
  onChange: (c: BannerStyleConfig) => void;
}) {
  const update = (patch: Partial<BannerStyleConfig>) => onChange({ ...config, ...patch });
  const updateTier = (
    tier: "headline" | "copy" | "details",
    patch: Partial<BannerTextTier>,
  ) => onChange({ ...config, [tier]: { ...config[tier], ...patch } });

  return (
    <div className="se-pane">
      <h3 className="se-pane-title">As Banner</h3>
      <div className="se-preview-shell">
        <BannerPreview config={config} />
      </div>

      <div className="se-section-label">Frame</div>
      <ColorField
        label="Background"
        value={config.bgColor}
        onChange={(v) => v && update({ bgColor: v })}
      />
      <ColorField
        label="Border color"
        value={config.borderColor}
        onChange={(v) => update({ borderColor: v })}
        allowNone
      />
      <TokenField
        label="Border size"
        value={config.borderSize}
        options={SEED_BORDERS}
        onChange={(id) => update({ borderSize: id })}
      />
      <TokenField
        label="Padding"
        value={config.padding}
        options={SEED_PADDING}
        onChange={(id) => update({ padding: id })}
      />
      <TokenField
        label="Shadow"
        value={config.shadow}
        options={SEED_SHADOWS}
        onChange={(id) => update({ shadow: id })}
      />

      {(["headline", "copy", "details"] as const).map((tierKey) => (
        <BannerTierFieldset
          key={tierKey}
          label={tierKey === "headline" ? "Headline" : tierKey === "copy" ? "Copy" : "Details"}
          tier={config[tierKey]}
          bgColor={config.bgColor}
          onChange={(patch) => updateTier(tierKey, patch)}
        />
      ))}
    </div>
  );
}

function BannerTierFieldset({
  label,
  tier,
  bgColor,
  onChange,
}: {
  label: string;
  tier: BannerTextTier;
  bgColor: ColorId;
  onChange: (patch: Partial<BannerTextTier>) => void;
}) {
  const wcag = useMemo(() => {
    const bg = resolveColor(bgColor);
    const fg = resolveColor(tier.color);
    if (bg === "transparent" || fg === "transparent") return null;
    const px = resolveTextSize(tier.textSize);
    const style = resolveTextStyle(tier.textStyle);
    const isLarge = px >= 24 || (px >= 19 && style.weight >= 600);
    return wcagLabel(bg, fg, isLarge);
  }, [bgColor, tier.color, tier.textSize, tier.textStyle]);

  return (
    <div className="se-tier">
      <div className="se-section-label se-tier-label">
        {label} text
        {wcag && (
          <span className={"se-wcag " + wcag.cls} style={{ marginLeft: "auto" }}>
            {wcag.level} <span className="se-wcag-ratio">{wcag.ratio}:1</span>
          </span>
        )}
      </div>
      <ColorField
        label="Color"
        value={tier.color}
        onChange={(v) => v && onChange({ color: v })}
      />
      <TokenField
        label="Size"
        value={tier.textSize}
        options={SEED_TEXT_SIZES}
        onChange={(id) => onChange({ textSize: id })}
        preview={(t) => (
          <span style={{ fontSize: Math.min(t.size, 18), fontWeight: 600 }}>Aa</span>
        )}
      />
      <TokenField
        label="Style"
        value={tier.textStyle}
        options={SEED_TEXT_STYLES}
        onChange={(id) => onChange({ textStyle: id })}
        preview={(t) => (
          <span
            style={{
              fontWeight: t.weight,
              fontStyle: t.italic ? "italic" : "normal",
              textTransform: t.uppercase ? "uppercase" : "none",
              fontSize: 12,
            }}
          >
            {t.uppercase ? "AB" : "Ab"}
          </span>
        )}
      />
      <TokenField
        label="Letter spacing"
        value={tier.letterSpacing}
        options={SEED_LETTER_SPACING}
        onChange={(id) => onChange({ letterSpacing: id })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Default configs — used when enabling a surface from null
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_BADGE: BadgeStyleConfig = {
  bgColor: "clr_001",
  textColor: "clr_013",
  borderColor: null,
  borderSize: "brd_none",
  leftShape: "shp_rounded",
  rightShape: "shp_rounded",
  textSize: "tsz_small",
  textStyle: "tst_bold_caps",
  padding: "pad_normal",
  letterSpacing: "lsp_wide",
  shadow: "shd_none",
};

const DEFAULT_TIER: BannerTextTier = {
  textSize: "tsz_body",
  textStyle: "tst_regular",
  letterSpacing: "lsp_normal",
  color: "clr_013",
};

const DEFAULT_BANNER: BannerStyleConfig = {
  bgColor: "clr_001",
  borderColor: null,
  borderSize: "brd_none",
  padding: "pad_spacious",
  shadow: "shd_none",
  headline: { ...DEFAULT_TIER, textSize: "tsz_h4", textStyle: "tst_bold_caps", letterSpacing: "lsp_wide" },
  copy: { ...DEFAULT_TIER },
  details: { ...DEFAULT_TIER, textSize: "tsz_small", textStyle: "tst_italic" },
};

// ═══════════════════════════════════════════════════════════════════════════
// Main editor
// ═══════════════════════════════════════════════════════════════════════════
export default function StyleEditor({
  style,
  onSave,
  onCancel,
  onDelete,
}: {
  style: Style;
  onSave: (updated: Style) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}) {
  const [working, setWorking] = useState<Style>(style);
  const dirty = JSON.stringify(working) !== JSON.stringify(style);

  return (
    <div className="se-editor">
      <div className="se-editor-head">
        <button type="button" className="sc-back" onClick={onCancel}>
          ‹ Back to Global Styles
        </button>
        <div className="se-editor-title-row">
          <input
            type="text"
            className="se-editor-name"
            value={working.name}
            onChange={(e) => setWorking({ ...working, name: e.target.value })}
            placeholder="Style name"
          />
          <div className="se-editor-actions">
            {onDelete && !working.isDefault && (
              <button
                type="button"
                className="sc-btn sc-btn--danger"
                onClick={() => onDelete(working.id)}
                title="Delete this Style"
              >
                Delete
              </button>
            )}
            <button type="button" className="sc-btn sc-btn--ghost" onClick={onCancel}>
              Discard
            </button>
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              disabled={!dirty || !working.name.trim()}
              onClick={() => onSave({ ...working, updatedAt: new Date().toISOString() })}
            >
              Save changes
            </button>
          </div>
        </div>
        <textarea
          className="se-editor-desc"
          value={working.description ?? ""}
          onChange={(e) => setWorking({ ...working, description: e.target.value })}
          placeholder="Optional description — where you'd use this Style, who it's for"
          rows={2}
        />
      </div>

      <div className="se-panes">
        {working.badge ? (
          <div className="se-pane-shell">
            <button
              type="button"
              className="se-pane-disable"
              onClick={() => setWorking({ ...working, badge: null })}
              title="Make this Style unavailable for Badges"
            >
              Disable badge
            </button>
            <BadgePane
              config={working.badge}
              onChange={(badge) => setWorking({ ...working, badge })}
            />
          </div>
        ) : (
          <div className="se-pane se-pane-empty">
            <h3 className="se-pane-title">As Badge</h3>
            <p className="se-pane-empty-deck">
              This Style isn't configured for the Badge surface. Add a configuration to make it pickable
              when creating a badge.
            </p>
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              onClick={() => setWorking({ ...working, badge: DEFAULT_BADGE })}
            >
              + Configure for Badge
            </button>
          </div>
        )}

        {working.banner ? (
          <div className="se-pane-shell">
            <button
              type="button"
              className="se-pane-disable"
              onClick={() => setWorking({ ...working, banner: null })}
              title="Make this Style unavailable for Banners"
            >
              Disable banner
            </button>
            <BannerPane
              config={working.banner}
              onChange={(banner) => setWorking({ ...working, banner })}
            />
          </div>
        ) : (
          <div className="se-pane se-pane-empty">
            <h3 className="se-pane-title">As Banner</h3>
            <p className="se-pane-empty-deck">
              This Style isn't configured for the Banner surface. Add a configuration to make it pickable
              when creating a banner.
            </p>
            <button
              type="button"
              className="sc-btn sc-btn--primary"
              onClick={() => setWorking({ ...working, banner: DEFAULT_BANNER })}
            >
              + Configure for Banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

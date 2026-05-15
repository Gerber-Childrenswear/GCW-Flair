// Style Editor — the canonical "design a Style" surface.
//
// Two-pane editor: As Badge / As Banner side-by-side. Both visible at once;
// no tabs, no shared "all surfaces" summary strip. Each surface holds its
// own full property set (per brief Decision #2). EVERY field is a dropdown
// picker reading from the Settings → Brand curated tokens — no segmented
// buttons or stepper numerics, no raw hex/px (per brief Decision #5).
// WCAG indicator surfaces inline whenever a bg + text pair is picked.
//
// Countdown is a Banner sub-element, not a peer surface — its styling
// lives inside the Banner pane below the three text tiers. Every Style
// carries countdown styling whether or not any banner instance opts in.

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
  BannerTextAlign,
  BannerCountdownConfig,
  BannerCountdownVariant,
} from "../types/style";
import type { ColorId } from "../types/color";

// ─── Text alignment options — small enum, presented as a dropdown so it
//     matches the rest of the editor's "pick from a named list" feel.
const TEXT_ALIGN_OPTIONS: { id: BannerTextAlign; name: string }[] = [
  { id: "left",   name: "Left" },
  { id: "center", name: "Center" },
  { id: "right",  name: "Right" },
];

// ─── Countdown variant — block layout (per-segment cards w/ labels) vs
//     separator layout (HH:MM:SS-style inline digits, no labels).
const COUNTDOWN_VARIANT_OPTIONS: { id: BannerCountdownVariant; name: string }[] = [
  { id: "blocks",    name: "Background blocks" },
  { id: "separator", name: "Colon separator" },
];

// ═══════════════════════════════════════════════════════════════════════════
// WCAG helpers
// ═══════════════════════════════════════════════════════════════════════════
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

// Walk every text-on-background pair in the working Style and return a list
// of failures (ratios below AA). Used to gate Save and surface a warning.
function computeWcagFailures(style: Style): string[] {
  const fails: string[] = [];
  const check = (bgId: ColorId | null, tier: { color: ColorId; textSize: string; textStyle: string }, label: string) => {
    const bg = resolveColor(bgId);
    const fg = resolveColor(tier.color);
    if (bg === "transparent" || fg === "transparent") return;
    const px = resolveTextSize(tier.textSize);
    const ts = resolveTextStyle(tier.textStyle);
    const isLarge = px >= 24 || (px >= 19 && ts.weight >= 600);
    const w = wcagLabel(bg, fg, isLarge);
    if (w.level === "Fails") fails.push(`${label} (${w.ratio}:1)`);
  };
  if (style.badge) {
    check(
      style.badge.bgColor,
      { color: style.badge.textColor, textSize: style.badge.textSize, textStyle: style.badge.textStyle },
      "Badge text on background",
    );
  }
  if (style.banner) {
    const b = style.banner;
    check(b.bgColor, b.headline, "Banner headline on background");
    check(b.bgColor, b.copy,     "Banner copy on background");
    check(b.bgColor, b.details,  "Banner details on background");
    if (b.countdown.variant === "separator") {
      // Digits + separators sit on the banner background; labels aren't rendered.
      check(b.bgColor, b.countdown.digit, "Countdown digit on banner background");
      // Separator inherits the digit's font-size for large-text classification.
      check(
        b.bgColor,
        { color: b.countdown.separatorColor, textSize: b.countdown.digit.textSize, textStyle: b.countdown.digit.textStyle },
        "Countdown separator on banner background",
      );
    } else {
      check(b.countdown.blockBgColor, b.countdown.digit, "Countdown digit on block");
      check(b.countdown.blockBgColor, b.countdown.label, "Countdown label on block");
    }
  }
  return fails;
}

// ═══════════════════════════════════════════════════════════════════════════
// Color picker — swatch + name + dropdown, no hex visible
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
                <span className="se-picker-swatch" style={{ background: c.hex }} />
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
// Generic token dropdown — pulls the full curated Settings → Brand set for
// the given options. Never subset.
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
// Section — collapsible wrapper with chevron + title + optional meta slot.
// Lets a designer hide groups they aren't editing so the preview at the top
// of the pane stays in view.
// ═══════════════════════════════════════════════════════════════════════════
function Section({
  title,
  meta,
  defaultOpen,
  variant = "default",
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "tier";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div
      className={
        "se-section" +
        (variant === "tier" ? " se-section--tier" : "") +
        (open ? " is-open" : " is-closed")
      }
    >
      <button
        type="button"
        className="se-section-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="se-section-chev" aria-hidden>▾</span>
        <span className="se-section-title">{title}</span>
        {meta && <span className="se-section-meta">{meta}</span>}
      </button>
      {open && <div className="se-section-body">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Badge pane — left column
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

      <Section
        title="Color"
        meta={
          wcag && (
            <span className={"se-wcag " + wcag.cls}>
              {wcag.level} <span className="se-wcag-ratio">{wcag.ratio}:1</span>
            </span>
          )
        }
      >
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => v && update({ bgColor: v })}
        />
        <ColorField
          label="Text color"
          value={config.textColor}
          onChange={(v) => v && update({ textColor: v })}
        />
        <ColorField
          label="Border color"
          value={config.borderColor}
          onChange={(v) => update({ borderColor: v })}
          allowNone
        />
      </Section>

      <Section title="Shape">
        <TokenField
          label="Shape"
          value={config.shape}
          options={SEED_SHAPES}
          onChange={(id) => update({ shape: id })}
          preview={(t) => (
            <span
              style={{
                display: "inline-block",
                width: 18,
                height: 14,
                background: "var(--color-oxford-blue)",
                borderRadius: t.borderRadius,
              }}
            />
          )}
        />
      </Section>

      <Section title="Type">
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
      </Section>

      <Section title="Spacing & frame">
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
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Banner pane — right column. Has frame fields, a banner-level text
// alignment, and three text tiers (Headline / Copy / Details).
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
  const updateCountdown = (patch: Partial<BannerCountdownConfig>) =>
    onChange({ ...config, countdown: { ...config.countdown, ...patch } });
  const updateCountdownTier = (
    tier: "digit" | "label",
    patch: Partial<BannerTextTier>,
  ) =>
    onChange({
      ...config,
      countdown: { ...config.countdown, [tier]: { ...config.countdown[tier], ...patch } },
    });

  return (
    <div className="se-pane">
      <h3 className="se-pane-title">As Banner</h3>
      <div className="se-preview-shell">
        <BannerPreview config={config} showCountdown />
      </div>

      <Section title="Frame">
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
        <TokenField
          label="Text alignment"
          value={config.textAlign}
          options={TEXT_ALIGN_OPTIONS}
          onChange={(id) => update({ textAlign: id as BannerTextAlign })}
        />
      </Section>

      {(["headline", "copy", "details"] as const).map((tierKey) => (
        <BannerTierFieldset
          key={tierKey}
          label={tierKey === "headline" ? "Headline" : tierKey === "copy" ? "Copy" : "Details"}
          tier={config[tierKey]}
          bgColor={config.bgColor}
          onChange={(patch) => updateTier(tierKey, patch)}
        />
      ))}

      <CountdownFieldset
        countdown={config.countdown}
        bannerBgColor={config.bgColor}
        onChange={updateCountdown}
        onChangeTier={updateCountdownTier}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Countdown fieldset — sub-element of the Banner. Always defined in the
// Style; per-campaign banner instances opt in to actually render it.
// ═══════════════════════════════════════════════════════════════════════════
function CountdownFieldset({
  countdown,
  bannerBgColor,
  onChange,
  onChangeTier,
}: {
  countdown: BannerCountdownConfig;
  bannerBgColor: ColorId;
  onChange: (patch: Partial<BannerCountdownConfig>) => void;
  onChangeTier: (tier: "digit" | "label", patch: Partial<BannerTextTier>) => void;
}) {
  // The Countdown carries TWO contrast checks. In blocks mode: digit and
  // label, both on the block bg. In separator mode: digit and separator,
  // both on the banner bg. Both are surfaced as separate pills so a passing
  // digit can't mask a failing label/separator at a glance.
  const wcagChecks = useMemo(() => {
    const pair = (
      bgId: ColorId,
      fgId: ColorId,
      sizeId: string,
      styleId: string,
    ) => {
      const bg = resolveColor(bgId);
      const fg = resolveColor(fgId);
      if (bg === "transparent" || fg === "transparent") return null;
      const px = resolveTextSize(sizeId);
      const ts = resolveTextStyle(styleId);
      const isLarge = px >= 24 || (px >= 19 && ts.weight >= 600);
      return wcagLabel(bg, fg, isLarge);
    };
    const rows =
      countdown.variant === "separator"
        ? [
            { role: "Digit",     result: pair(bannerBgColor, countdown.digit.color, countdown.digit.textSize, countdown.digit.textStyle) },
            // Separator inherits the digit's size class for the AA/AAA boundary.
            { role: "Separator", result: pair(bannerBgColor, countdown.separatorColor, countdown.digit.textSize, countdown.digit.textStyle) },
          ]
        : [
            { role: "Digit", result: pair(countdown.blockBgColor, countdown.digit.color, countdown.digit.textSize, countdown.digit.textStyle) },
            { role: "Label", result: pair(countdown.blockBgColor, countdown.label.color, countdown.label.textSize, countdown.label.textStyle) },
          ];
    return rows.flatMap((r) => (r.result ? [{ role: r.role, result: r.result }] : []));
  }, [
    countdown.variant,
    countdown.blockBgColor,
    bannerBgColor,
    countdown.separatorColor,
    countdown.digit.color,
    countdown.digit.textSize,
    countdown.digit.textStyle,
    countdown.label.color,
    countdown.label.textSize,
    countdown.label.textStyle,
  ]);

  const isBlocks = countdown.variant === "blocks";

  return (
    <Section
      variant="tier"
      title="Countdown"
      meta={
        wcagChecks.length > 0 && (
          <span className="se-wcag-group">
            {wcagChecks.map((c, i) => (
              <span key={c.role} className="se-wcag-group-item">
                {i > 0 && <span className="se-wcag-sep" aria-hidden>/</span>}
                <span className={"se-wcag " + c.result.cls}>
                  <span className="se-wcag-role">{c.role}</span> {c.result.level}{" "}
                  <span className="se-wcag-ratio">{c.result.ratio}:1</span>
                </span>
              </span>
            ))}
          </span>
        )
      }
    >
      <TokenField
        label="Variant"
        value={countdown.variant}
        options={COUNTDOWN_VARIANT_OPTIONS}
        onChange={(id) => onChange({ variant: id as BannerCountdownVariant })}
      />

      {!isBlocks && (
        <ColorField
          label="Separator color"
          value={countdown.separatorColor}
          onChange={(v) => v && onChange({ separatorColor: v })}
        />
      )}

      {isBlocks && (
        <>
          <ColorField
            label="Block background"
            value={countdown.blockBgColor}
            onChange={(v) => v && onChange({ blockBgColor: v })}
          />
          <ColorField
            label="Block border color"
            value={countdown.blockBorderColor}
            onChange={(v) => onChange({ blockBorderColor: v })}
            allowNone
          />
          <TokenField
            label="Block border size"
            value={countdown.blockBorderSize}
            options={SEED_BORDERS}
            onChange={(id) => onChange({ blockBorderSize: id })}
          />
          <TokenField
            label="Block shape"
            value={countdown.blockShape}
            options={SEED_SHAPES}
            onChange={(id) => onChange({ blockShape: id })}
            preview={(t) => (
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 14,
                  background: "var(--color-oxford-blue)",
                  borderRadius: t.borderRadius,
                }}
              />
            )}
          />
          <TokenField
            label="Block padding"
            value={countdown.blockPadding}
            options={SEED_PADDING}
            onChange={(id) => onChange({ blockPadding: id })}
          />
          <TokenField
            label="Block shadow"
            value={countdown.blockShadow}
            options={SEED_SHADOWS}
            onChange={(id) => onChange({ blockShadow: id })}
          />
        </>
      )}

      <div className="se-section-label">Digit</div>
      <ColorField
        label="Color"
        value={countdown.digit.color}
        onChange={(v) => v && onChangeTier("digit", { color: v })}
      />
      <TokenField
        label="Size"
        value={countdown.digit.textSize}
        options={SEED_TEXT_SIZES}
        onChange={(id) => onChangeTier("digit", { textSize: id })}
        preview={(t) => (
          <span style={{ fontSize: Math.min(t.size, 18), fontWeight: 600 }}>Aa</span>
        )}
      />
      <TokenField
        label="Style"
        value={countdown.digit.textStyle}
        options={SEED_TEXT_STYLES}
        onChange={(id) => onChangeTier("digit", { textStyle: id })}
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
        value={countdown.digit.letterSpacing}
        options={SEED_LETTER_SPACING}
        onChange={(id) => onChangeTier("digit", { letterSpacing: id })}
      />

      {isBlocks && (
        <>
          <div className="se-section-label">Label</div>
          <ColorField
            label="Color"
            value={countdown.label.color}
            onChange={(v) => v && onChangeTier("label", { color: v })}
          />
          <TokenField
            label="Size"
            value={countdown.label.textSize}
            options={SEED_TEXT_SIZES}
            onChange={(id) => onChangeTier("label", { textSize: id })}
            preview={(t) => (
              <span style={{ fontSize: Math.min(t.size, 18), fontWeight: 600 }}>Aa</span>
            )}
          />
          <TokenField
            label="Style"
            value={countdown.label.textStyle}
            options={SEED_TEXT_STYLES}
            onChange={(id) => onChangeTier("label", { textStyle: id })}
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
            value={countdown.label.letterSpacing}
            options={SEED_LETTER_SPACING}
            onChange={(id) => onChangeTier("label", { letterSpacing: id })}
          />
        </>
      )}
    </Section>
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
    <Section
      variant="tier"
      title={`${label} text`}
      meta={
        wcag && (
          <span className={"se-wcag " + wcag.cls}>
            {wcag.level} <span className="se-wcag-ratio">{wcag.ratio}:1</span>
          </span>
        )
      }
    >
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
    </Section>
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
  shape: "shp_rounded",
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
  textAlign: "center",
  headline: { ...DEFAULT_TIER, textSize: "tsz_h4", textStyle: "tst_bold_caps", letterSpacing: "lsp_wide" },
  copy: { ...DEFAULT_TIER },
  details: { ...DEFAULT_TIER, textSize: "tsz_small", textStyle: "tst_italic" },
  countdown: {
    variant: "blocks",
    blockBgColor: "clr_013",
    blockBorderColor: null,
    blockBorderSize: "brd_none",
    blockShape: "shp_rounded",
    blockPadding: "pad_normal",
    blockShadow: "shd_none",
    separatorColor: "clr_013",
    digit: { textSize: "tsz_h4", textStyle: "tst_bold",     letterSpacing: "lsp_normal", color: "clr_001" },
    label: { textSize: "tsz_caption", textStyle: "tst_bold_caps", letterSpacing: "lsp_wide",  color: "clr_001" },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Main editor — head + two-pane body, both surfaces always visible.
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
  const wcagFailures = useMemo(() => computeWcagFailures(working), [working]);
  const blockedByWcag = wcagFailures.length > 0;

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
              disabled={!dirty || !working.name.trim() || blockedByWcag}
              onClick={() => onSave({ ...working, updatedAt: new Date().toISOString() })}
              title={blockedByWcag ? "Fix WCAG failures before saving" : undefined}
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

      {blockedByWcag && (
        <div className="se-wcag-banner" role="alert">
          <div className="se-wcag-banner-title">
            ⚠ Can't save — {wcagFailures.length} contrast {wcagFailures.length === 1 ? "pair fails" : "pairs fail"} WCAG
          </div>
          <ul className="se-wcag-banner-list">
            {wcagFailures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

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

// Live Badge + Banner preview components — used by both the Global Styles
// list view (small) and the Style editor (large). All rendering goes
// through the style resolver so token edits cascade automatically.

import {
  resolveBadgeStyle,
  resolveBannerStyle,
} from "../data/style-resolver";
import type { BadgeStyleConfig, BannerStyleConfig } from "../types/style";

// ─── Badge preview ───────────────────────────────────────────────────────────
export function BadgePreview({
  config,
  label = "BADGE TEXT",
  scale = 1,
}: {
  config: BadgeStyleConfig;
  label?: string;
  scale?: number;
}) {
  const r = resolveBadgeStyle(config);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: r.bg,
        color: r.text,
        borderRadius: `${r.leftRadius} ${r.rightRadius} ${r.rightRadius} ${r.leftRadius}`,
        padding: `${r.paddingY * scale}px ${r.paddingX * scale}px`,
        fontSize: `${r.fontSize * scale}px`,
        fontWeight: r.fontWeight,
        fontStyle: r.italic ? "italic" : "normal",
        textTransform: r.uppercase ? "uppercase" : "none",
        letterSpacing: `${r.letterSpacing}em`,
        border:
          r.borderWidth > 0 && r.borderColor !== "transparent"
            ? `${r.borderWidth}px solid ${r.borderColor}`
            : "none",
        boxShadow: r.shadow,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      {label}
    </span>
  );
}

// ─── Banner preview ──────────────────────────────────────────────────────────
export function BannerPreview({
  config,
  headlineText = "BANNER HEADLINE",
  copyText = "Supporting copy line — what the shopper needs to know.",
  detailsText = "Terms apply. Some restrictions.",
  scale = 1,
  width,
}: {
  config: BannerStyleConfig;
  headlineText?: string;
  copyText?: string;
  detailsText?: string;
  scale?: number;
  width?: number | string;
}) {
  const r = resolveBannerStyle(config);
  return (
    <div
      style={{
        background: r.bg,
        padding: `${r.paddingY * scale}px ${r.paddingX * scale}px`,
        border:
          r.borderWidth > 0 && r.borderColor !== "transparent"
            ? `${r.borderWidth}px solid ${r.borderColor}`
            : "none",
        boxShadow: r.shadow,
        width: width ?? "100%",
        display: "flex",
        flexDirection: "column",
        gap: 4 * scale,
        fontFamily: "var(--font-sans)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: `${r.headline.fontSize * scale}px`,
          fontWeight: r.headline.fontWeight,
          fontStyle: r.headline.italic ? "italic" : "normal",
          textTransform: r.headline.uppercase ? "uppercase" : "none",
          letterSpacing: `${r.headline.letterSpacing}em`,
          color: r.headline.color,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {headlineText}
      </div>
      <div
        style={{
          fontSize: `${r.copy.fontSize * scale}px`,
          fontWeight: r.copy.fontWeight,
          fontStyle: r.copy.italic ? "italic" : "normal",
          textTransform: r.copy.uppercase ? "uppercase" : "none",
          letterSpacing: `${r.copy.letterSpacing}em`,
          color: r.copy.color,
          lineHeight: 1.35,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {copyText}
      </div>
      <div
        style={{
          fontSize: `${r.details.fontSize * scale}px`,
          fontWeight: r.details.fontWeight,
          fontStyle: r.details.italic ? "italic" : "normal",
          textTransform: r.details.uppercase ? "uppercase" : "none",
          letterSpacing: `${r.details.letterSpacing}em`,
          color: r.details.color,
          lineHeight: 1.4,
          opacity: 0.92,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {detailsText}
      </div>
    </div>
  );
}

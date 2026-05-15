// Live Badge + Banner preview components — used by both the Global Styles
// list view (small) and the Style editor (large). All rendering goes
// through the style resolver so token edits cascade automatically.

import {
  resolveBadgeStyle,
  resolveBannerStyle,
} from "../data/style-resolver";
import type { BadgeStyleConfig, BannerStyleConfig } from "../types/style";

// ─── Badge preview ───────────────────────────────────────────────────────────
// Renders text by default. Pass `image` to render the merchant's uploaded
// image inside the Style's frame instead — bg / border / radius / shadow /
// padding still apply; text-specific fields (font, colour, letter spacing,
// etc.) are ignored when an image is shown.
export function BadgePreview({
  config,
  label = "BADGE TEXT",
  scale = 1,
  image,
}: {
  config: BadgeStyleConfig;
  label?: string;
  scale?: number;
  image?: {
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
  } | null;
}) {
  const r = resolveBadgeStyle(config);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: r.bg,
        color: r.text,
        borderRadius: r.radius,
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
      {image ? (
        <img
          src={image.url}
          alt={image.alt}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      ) : (
        label
      )}
    </span>
  );
}

// ─── Banner preview ──────────────────────────────────────────────────────────
// The countdown sub-element is styled in every Style (even when no per-campaign
// banner uses it). Set `showCountdown` to render the countdown row in the
// preview — the editor opts in so the user can see what they're styling; the
// list view leaves it off to keep small previews readable.
export function BannerPreview({
  config,
  headlineText = "BANNER HEADLINE",
  copyText = "Supporting copy line — what the shopper needs to know.",
  detailsText = "Terms apply. Some restrictions.",
  scale = 1,
  width,
  showCountdown = false,
}: {
  config: BannerStyleConfig;
  headlineText?: string;
  copyText?: string;
  detailsText?: string;
  scale?: number;
  width?: number | string;
  showCountdown?: boolean;
}) {
  const r = resolveBannerStyle(config);
  const justify =
    r.textAlign === "center" ? "center" : r.textAlign === "right" ? "flex-end" : "flex-start";
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
        textAlign: r.textAlign,
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
      {showCountdown && (
        r.countdown.variant === "separator" ? (
          <div
            style={{
              marginTop: 10 * scale,
              display: "flex",
              justifyContent: justify,
              alignItems: "baseline",
              gap: 8 * scale,
            }}
          >
            {["02", "14", "38", "12"].map((digit, i) => {
              const c = r.countdown;
              return (
                <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 8 * scale }}>
                  <span
                    style={{
                      fontSize: `${c.digit.fontSize * scale}px`,
                      fontWeight: c.digit.fontWeight,
                      fontStyle: c.digit.italic ? "italic" : "normal",
                      textTransform: c.digit.uppercase ? "uppercase" : "none",
                      letterSpacing: `${c.digit.letterSpacing}em`,
                      color: c.digit.color,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1,
                    }}
                  >
                    {digit}
                  </span>
                  {i < 3 && (
                    <span
                      aria-hidden
                      style={{
                        fontSize: `${c.digit.fontSize * scale}px`,
                        fontWeight: c.digit.fontWeight,
                        color: c.separatorColor,
                        lineHeight: 1,
                      }}
                    >
                      :
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              marginTop: 10 * scale,
              display: "flex",
              justifyContent: justify,
              gap: 8 * scale,
              flexWrap: "wrap",
            }}
          >
            {[
              { digit: "02", label: "Days" },
              { digit: "14", label: "Hrs" },
              { digit: "38", label: "Min" },
              { digit: "12", label: "Sec" },
            ].map(({ digit, label }) => {
              const c = r.countdown;
              return (
                <div
                  key={label}
                  style={{
                    background: c.blockBg,
                    border:
                      c.blockBorderWidth > 0 && c.blockBorderColor !== "transparent"
                        ? `${c.blockBorderWidth}px solid ${c.blockBorderColor}`
                        : "none",
                    borderRadius: c.blockRadius,
                    boxShadow: c.blockShadow,
                    padding: `${c.blockPaddingY * scale}px ${c.blockPaddingX * scale}px`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44 * scale,
                    lineHeight: 1.1,
                  }}
                >
                  <div
                    style={{
                      fontSize: `${c.digit.fontSize * scale}px`,
                      fontWeight: c.digit.fontWeight,
                      fontStyle: c.digit.italic ? "italic" : "normal",
                      textTransform: c.digit.uppercase ? "uppercase" : "none",
                      letterSpacing: `${c.digit.letterSpacing}em`,
                      color: c.digit.color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {digit}
                  </div>
                  <div
                    style={{
                      fontSize: `${c.label.fontSize * scale}px`,
                      fontWeight: c.label.fontWeight,
                      fontStyle: c.label.italic ? "italic" : "normal",
                      textTransform: c.label.uppercase ? "uppercase" : "none",
                      letterSpacing: `${c.label.letterSpacing}em`,
                      color: c.label.color,
                      marginTop: 2 * scale,
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

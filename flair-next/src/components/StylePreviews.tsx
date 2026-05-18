// Live Badge + Banner preview components — used by both the Global Styles
// list view (small) and the Style editor (large). All rendering goes
// through the style resolver so token edits cascade automatically.

import { useEffect, useState } from "react";
import {
  resolveBadgeStyle,
  resolveBannerStyle,
} from "../data/style-resolver";
import type { BadgeStyleConfig, BannerStyleConfig } from "../types/style";
import type { BannerElement } from "../types/campaign";
import { DEFAULT_BANNER_ELEMENT_ORDER } from "../types/campaign";

// Two-digit zero-padded.
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// Compute days/hours/minutes/seconds remaining until `endsAt`. Clamps at
// zero. Used by the banner preview's live countdown ticker.
function computeCountdown(endsAt: Date | null | undefined): {
  d: string;
  h: string;
  m: string;
  s: string;
} {
  if (!endsAt) return { d: "02", h: "14", m: "38", s: "12" };
  const ms = Math.max(0, endsAt.getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d: pad2(d), h: pad2(h), m: pad2(m), s: pad2(s) };
}

// Live ticker hook — re-renders every second when an endsAt is provided.
function useCountdown(endsAt: Date | null | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return computeCountdown(endsAt);
}

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
// Renders the four banner elements in the order specified by elementOrder
// (Headline · Copy · Details · Countdown by default). Any element whose
// text is blank is skipped — that's how merchants "hide" an element from
// the storefront render. The countdown sub-element is styled by every
// Style even when no Campaign uses it; the merchant's typed
// countdownLabel renders above the digits, and the digits themselves come
// from a live ticker against countdownEndsAt (the BannerEditor passes
// "now + 48h" so the preview is reviewable).
//
// Legacy callers without elementOrder fall through to the default order
// with all three text tiers rendered (countdown opt-in via the legacy
// showCountdown flag).
export function BannerPreview({
  config,
  headlineText = "BANNER HEADLINE",
  copyText = "Supporting copy line — what the shopper needs to know.",
  detailsText = "Terms apply. Some restrictions.",
  countdownLabel = "",
  countdownEndsAt = null,
  countdownEnabled,
  elementOrder,
  scale = 1,
  width,
  showCountdown = false,
}: {
  config: BannerStyleConfig;
  headlineText?: string;
  copyText?: string;
  detailsText?: string;
  countdownLabel?: string;
  countdownEndsAt?: Date | null;
  // Explicit on/off for the countdown element. When undefined we fall back
  // to legacy behaviour (rendered if endsAt or showCountdown is set), so
  // the Style editor preview keeps working without passing the new flag.
  countdownEnabled?: boolean;
  elementOrder?: BannerElement[];
  scale?: number;
  width?: number | string;
  showCountdown?: boolean;
}) {
  const r = resolveBannerStyle(config);
  const justify =
    r.textAlign === "center" ? "center" : r.textAlign === "right" ? "flex-end" : "flex-start";

  const ticker = useCountdown(countdownEndsAt);

  // Whether each element should render. Blank text hides; countdown is
  // shown when an endsAt is supplied OR when the legacy showCountdown flag
  // is set (kept so the GlobalStyles editor preview still works).
  const order = elementOrder && elementOrder.length > 0 ? elementOrder : DEFAULT_BANNER_ELEMENT_ORDER;
  // Countdown visibility:
  // - If the new BannerEditor passes `countdownEnabled` explicitly, honour
  //   that boolean (the merchant's on/off switch wins).
  // - Otherwise fall back to the legacy logic: visible when showCountdown
  //   is set or when a live endsAt is supplied (Style editor preview path).
  const countdownVisible =
    countdownEnabled !== undefined
      ? countdownEnabled
      : showCountdown || countdownEndsAt !== null;

  const visible: Record<BannerElement, boolean> = {
    headline: !!headlineText.trim(),
    copy:     !!copyText.trim(),
    details:  !!detailsText.trim(),
    countdown: countdownVisible,
  };

  const renderElement = (key: BannerElement) => {
    if (!visible[key]) return null;
    switch (key) {
      case "headline":
        return (
          <div
            key="headline"
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
        );
      case "copy":
        return (
          <div
            key="copy"
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
        );
      case "details":
        return (
          <div
            key="details"
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
        );
      case "countdown":
        return (
          <div
            key="countdown"
            style={{ display: "flex", flexDirection: "column", gap: 6 * scale, alignItems: justify === "center" ? "center" : justify === "flex-end" ? "flex-end" : "flex-start" }}
          >
            {countdownLabel.trim() && (
              <div
                style={{
                  fontSize: `${r.details.fontSize * scale}px`,
                  fontWeight: r.details.fontWeight,
                  color: r.details.color,
                  letterSpacing: `${r.details.letterSpacing}em`,
                  textTransform: r.details.uppercase ? "uppercase" : "none",
                  opacity: 0.92,
                }}
              >
                {countdownLabel}
              </div>
            )}
            {renderCountdownDigits()}
          </div>
        );
    }
  };

  // Internal — render the digits block (separator or block variant).
  function renderCountdownDigits() {
    const c = r.countdown;
    if (c.variant === "separator") {
      const parts = [ticker.d, ticker.h, ticker.m, ticker.s];
      return (
        <div
          style={{
            display: "flex",
            justifyContent: justify,
            alignItems: "baseline",
            gap: 8 * scale,
          }}
        >
          {parts.map((digit, i) => (
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
              {i < parts.length - 1 && (
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
          ))}
        </div>
      );
    }
    const blocks = [
      { digit: ticker.d, label: "Days" },
      { digit: ticker.h, label: "Hrs"  },
      { digit: ticker.m, label: "Min"  },
      { digit: ticker.s, label: "Sec"  },
    ];
    return (
      <div
        style={{
          display: "flex",
          justifyContent: justify,
          gap: 8 * scale,
          flexWrap: "wrap",
        }}
      >
        {blocks.map(({ digit, label }) => (
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
        ))}
      </div>
    );
  }

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
        gap: 8 * scale,
        fontFamily: "var(--font-sans)",
        boxSizing: "border-box",
        overflow: "hidden",
        textAlign: r.textAlign,
      }}
    >
      {order.map((key) => renderElement(key))}
    </div>
  );
}

// Style resolver — looks up brand tokens by ID to produce concrete CSS
// values for rendering. The Style type stores token IDs only; this is
// where the cascade lands at the leaf.
//
// Every preview component, every render path, every export goes through
// these resolvers. Change a token in Settings → resolver picks up the
// new value automatically.

import { SEED_COLORS } from "./color-palette";
import {
  SEED_SHAPES,
  SEED_BORDERS,
  SEED_PADDING,
  SEED_SHADOWS,
  SEED_TEXT_SIZES,
  SEED_TEXT_STYLES,
  SEED_LETTER_SPACING,
} from "./brand-tokens";
import type {
  BadgeStyleConfig,
  BannerStyleConfig,
  BannerTextTier,
} from "../types/style";
import type { ColorId } from "../types/color";

// ─── Single-token resolvers ──────────────────────────────────────────────────
export function resolveColor(id: ColorId | null | undefined): string {
  if (!id) return "transparent";
  return SEED_COLORS.find((c) => c.id === id)?.hex ?? "#ccc";
}

export function resolveShapeRadius(id: string): string {
  return SEED_SHAPES.find((s) => s.id === id)?.borderRadius ?? "0";
}

export function resolveBorderWidth(id: string): number {
  return SEED_BORDERS.find((b) => b.id === id)?.width ?? 0;
}

export function resolvePadding(id: string): { x: number; y: number } {
  const t = SEED_PADDING.find((p) => p.id === id);
  return { x: t?.paddingX ?? 12, y: t?.paddingY ?? 6 };
}

export function resolveShadowCss(id: string): string {
  return SEED_SHADOWS.find((s) => s.id === id)?.css ?? "none";
}

export function resolveTextSize(id: string): number {
  return SEED_TEXT_SIZES.find((t) => t.id === id)?.size ?? 14;
}

export function resolveTextStyle(id: string): {
  weight: number;
  italic: boolean;
  uppercase: boolean;
} {
  const t = SEED_TEXT_STYLES.find((s) => s.id === id);
  return {
    weight: t?.weight ?? 400,
    italic: t?.italic ?? false,
    uppercase: t?.uppercase ?? false,
  };
}

export function resolveLetterSpacing(id: string): number {
  return SEED_LETTER_SPACING.find((l) => l.id === id)?.value ?? 0;
}

// ─── Aggregated resolvers — one call returns everything to render ──────────
export type ResolvedBadgeStyle = {
  bg: string;
  text: string;
  borderColor: string;
  borderWidth: number;
  leftRadius: string;
  rightRadius: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  uppercase: boolean;
  paddingX: number;
  paddingY: number;
  letterSpacing: number;
  shadow: string;
};

export function resolveBadgeStyle(badge: BadgeStyleConfig): ResolvedBadgeStyle {
  const text = resolveTextStyle(badge.textStyle);
  const pad = resolvePadding(badge.padding);
  return {
    bg: resolveColor(badge.bgColor),
    text: resolveColor(badge.textColor),
    borderColor: resolveColor(badge.borderColor),
    borderWidth: resolveBorderWidth(badge.borderSize),
    leftRadius: resolveShapeRadius(badge.leftShape),
    rightRadius: resolveShapeRadius(badge.rightShape),
    fontSize: resolveTextSize(badge.textSize),
    fontWeight: text.weight,
    italic: text.italic,
    uppercase: text.uppercase,
    paddingX: pad.x,
    paddingY: pad.y,
    letterSpacing: resolveLetterSpacing(badge.letterSpacing),
    shadow: resolveShadowCss(badge.shadow),
  };
}

export type ResolvedBannerTier = {
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  uppercase: boolean;
  letterSpacing: number;
  color: string;
};

export function resolveBannerTier(tier: BannerTextTier): ResolvedBannerTier {
  const text = resolveTextStyle(tier.textStyle);
  return {
    fontSize: resolveTextSize(tier.textSize),
    fontWeight: text.weight,
    italic: text.italic,
    uppercase: text.uppercase,
    letterSpacing: resolveLetterSpacing(tier.letterSpacing),
    color: resolveColor(tier.color),
  };
}

export type ResolvedBannerStyle = {
  bg: string;
  borderColor: string;
  borderWidth: number;
  paddingX: number;
  paddingY: number;
  shadow: string;
  headline: ResolvedBannerTier;
  copy: ResolvedBannerTier;
  details: ResolvedBannerTier;
};

export function resolveBannerStyle(banner: BannerStyleConfig): ResolvedBannerStyle {
  const pad = resolvePadding(banner.padding);
  return {
    bg: resolveColor(banner.bgColor),
    borderColor: resolveColor(banner.borderColor),
    borderWidth: resolveBorderWidth(banner.borderSize),
    paddingX: pad.x,
    paddingY: pad.y,
    shadow: resolveShadowCss(banner.shadow),
    headline: resolveBannerTier(banner.headline),
    copy: resolveBannerTier(banner.copy),
    details: resolveBannerTier(banner.details),
  };
}

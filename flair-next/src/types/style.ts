// Global Style types — the canonical visual library of Flair.
//
// One Style holds two full surface configurations (Badge + Banner). Each
// surface is independent — no shared/inheritance layer.
//
// Every visual property is a reference to a curated brand token from
// Settings → Brand (color, shape, border, padding, shadow, text size,
// text style, letter spacing). No raw px / hex / css values land in the
// Style record — that's the Phase 2 cascade protection from Decision #5.
// Edit a token in Settings → it cascades to every Style using it → which
// cascades to every Badge / Banner using those Styles.
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision
// #2 — two surface configurations; Countdown is a Banner sub-element).

import type { ColorId } from "./color";
import type {
  ShapeId,
  BorderId,
  PaddingId,
  ShadowId,
  TextSizeId,
  TextStyleId,
  LetterSpacingId,
} from "./brand-tokens";

export type StyleId = string;

// ─── Banner text tier (Headline / Copy / Details) ───────────────────────────
// Each tier references typography tokens by ID — same enforcement as colors.
export type BannerTextTier = {
  textSize: TextSizeId;
  textStyle: TextStyleId;
  letterSpacing: LetterSpacingId;
  color: ColorId;
};

// ─── Badge surface configuration ─────────────────────────────────────────────
export type BadgeStyleConfig = {
  bgColor: ColorId;
  textColor: ColorId;
  borderColor: ColorId | null;
  borderSize: BorderId;
  shape: ShapeId;
  textSize: TextSizeId;
  textStyle: TextStyleId;
  padding: PaddingId;
  letterSpacing: LetterSpacingId;
  shadow: ShadowId;
};

// ─── Banner surface configuration ────────────────────────────────────────────
// Banner has three text tiers + the shared frame (bg, padding, border, shadow).
// Countdowns are a per-instance Banner add-on, not part of the Style.
export type BannerTextAlign = "left" | "center" | "right";

// ─── Banner countdown sub-element ────────────────────────────────────────────
// Every Style defines how a countdown would look IF the banner using this
// Style opts in. Whether a per-campaign banner actually renders a countdown
// is a per-instance choice (handled elsewhere); the Style only carries the
// visual contract. Digit and label reuse the BannerTextTier shape so they
// pick from the same Settings → Brand typography tokens.
// "blocks": each digit sits in a styled block with a label beneath.
// "separator": digits render inline separated by ":", no blocks/labels —
// block + label fields are ignored in that mode.
export type BannerCountdownVariant = "blocks" | "separator";

export type BannerCountdownConfig = {
  variant: BannerCountdownVariant;
  blockBgColor: ColorId;
  blockBorderColor: ColorId | null;
  blockBorderSize: BorderId;
  blockShape: ShapeId;
  blockPadding: PaddingId;
  blockShadow: ShadowId;
  separatorColor: ColorId;
  digit: BannerTextTier;
  label: BannerTextTier;
};

export type BannerStyleConfig = {
  bgColor: ColorId;
  borderColor: ColorId | null;
  borderSize: BorderId;
  padding: PaddingId;
  shadow: ShadowId;
  textAlign: BannerTextAlign;
  headline: BannerTextTier;
  copy: BannerTextTier;
  details: BannerTextTier;
  countdown: BannerCountdownConfig;
};

// ─── Style ───────────────────────────────────────────────────────────────────
// A Style may be defined for only one surface — the other slot stays null
// and that Style is simply not pickable for that surface (per Decision #2).
//
// isDefault: exactly one Style at a time carries the system-default flag.
// New badges and banners inherit it when the user doesn't explicitly pick
// a Style. Setting one Style as default clears the flag on the previous
// default (radio-button semantics).
export type Style = {
  id: StyleId;
  name: string;
  description?: string;
  badge: BadgeStyleConfig | null;
  banner: BannerStyleConfig | null;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Audit log ───────────────────────────────────────────────────────────────
export type StyleAuditAction =
  | "add"
  | "edit_name"
  | "edit_badge"
  | "edit_banner"
  | "delete"
  | "duplicate"
  | "set_default";

export type StyleAuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: StyleAuditAction;
  targetId: StyleId;
  diff?: {
    before?: Partial<Style>;
    after?: Partial<Style>;
  };
};

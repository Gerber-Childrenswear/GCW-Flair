// Global Style types — the canonical visual library of Flair.
//
// One Style holds two full surface configurations (Badge + Banner). Each
// surface is independent — no shared/inheritance layer. Colors are
// referenced by stable ColorId from Settings → Colors; no hex inputs in
// the Style editor.
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision
// #2 — two surface configurations; Countdown is a Banner sub-element).

import type { ColorId } from "./color";

export type StyleId = string; // e.g. "sty_summer_sale"

// ─── Shape vocabulary (Badge only — Banners are rectangular) ────────────────
export type BadgeShape = "square" | "rounded" | "pill" | "tag";

// ─── Shadow scale (shared across surfaces) ───────────────────────────────────
export type ShadowLevel = "none" | "sm" | "md";

// ─── Text style presets (Badge label only — banners use per-tier weights) ───
export type BadgeTextStyle = "regular" | "medium" | "bold-caps";

// ─── Banner text tier (Headline / Copy / Details) ───────────────────────────
export type BannerTextTier = {
  size: number;            // px
  weight: 400 | 500 | 600 | 700;
  italic: boolean;
  uppercase: boolean;
  letterSpacing: number;   // em
  color: ColorId;
};

// ─── Badge surface configuration ─────────────────────────────────────────────
export type BadgeStyleConfig = {
  bgColor: ColorId;
  textColor: ColorId;
  borderColor: ColorId | null; // null = no border (transparent)
  borderSize: number;          // px
  leftShape: BadgeShape;
  rightShape: BadgeShape;
  textSize: number;            // px
  textStyle: BadgeTextStyle;
  paddingX: number;            // px
  paddingY: number;            // px
  letterSpacing: number;       // em
  shadow: ShadowLevel;
};

// ─── Banner surface configuration ────────────────────────────────────────────
// Banner has three text tiers + the shared frame (bg, padding, border, shadow).
// Countdowns are a per-instance Banner add-on, not part of the Style.
export type BannerStyleConfig = {
  bgColor: ColorId;
  borderColor: ColorId | null;
  borderSize: number;
  paddingX: number;
  paddingY: number;
  shadow: ShadowLevel;
  headline: BannerTextTier;
  copy: BannerTextTier;
  details: BannerTextTier;
};

// ─── Style ───────────────────────────────────────────────────────────────────
// A Style may be defined for only one surface — the other slot stays null
// and that Style is simply not pickable for that surface (per Decision #2).
export type Style = {
  id: StyleId;
  name: string;          // display label, e.g. "Summer Sale"
  description?: string;
  badge: BadgeStyleConfig | null;
  banner: BannerStyleConfig | null;
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
  | "duplicate";

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

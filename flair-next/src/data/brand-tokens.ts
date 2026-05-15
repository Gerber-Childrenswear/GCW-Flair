// Brand token seed data — the curated visual options consumed by the
// Global Styles editor. See types/brand-tokens.ts for the type shapes
// and Projects/2026-05-flair-app-redesign/_brief.md (Decision #5) for
// the architecture.
//
// These are starter sets; each Settings sub-page lets the admin add /
// edit / delete tokens with the same audit + delete-with-transfer flow
// as Colors.

import type {
  ShapeToken,
  BorderToken,
  PaddingToken,
  ShadowToken,
  TextSizeToken,
  TextStyleToken,
  LetterSpacingToken,
} from "../types/brand-tokens";

// ─── Shapes (Badge corner styles) ───────────────────────────────────────────
export const SEED_SHAPES: ShapeToken[] = [
  { id: "shp_square",  name: "Square",  borderRadius: "0",     sortOrder: 0 },
  { id: "shp_rounded", name: "Rounded", borderRadius: "4px",   sortOrder: 1 },
  { id: "shp_pill",    name: "Pill",    borderRadius: "999px", sortOrder: 2 },
  { id: "shp_tag",     name: "Tag",     borderRadius: "12px",  sortOrder: 3 },
];

// ─── Border sizes ───────────────────────────────────────────────────────────
export const SEED_BORDERS: BorderToken[] = [
  { id: "brd_none",   name: "None",   width: 0, sortOrder: 0 },
  { id: "brd_thin",   name: "Thin",   width: 1, sortOrder: 1 },
  { id: "brd_medium", name: "Medium", width: 2, sortOrder: 2 },
  { id: "brd_thick",  name: "Thick",  width: 3, sortOrder: 3 },
];

// ─── Padding presets ────────────────────────────────────────────────────────
export const SEED_PADDING: PaddingToken[] = [
  { id: "pad_tight",    name: "Tight",    paddingX:  8, paddingY:  4, sortOrder: 0 },
  { id: "pad_normal",   name: "Normal",   paddingX: 12, paddingY:  6, sortOrder: 1 },
  { id: "pad_spacious", name: "Spacious", paddingX: 16, paddingY: 10, sortOrder: 2 },
  { id: "pad_generous", name: "Generous", paddingX: 24, paddingY: 16, sortOrder: 3 },
];

// ─── Shadow presets ─────────────────────────────────────────────────────────
export const SEED_SHADOWS: ShadowToken[] = [
  { id: "shd_none",   name: "None",   css: "none",                                       sortOrder: 0 },
  { id: "shd_soft",   name: "Soft",   css: "0 1px 0 rgba(22, 29, 37, 0.04)",             sortOrder: 1 },
  { id: "shd_card",   name: "Card",   css: "0 1px 2px rgba(22, 29, 37, 0.06)",           sortOrder: 2 },
  { id: "shd_lifted", name: "Lifted", css: "0 4px 6px rgba(22, 29, 37, 0.1)",            sortOrder: 3 },
];

// ─── Text sizes (Montserrat scale aligned with the design system) ──────────
export const SEED_TEXT_SIZES: TextSizeToken[] = [
  { id: "tsz_caption",   name: "Caption",     size: 11, sortOrder: 0 },
  { id: "tsz_small",     name: "Small",       size: 12, sortOrder: 1 },
  { id: "tsz_body",      name: "Body",        size: 14, sortOrder: 2 },
  { id: "tsz_body_lg",   name: "Body Large",  size: 16, sortOrder: 3 },
  { id: "tsz_h4",        name: "Heading 4",   size: 22, sortOrder: 4 },
  { id: "tsz_h3",        name: "Heading 3",   size: 28, sortOrder: 5 },
  { id: "tsz_h2",        name: "Heading 2",   size: 32, sortOrder: 6 },
  { id: "tsz_h1",        name: "Heading 1",   size: 40, sortOrder: 7 },
];

// ─── Text styles (weight + transform combos) ───────────────────────────────
export const SEED_TEXT_STYLES: TextStyleToken[] = [
  { id: "tst_regular",    name: "Regular",    weight: 400, italic: false, uppercase: false, sortOrder: 0 },
  { id: "tst_medium",     name: "Medium",     weight: 500, italic: false, uppercase: false, sortOrder: 1 },
  { id: "tst_semibold",   name: "Semibold",   weight: 600, italic: false, uppercase: false, sortOrder: 2 },
  { id: "tst_bold",       name: "Bold",       weight: 700, italic: false, uppercase: false, sortOrder: 3 },
  { id: "tst_bold_caps",  name: "Bold Caps",  weight: 700, italic: false, uppercase: true,  sortOrder: 4 },
  { id: "tst_italic",     name: "Italic",     weight: 400, italic: true,  uppercase: false, sortOrder: 5 },
];

// ─── Letter spacing ─────────────────────────────────────────────────────────
export const SEED_LETTER_SPACING: LetterSpacingToken[] = [
  { id: "lsp_tight",  name: "Tight",  value: -0.02, sortOrder: 0 },
  { id: "lsp_normal", name: "Normal", value:  0,    sortOrder: 1 },
  { id: "lsp_wide",   name: "Wide",   value:  0.06, sortOrder: 2 },
  { id: "lsp_wider",  name: "Wider",  value:  0.08, sortOrder: 3 },
];

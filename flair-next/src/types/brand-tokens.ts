// Brand token types — the curated visual options Global Styles draws
// from. Same architectural pattern as Color (stable ID, display name,
// CRUD with delete-with-transfer, audit log). Phase 2+ of Decision #5
// in the vision brief.
//
// Each token category defines a small curated set of named values. The
// Style editor (Global Styles) picks from these dropdowns rather than
// letting designers type raw px/css values — same enforcement layer as
// Colors, applied to shape / border / padding / shadow / text scale.

// ─── Shape (badge corners) ───────────────────────────────────────────────────
// Used for Badge left-shape / right-shape pickers. Banner is always
// rectangular so it doesn't consume Shape tokens.
export type ShapeId = string;
export type ShapeToken = {
  id: ShapeId;
  name: string;             // "Square", "Rounded", "Pill", "Tag"
  borderRadius: string;     // canonical CSS value, e.g. "999px" or "0"
  sortOrder: number;
};

// ─── Border size ────────────────────────────────────────────────────────────
export type BorderId = string;
export type BorderToken = {
  id: BorderId;
  name: string;             // "None", "Thin", "Medium", "Thick"
  width: number;            // px
  sortOrder: number;
};

// ─── Padding preset ─────────────────────────────────────────────────────────
export type PaddingId = string;
export type PaddingToken = {
  id: PaddingId;
  name: string;             // "Tight", "Normal", "Spacious", "Generous"
  paddingX: number;         // px
  paddingY: number;         // px
  sortOrder: number;
};

// ─── Shadow preset ──────────────────────────────────────────────────────────
export type ShadowId = string;
export type ShadowToken = {
  id: ShadowId;
  name: string;             // "None", "Soft", "Card", "Lifted"
  css: string;              // box-shadow CSS or "none"
  sortOrder: number;
};

// ─── Text size ──────────────────────────────────────────────────────────────
export type TextSizeId = string;
export type TextSizeToken = {
  id: TextSizeId;
  name: string;             // "Caption", "Small", "Body", "Body Large", "H4"...
  size: number;             // px
  sortOrder: number;
};

// ─── Text style (weight + transform combos) ────────────────────────────────
export type TextStyleId = string;
export type TextStyleToken = {
  id: TextStyleId;
  name: string;             // "Regular", "Medium", "Semibold", "Bold", "Bold Caps", "Italic"
  weight: 400 | 500 | 600 | 700 | 800;
  italic: boolean;
  uppercase: boolean;
  sortOrder: number;
};

// ─── Letter spacing ─────────────────────────────────────────────────────────
export type LetterSpacingId = string;
export type LetterSpacingToken = {
  id: LetterSpacingId;
  name: string;             // "Tight", "Normal", "Wide", "Wider"
  value: number;            // em
  sortOrder: number;
};

// ─── Generic categorical audit entry for brand tokens ──────────────────────
export type BrandTokenCategory =
  | "shape"
  | "border"
  | "padding"
  | "shadow"
  | "textsize"
  | "textstyle"
  | "letterspacing";

export type BrandTokenAuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  category: BrandTokenCategory;
  action: "add" | "edit" | "delete" | "import" | "export";
  targetId: string;
  diff?: { before?: unknown; after?: unknown };
};

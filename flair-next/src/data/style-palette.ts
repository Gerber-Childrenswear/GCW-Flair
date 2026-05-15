// Style palette seed data — initial population of Global Styles.
//
// Each Style references colors by ID from data/color-palette.ts so the
// cascade demonstrated in the brief (edit a color in Settings → all Styles
// using it shift → all instances render the new color) works end-to-end
// in the prototype.
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision
// #2 + Decision #5).

import type { Style, StyleAuditEntry } from "../types/style";

const SEED_TIMESTAMP = new Date().toISOString();
const SEED_ACTOR = "darilee@gerberchildrenswear.com";

// ─── Color IDs from the seeded palette (data/color-palette.ts) ──────────────
// Keeping these as named constants so the seed reads clearly. In production
// the editor picks color IDs via the Settings → Colors dropdown.
const C = {
  oxfordBlue:   "clr_001",
  jordyBlue:    "clr_002",
  hawkesBlue:   "clr_003",
  springWood:   "clr_004",
  maize:        "clr_005",
  sandyBrown:   "clr_006",
  geraldine:    "clr_007",
  seaNymph:     "clr_008",
  white:        "clr_013",
  coralSale:    "clr_018",
  coralTint:    "clr_019",
};

// ─── Seeded Styles ───────────────────────────────────────────────────────────
// Five starter Styles spanning the brand vocabulary. Designed to show the
// editor's range: solid-dark, sale-red, soft-light, accent-pill,
// banner-only.
export const SEED_STYLES: Style[] = [
  {
    id: "sty_default_navy",
    name: "Default Navy",
    description: "The system default. Solid Oxford Blue with white text — the safe answer when a campaign doesn't specify a style.",
    isDefault: true,
    badge: {
      bgColor: C.oxfordBlue,
      textColor: C.white,
      borderColor: null,
      borderSize: 0,
      leftShape: "rounded",
      rightShape: "rounded",
      textSize: 12,
      textStyle: "bold-caps",
      paddingX: 12,
      paddingY: 6,
      letterSpacing: 0.06,
      shadow: "none",
    },
    banner: {
      bgColor: C.oxfordBlue,
      borderColor: null,
      borderSize: 0,
      paddingX: 24,
      paddingY: 18,
      shadow: "none",
      headline: { size: 22, weight: 700, italic: false, uppercase: true, letterSpacing: 0.06, color: C.white },
      copy:     { size: 14, weight: 400, italic: false, uppercase: false, letterSpacing: 0,    color: C.white },
      details:  { size: 12, weight: 400, italic: true,  uppercase: false, letterSpacing: 0,    color: C.white },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_summer_sale",
    name: "Summer Sale",
    description: "Maize background with Oxford Blue text. Used through the warm-weather promo windows.",
    badge: {
      bgColor: C.maize,
      textColor: C.oxfordBlue,
      borderColor: null,
      borderSize: 0,
      leftShape: "pill",
      rightShape: "pill",
      textSize: 12,
      textStyle: "bold-caps",
      paddingX: 14,
      paddingY: 6,
      letterSpacing: 0.06,
      shadow: "none",
    },
    banner: {
      bgColor: C.maize,
      borderColor: null,
      borderSize: 0,
      paddingX: 24,
      paddingY: 18,
      shadow: "none",
      headline: { size: 22, weight: 700, italic: false, uppercase: true, letterSpacing: 0.06, color: C.oxfordBlue },
      copy:     { size: 14, weight: 400, italic: false, uppercase: false, letterSpacing: 0,    color: C.oxfordBlue },
      details:  { size: 12, weight: 400, italic: true,  uppercase: false, letterSpacing: 0,    color: C.oxfordBlue },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_final_hours",
    name: "Final Hours",
    description: "Sale red treatment — short-window promos, last-chance messaging.",
    badge: {
      bgColor: C.coralSale,
      textColor: C.white,
      borderColor: null,
      borderSize: 0,
      leftShape: "square",
      rightShape: "square",
      textSize: 12,
      textStyle: "bold-caps",
      paddingX: 12,
      paddingY: 6,
      letterSpacing: 0.08,
      shadow: "none",
    },
    banner: {
      bgColor: C.coralSale,
      borderColor: null,
      borderSize: 0,
      paddingX: 24,
      paddingY: 18,
      shadow: "none",
      headline: { size: 22, weight: 700, italic: false, uppercase: true, letterSpacing: 0.08, color: C.white },
      copy:     { size: 14, weight: 500, italic: false, uppercase: false, letterSpacing: 0,    color: C.white },
      details:  { size: 12, weight: 400, italic: true,  uppercase: false, letterSpacing: 0,    color: C.coralTint },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_trust_pill",
    name: "Trust Pill",
    description: "Soft Hawkes Blue pill — newsletter, free-shipping reassurance, product trust signals. Badge only.",
    badge: {
      bgColor: C.hawkesBlue,
      textColor: C.oxfordBlue,
      borderColor: null,
      borderSize: 0,
      leftShape: "pill",
      rightShape: "pill",
      textSize: 11,
      textStyle: "medium",
      paddingX: 12,
      paddingY: 4,
      letterSpacing: 0.04,
      shadow: "none",
    },
    banner: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_soft_newsletter",
    name: "Soft Newsletter",
    description: "Spring Wood surface with Oxford Blue type. Quiet announcements, newsletter signups. Banner only.",
    badge: null,
    banner: {
      bgColor: C.springWood,
      borderColor: C.hawkesBlue,
      borderSize: 1,
      paddingX: 28,
      paddingY: 20,
      shadow: "none",
      headline: { size: 22, weight: 600, italic: false, uppercase: false, letterSpacing: -0.01, color: C.oxfordBlue },
      copy:     { size: 14, weight: 400, italic: false, uppercase: false, letterSpacing: 0,     color: C.oxfordBlue },
      details:  { size: 12, weight: 400, italic: false, uppercase: false, letterSpacing: 0,     color: C.oxfordBlue },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

// ─── Seed audit log ──────────────────────────────────────────────────────────
export const SEED_STYLE_AUDIT_LOG: StyleAuditEntry[] = [
  {
    id: "style_audit_001",
    timestamp: SEED_TIMESTAMP,
    actor: SEED_ACTOR,
    action: "add",
    targetId: "_palette",
    diff: { after: { name: "Initial Style library — 5 starter Styles" } },
  },
];
